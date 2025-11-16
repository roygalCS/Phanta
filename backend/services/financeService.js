const env = require('../config/loadEnv');
const { DEFAULT_MODEL: GEMINI_MODEL, generateContent: generateGeminiContent } = require('./geminiClient');
const solanaPortfolioService = require('./solanaPortfolioService');
const heliusService = require('./heliusService');

// Calculate performance trend from real transaction history
const calculatePerformanceTrend = (transactions, currentValue, solPrice, walletAddress = '') => {
  const now = Date.now();
  const hours = [6, 12, 18, 24];
  const labels = hours.map(h => `${h}h`);
  const usdBalances = [];
  
  // If no transactions, show flat line
  if (!transactions || transactions.length === 0) {
    return {
      labels,
      usdBalances: [currentValue, currentValue, currentValue, currentValue],
      cryptoHoldings: []
    };
  }
  
  // Calculate value at each time point based on transaction history
  for (const hoursAgo of hours) {
    const targetTime = now - (hoursAgo * 60 * 60 * 1000);
    
    // Sum all transactions after target time to estimate past value
    let solChange = 0;
    
    for (const tx of transactions) {
      const txTime = (tx.blockTime || 0) * 1000;
      if (txTime >= targetTime && txTime <= now) {
        // This transaction happened in the time window we're calculating
        // Parse to get SOL change
        if (tx.nativeTransfers) {
          for (const transfer of tx.nativeTransfers) {
            const amount = transfer.amount / 1000000000; // Convert lamports to SOL
            if (walletAddress && transfer.toUserAccount === walletAddress) {
              solChange += amount; // Received SOL
            } else if (walletAddress && transfer.fromUserAccount === walletAddress) {
              solChange -= amount; // Sent SOL
            }
          }
        } else if (tx.meta && tx.meta.preBalances && tx.meta.postBalances) {
          // Fallback: estimate from balance changes
          const preTotal = tx.meta.preBalances.reduce((a, b) => a + b, 0);
          const postTotal = tx.meta.postBalances.reduce((a, b) => a + b, 0);
          const change = (postTotal - preTotal) / 1000000000;
          if (Math.abs(change) > 0.000001) {
            solChange += change;
          }
        }
      }
    }
    
    // Estimate value at that time (current value minus transactions in that window)
    const estimatedValue = currentValue - (solChange * solPrice);
    usdBalances.push(Math.max(0, estimatedValue));
  }
  
  return {
    labels,
    usdBalances,
    cryptoHoldings: []
  };
};

// Parse transaction to extract real data
const parseTransaction = (tx, walletAddress) => {
  const LAMPORTS_PER_SOL = 1000000000;
  let amountSol = 0;
  let type = 'Transaction';
  let asset = 'SOL';
  let counterparty = 'Unknown';
  let isIncoming = false;
  
  try {
    // Parse Helius enhanced transaction format
    if (tx.nativeTransfers) {
      for (const transfer of tx.nativeTransfers) {
        if (transfer.toUserAccount === walletAddress) {
          amountSol += transfer.amount / LAMPORTS_PER_SOL;
          isIncoming = true;
          counterparty = transfer.fromUserAccount || 'Unknown';
        } else if (transfer.fromUserAccount === walletAddress) {
          amountSol += transfer.amount / LAMPORTS_PER_SOL;
          isIncoming = false;
          counterparty = transfer.toUserAccount || 'Unknown';
        }
      }
    }
    
    // Parse Solana RPC transaction format
    if (tx.meta && tx.transaction && tx.transaction.message) {
      const preBalances = tx.meta.preBalances || [];
      const postBalances = tx.meta.postBalances || [];
      const accountKeys = tx.transaction.message.accountKeys || [];
      
      // Find wallet index
      const walletIndex = accountKeys.findIndex(ak => 
        (typeof ak === 'string' ? ak : ak.pubkey) === walletAddress
      );
      
      if (walletIndex >= 0 && preBalances[walletIndex] !== undefined && postBalances[walletIndex] !== undefined) {
        const balanceChange = (postBalances[walletIndex] - preBalances[walletIndex]) / LAMPORTS_PER_SOL;
        if (Math.abs(balanceChange) > 0.000001) {
          amountSol = Math.abs(balanceChange);
          isIncoming = balanceChange > 0;
          
          // Try to find counterparty
          for (let i = 0; i < accountKeys.length; i++) {
            if (i !== walletIndex && postBalances[i] !== undefined && preBalances[i] !== undefined) {
              const otherChange = (postBalances[i] - preBalances[i]) / LAMPORTS_PER_SOL;
              if (Math.abs(otherChange) > 0.000001 && Math.abs(otherChange - balanceChange) < 0.0001) {
                const key = accountKeys[i];
                counterparty = typeof key === 'string' ? key : key.pubkey;
                break;
              }
            }
          }
        }
      }
    }
    
    // Detect transaction type from instructions
    if (tx.transaction?.message?.instructions || tx.instructions) {
      const instructions = tx.transaction?.message?.instructions || tx.instructions || [];
      for (const ix of instructions) {
        const programId = ix.programId || (typeof ix === 'object' && ix.programIdString) || '';
        const programIdStr = typeof programId === 'string' ? programId : programId.toString();
        
        // Detect common program types
        if (programIdStr.includes('Swap') || programIdStr.includes('Jupiter') || programIdStr.includes('Raydium')) {
          type = 'Swap';
        } else if (programIdStr.includes('Stake') || programIdStr.includes('Marinade') || programIdStr.includes('Jito')) {
          type = 'Staking';
        } else if (programIdStr.includes('Token') && amountSol === 0) {
          type = 'Token Transfer';
          asset = 'Token';
        }
      }
    }
    
    // Format counterparty
    if (counterparty && counterparty !== 'Unknown' && counterparty.length > 8) {
      counterparty = counterparty.slice(0, 4) + '...' + counterparty.slice(-4);
    }
    
    return {
      amountSol,
      type,
      asset,
      counterparty,
      isIncoming
    };
  } catch (error) {
    console.error('Error parsing transaction:', error);
    return { amountSol: 0, type: 'Transaction', asset: 'SOL', counterparty: 'Unknown', isIncoming: false };
  }
};

// Detect real staking positions from on-chain data
const detectStakingPositions = async (walletAddress, holdings, transactions) => {
  const incomeStreams = [];
  
  // Check for staked SOL (mSOL, stSOL, etc.)
  const stakingTokens = holdings.filter(h => 
    h.symbol && (h.symbol.includes('mSOL') || h.symbol.includes('stSOL') || h.symbol.includes('jitoSOL'))
  );
  
  for (const stakingToken of stakingTokens) {
    let label = 'Liquid Staking';
    let apr = 6.5; // Default APR for liquid staking
    
    if (stakingToken.symbol.includes('mSOL')) {
      label = 'Marinade Staking';
      apr = 6.8;
    } else if (stakingToken.symbol.includes('jitoSOL')) {
      label = 'Jito MEV Rewards';
      apr = 8.2;
    } else if (stakingToken.symbol.includes('stSOL')) {
      label = 'Lido Staking';
      apr = 5.5;
    }
    
    // Calculate monthly income
    const usdPerMonth = (stakingToken.usdValue * apr / 100) / 12;
    
    if (usdPerMonth > 0.01) { // Only show if meaningful
      incomeStreams.push({
        label,
        apr,
        usdPerMonth: Math.round(usdPerMonth * 100) / 100
      });
    }
  }
  
  // Check transactions for staking activity
  if (transactions && transactions.length > 0) {
    const stakingTxs = transactions.filter(tx => {
      const parsed = parseTransaction(tx, walletAddress);
      return parsed.type === 'Staking';
    });
    
    if (stakingTxs.length > 0 && incomeStreams.length === 0) {
      // User has staking transactions but no staking tokens yet
      // Estimate based on SOL holdings
      const solHolding = holdings.find(h => h.symbol === 'SOL');
      if (solHolding && solHolding.usdValue > 100) {
        incomeStreams.push({
          label: 'Staking (Estimated)',
          apr: 6.5,
          usdPerMonth: Math.round((solHolding.usdValue * 0.065 / 12) * 100) / 100
        });
      }
    }
  }
  
  return incomeStreams;
};

const FALLBACK_SUGGESTIONS = [
  {
    title: 'Deploy 20% into liquid staking ladders',
    thesis: 'Rotate a slice of idle ETH into stETH and ether.fi vaults to compound staking rewards while retaining liquidity.',
    allocationSuggestion: 'Target 0.35 ETH split across Lido and ether.fi auto-compounding vaults.',
    riskLevel: 'Moderate',
    nextSteps: ['Split ETH across two ladders to smooth validator reward variance.', 'Enable restaking on EigenLayer for boosted yield with guardrails.', 'Track smart contract risk using DeFiLlama alerts.']
  },
  {
    title: 'Ring-fence cash runway in on-chain T-bill notes',
    thesis: 'Protect 3-month expenses with tokenized US treasuries currently yielding 4.9-5.2% APR.',
    allocationSuggestion: 'Keep $1,200 in USDY or Ondo Short-Term Notes to hedge ETH drawdowns.',
    riskLevel: 'Conservative',
    nextSteps: ['Automate replenishment via weekly DCA from swap profits.', 'Build escape criteria (ETH < $2,400 triggers rebalancing).', 'Sync holdings to tax dashboard for quarterly reporting.']
  },
  {
    title: 'Add upside with AI-focused index basket',
    thesis: 'Capture AI infrastructure growth with a diversified basket that rebalances monthly.',
    allocationSuggestion: 'Allocate $750 across GRT, RNDR, and FET index vault with capped drawdown.',
    riskLevel: 'Adventurous',
    nextSteps: ['Limit exposure to 12% of total portfolio.', 'Review NAV deviation weekly.', 'Set take-profit automation at 28% gain.']
  }
];

const getOverview = async (walletAddress) => {
  try {
    console.log(`[Finance] Getting overview for wallet: ${walletAddress}`);
    
    // Try to get real Solana portfolio data
    const realPortfolio = await solanaPortfolioService.getPortfolio(walletAddress);
    console.log(`[Finance] Portfolio fetched:`, {
      totalValue: realPortfolio.totalValue,
      holdingsCount: realPortfolio.holdings.length,
      solBalance: realPortfolio.solBalance
    });
    
    // Always return data, even if totalValue is 0 (empty wallet)
    if (realPortfolio) {
      // Use real data
      const riskAnalysis = realPortfolio.totalValue > 0 
        ? await solanaPortfolioService.getRiskAnalysis(realPortfolio)
        : { riskScore: 0, riskLevel: 'low', warnings: [], recommendations: [] };
      
      // Format for frontend
      const topHolding = realPortfolio.holdings[0] || { symbol: 'SOL', amount: realPortfolio.solBalance || 0, usdValue: 0, price: 0 };
      const stablecoins = realPortfolio.holdings.filter(h => 
        h.symbol && (h.symbol.includes('USDC') || h.symbol.includes('USDT'))
      );
      const stablecoinsUsd = stablecoins.reduce((sum, h) => sum + h.usdValue, 0);
      
      // Use only real holdings - no fake data
      let holdings = realPortfolio.holdings.length > 0 
        ? realPortfolio.holdings 
        : (realPortfolio.solBalance > 0 ? [{
            symbol: 'SOL',
            mint: 'So11111111111111111111111111111111111111112',
            amount: realPortfolio.solBalance,
            usdValue: realPortfolio.solBalance * (topHolding.price || 150),
            price: topHolding.price || 150
          }] : []);
      
      let totalValue = realPortfolio.totalValue || ((realPortfolio.solBalance || 0) * (topHolding.price || 150));
      
      // Calculate real performance trends from transaction history
      const transactions = await heliusService.getWalletTransactions(walletAddress, 100);
      const performanceTrend = calculatePerformanceTrend(transactions, totalValue, topHolding.price || 150, walletAddress);
      
      // Detect real staking positions for income streams
      const incomeStreams = await detectStakingPositions(walletAddress, holdings, transactions);
      
      return {
        walletAddress,
        ownerName: 'Portfolio Owner',
        riskProfile: riskAnalysis.riskLevel,
        balances: {
          crypto: {
            symbol: topHolding.symbol || 'SOL',
            amount: topHolding.amount || realPortfolio.solBalance || 0,
            usdValue: topHolding.usdValue || totalValue
          },
          stablecoinsUsd: stablecoinsUsd,
          fiatEquivalentUsd: totalValue,
          totalUsd: totalValue
        },
        growth: {
          deltaUsd: realPortfolio.pnl24h || 0,
          percentChange: realPortfolio.pnl24hPercent || 0,
          lastPurchaseDate: new Date().toISOString().split('T')[0],
          lastPurchaseUsdValue: totalValue - (realPortfolio.pnl24h || 0),
          lastPurchaseCryptoPriceUsd: topHolding.price || 150
        },
        runwayReserveUsd: stablecoinsUsd,
        performanceTrend: performanceTrend,
        savingsAllocation: holdings.slice(0, 5).map((h) => ({
          label: h.symbol,
          percentage: totalValue > 0 ? (h.usdValue / totalValue) * 100 : 0,
          usdValue: h.usdValue
        })),
        incomeStreams: incomeStreams,
        comparison: {
          labels: performanceTrend.labels,
          cryptoUsdValue: performanceTrend.usdBalances,
          fiatUsdValue: performanceTrend.usdBalances
        },
        riskAnalysis,
        holdings: holdings,
        lastUpdated: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Real portfolio fetch failed:', error.message);
    console.error('Error stack:', error.stack);
    // Return minimal data structure even on error
    return {
      walletAddress,
      ownerName: 'Portfolio Owner',
      riskProfile: 'moderate',
      balances: {
        crypto: { symbol: 'SOL', amount: 0, usdValue: 0 },
        stablecoinsUsd: 0,
        fiatEquivalentUsd: 0,
        totalUsd: 0
      },
      growth: {
        deltaUsd: 0,
        percentChange: 0,
        lastPurchaseDate: new Date().toISOString().split('T')[0],
        lastPurchaseUsdValue: 0,
        lastPurchaseCryptoPriceUsd: 0
      },
      runwayReserveUsd: 0,
      performanceTrend: {
        labels: ['6h', '12h', '18h', '24h'],
        usdBalances: [0, 0, 0, 0],
        cryptoHoldings: [0]
      },
      savingsAllocation: [],
      incomeStreams: generateDemoIncomeStreams(walletAddress, 0),
      comparison: {
        labels: ['6h', '12h', '18h', '24h'],
        cryptoUsdValue: [0, 0, 0, 0],
        fiatUsdValue: [0, 0, 0, 0]
      },
      riskAnalysis: {
        riskScore: 0,
        riskLevel: 'low',
        warnings: ['Unable to fetch portfolio data'],
        recommendations: []
      },
      holdings: [],
      lastUpdated: new Date().toISOString()
    };
  }
  
  // Return null if portfolio service returned null
  return null;
};

const getTransactions = async (walletAddress) => {
  try {
    // Get real transactions with full details
    const realTransactions = await heliusService.getWalletTransactions(walletAddress, 50);
    
    if (!realTransactions || realTransactions.length === 0) {
      return [];
    }
    
    // Get SOL price for USD conversion
    const jupiterService = require('./jupiterService');
    const solMint = 'So11111111111111111111111111111111111111112';
    const solPrice = await jupiterService.getTokenPrice(solMint) || 150;
    
    const parsedTransactions = [];
    
    for (const tx of realTransactions.slice(0, 20)) {
      if (!tx.signature && !tx.blockTime) continue;
      
      const parsed = parseTransaction(tx, walletAddress);
      const amountSol = parsed.amountSol;
      const amountUsd = amountSol * solPrice;
      
      // Skip transactions with no meaningful amount
      if (amountSol < 0.000001 && parsed.type === 'Transaction') continue;
      
      parsedTransactions.push({
        id: tx.signature || `tx-${Date.now()}-${Math.random()}`,
        date: new Date((tx.blockTime || Date.now() / 1000) * 1000).toISOString(),
        type: parsed.type,
        asset: parsed.asset,
        amountCrypto: parsed.isIncoming ? amountSol : -amountSol,
        amountUsd: parsed.isIncoming ? amountUsd : -amountUsd,
        status: 'completed',
        counterparty: parsed.counterparty,
        signature: tx.signature
      });
    }
    
    // Sort by date (newest first)
    parsedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return parsedTransactions;
  } catch (error) {
    console.error('Real transactions fetch failed:', error.message);
    return [];
  }
};

const formatFallbackMessage = () =>
  FALLBACK_SUGGESTIONS.map((idea, index) => {
    const steps = idea.nextSteps.length
      ? `\nNext steps:\n- ${idea.nextSteps.join('\n- ')}`
      : '';
    return `${index + 1}. ${idea.title}\n${idea.thesis}\nAllocation: ${idea.allocationSuggestion}\nRisk: ${idea.riskLevel}${steps}`;
  }).join('\n\n');

const GEMINI_GENERATION_CONFIG = {
  temperature: Number(env.GEMINI_TEMPERATURE ?? 0.25),
  maxOutputTokens: Number(env.GEMINI_MAX_OUTPUT_TOKENS ?? 768),
  topP: Number(env.GEMINI_TOP_P ?? 0.9)
};

const VALID_SAFETY_CATEGORIES = new Set([
  'HARM_CATEGORY_DANGEROUS_CONTENT',
  'HARM_CATEGORY_HARASSMENT',
  'HARM_CATEGORY_HATE_SPEECH'
]);

const GEMINI_SAFETY_SETTINGS = Array.from(VALID_SAFETY_CATEGORIES).map((category) => ({
  category,
  threshold: env.GEMINI_SAFETY_THRESHOLD || 'BLOCK_MEDIUM_AND_ABOVE'
}));

const DEFAULT_PREFILL_PROMPT = 'Introduce yourself briefly as Phanta, their AI blockchain assistant. Give a one-sentence greeting mentioning you can help analyze their portfolio.';

const extractCandidateText = (candidate) => {
  if (!candidate?.content?.parts?.length) {
    return '';
  }

  return candidate.content.parts
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .filter(Boolean)
    .join('\n')
    .trim();
};

const buildSystemInstruction = (overview, walletAddress, extraContext = [], isPrefill = false, friendsData = []) => {
  const parts = [
    {
      text: `You are Phanta, an expert AI-powered blockchain banking assistant powered by Google Gemini, analyzing wallet ${walletAddress} on Solana. You have access to real on-chain data including token balances, prices, and portfolio composition.`
    }
  ];

  // Add friends data if available
  if (friendsData && friendsData.length > 0) {
    const friendsInfo = friendsData.map(f => 
      `${f.name} (${f.walletAddress.slice(0, 8)}...${f.walletAddress.slice(-8)}): Portfolio value $${f.portfolioValue.toFixed(2)}, Holdings: ${f.holdings}`
    ).join('\n');
    parts.push({
      text: `You also have access to the user's friends' public portfolio data:\n${friendsInfo}\n\nYou can answer questions like "who has the most money" or "compare my portfolio to my friends" by referencing this data.`
    });
  }
  
  // For prefill (initial message), keep it very brief
  if (isPrefill) {
    parts.push({
      text: 'For the initial greeting, respond with ONLY ONE SHORT SENTENCE. Be friendly and mention you can help with portfolio analysis. Do not provide detailed analysis yet - wait for the user to ask questions.'
    });
  } else {
    parts.push({
      text: 'Provide actionable insights: analyze risk, suggest rebalancing, identify opportunities, and warn about dangerous positions. Reference specific tokens and amounts when relevant.'
    });
    parts.push({
      text: 'Always close with a concrete recommendation or next step.'
    });
  }
  
  // For prefill, don't add detailed portfolio data - keep it minimal
  if (!isPrefill) {
    // Add real portfolio data if available
    if (overview?.holdings) {
      const portfolioSummary = overview.holdings.map(h => 
        `${h.symbol}: ${h.amount.toFixed(4)} ($${h.usdValue.toFixed(2)})`
      ).join(', ');
      parts.splice(1, 0, {
        text: `Current portfolio: ${portfolioSummary}. Total value: $${overview.balances?.totalUsd?.toFixed(2) || 0}. 24h PnL: ${overview.growth?.percentChange?.toFixed(2) || 0}%.`
      });
    }
    
    // Add risk analysis if available
    if (overview?.riskAnalysis) {
      const risk = overview.riskAnalysis;
      parts.push({
        text: `Risk Analysis: Score ${risk.riskScore}/100 (${risk.riskLevel} risk). Warnings: ${risk.warnings.join('; ') || 'None'}. Recommendations: ${risk.recommendations.join('; ') || 'Portfolio looks balanced'}.`
      });
    }

    // Add full portfolio context if available (but keep it concise)
    if (overview && !overview.holdings) {
      parts.push({
        text: `Portfolio snapshot: ${JSON.stringify(overview)}`
      });
    }
  }

  extraContext
    .filter((entry) => typeof entry === 'string' && entry.trim())
    .forEach((entry) => {
      parts.push({ text: entry });
    });

  return {
    role: 'system',
    parts
  };
};

const mapHistoryToGemini = (history = []) =>
  history
    .filter((message) => ['assistant', 'user'].includes(message.role) && message.content)
    .slice(-12)
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }]
    }));

const buildPrefillFallback = (overview) => {
  const { balances, growth } = overview || {};
  const totalUsd = balances?.totalUsd ?? (balances?.crypto?.usdValue || 0) + (balances?.stablecoinsUsd || 0);

  return [
    "Gemini is running in offline mode, so here is a quick snapshot based on cached telemetry:",
    `• Total assets stand at ~$${Number(totalUsd || 0).toLocaleString()} with ${balances?.crypto?.amount?.toFixed?.(2) ?? '—'} ${
      balances?.crypto?.symbol || 'SOL'
    } on book.`,
    `• Last recorded delta since your previous buy was ${growth?.percentChange ?? 0}% (${growth?.deltaUsd ? `$${growth.deltaUsd.toLocaleString()}` : 'N/A'}).`,
    'Ask any question and Phanta will respond with playbooks even without live Gemini access.'
  ].join('\n');
};

const formatFallbackResponse = (overview) => ({
  source: 'fallback',
  message: formatFallbackMessage(),
  note: 'Gemini is currently unavailable. Showing curated fallback ideas instead.',
  meta: {
    model: null,
    usage: null,
    latencyMs: null,
    safetyRatings: []
  },
  context: {
    overview
  }
});

const buildSystemInstructionText = (overview, walletAddress, extraContext = []) => {
  const parts = [
    `You are Phanta, an expert AI-powered blockchain banking assistant powered by Google Gemini, analyzing wallet ${walletAddress} on Solana. You have access to real on-chain data including token balances, prices, and portfolio composition.`,
    'Provide actionable insights: analyze risk, suggest rebalancing, identify opportunities, and warn about dangerous positions. Reference specific tokens and amounts when relevant.',
    'Always close with a concrete recommendation or next step.'
  ];
  
  if (overview?.holdings) {
    const portfolioSummary = overview.holdings.map(h => 
      `${h.symbol}: ${h.amount.toFixed(4)} ($${h.usdValue.toFixed(2)})`
    ).join(', ');
    parts.splice(1, 0, `Current portfolio: ${portfolioSummary}. Total value: $${overview.balances?.totalUsd?.toFixed(2) || 0}. 24h PnL: ${overview.growth?.percentChange?.toFixed(2) || 0}%.`);
  }
  
  if (overview?.riskAnalysis) {
    const risk = overview.riskAnalysis;
    parts.push(`Risk Analysis: Score ${risk.riskScore}/100 (${risk.riskLevel} risk). Warnings: ${risk.warnings.join('; ') || 'None'}. Recommendations: ${risk.recommendations.join('; ') || 'Portfolio looks balanced'}.`);
  }

  extraContext
    .filter((entry) => typeof entry === 'string' && entry.trim())
    .forEach((entry) => {
      parts.push(entry);
    });

  return parts.join('\n\n');
};

const chatWithAssistant = async ({ walletAddress, question, prompt, history = [], overview, prefill = false, contextBlocks = [], groupContext = null, friendsData = [] }) => {
  const portfolio = overview || (await getOverview(walletAddress));
  const userPrompt = (prompt ?? question ?? (prefill ? DEFAULT_PREFILL_PROMPT : '')).trim();

  // Extract friends data from request (fix parameter name)
  const friendsDataArray = Array.isArray(friendsData) ? friendsData : [];

  if (!userPrompt) {
    return {
      source: 'noop',
      message: '',
      meta: {
        model: GEMINI_MODEL,
        usage: null,
        latencyMs: 0,
        safetyRatings: []
      }
    };
  }

  let systemInstructionText = buildSystemInstructionText(portfolio, walletAddress, contextBlocks);
  if (groupContext) {
    systemInstructionText += `\n\nGroup Context: ${groupContext}`;
  }

  const startedAt = Date.now();

  // Use Gemini
  if (env.GEMINI_API_KEY) {
    try {
      const contents = [...mapHistoryToGemini(history), { role: 'user', parts: [{ text: userPrompt }] }];
      const data = await generateGeminiContent({
        contents,
        systemInstruction: buildSystemInstruction(portfolio, walletAddress, contextBlocks, prefill, friendsDataArray),
        generationConfig: GEMINI_GENERATION_CONFIG,
        safetySettings: GEMINI_SAFETY_SETTINGS
      });

      const latencyMs = Date.now() - startedAt;
      const candidate = data?.candidates?.[0];
      const rawText = extractCandidateText(candidate);

      if (rawText) {
        return {
          source: 'gemini',
          message: rawText,
          meta: {
            model: data?.model || GEMINI_MODEL,
            usage: data?.usageMetadata || null,
            latencyMs,
            safetyRatings: candidate?.safetyRatings || []
          }
        };
      }
    } catch (error) {
      console.error('Gemini request failed:', error);
    }
  }

  // Fallback
  if (!env.GEMINI_API_KEY) {
    return prefill
      ? {
          source: 'fallback',
          message: buildPrefillFallback(portfolio),
          note: 'GEMINI_API_KEY is not configured. Please add it to your backend .env file and restart the server.',
          meta: {
            model: null,
            usage: null,
            latencyMs: null,
            safetyRatings: []
          }
        }
      : formatFallbackResponse(portfolio);
  }

  return {
    source: 'fallback',
    message: formatFallbackMessage(),
    note: 'Gemini is currently unavailable. Showing curated fallback ideas instead.',
    meta: {
      model: null,
      usage: null,
      latencyMs: null,
      safetyRatings: []
    }
  };
};

module.exports = {
  getOverview,
  getTransactions,
  chatWithAssistant
};
