const env = require('../config/loadEnv');
const { DEFAULT_MODEL: GEMINI_MODEL, generateContent: generateGeminiContent } = require('./geminiClient');
const solanaPortfolioService = require('./solanaPortfolioService');
const heliusService = require('./heliusService');

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
      
      // Ensure we have at least SOL in holdings
      const holdings = realPortfolio.holdings.length > 0 
        ? realPortfolio.holdings 
        : [{
            symbol: 'SOL',
            mint: 'So11111111111111111111111111111111111111112',
            amount: realPortfolio.solBalance || 0,
            usdValue: (realPortfolio.solBalance || 0) * (topHolding.price || 150),
            price: topHolding.price || 150
          }];
      
      const totalValue = realPortfolio.totalValue || ((realPortfolio.solBalance || 0) * (topHolding.price || 150));
      
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
        performanceTrend: {
          labels: ['6h', '12h', '18h', '24h'],
          usdBalances: [
            totalValue - (realPortfolio.pnl24h || 0) * 0.75,
            totalValue - (realPortfolio.pnl24h || 0) * 0.5,
            totalValue - (realPortfolio.pnl24h || 0) * 0.25,
            totalValue
          ],
          cryptoHoldings: holdings.map(h => h.amount)
        },
        savingsAllocation: holdings.slice(0, 5).map((h) => ({
          label: h.symbol,
          percentage: totalValue > 0 ? (h.usdValue / totalValue) * 100 : 0,
          usdValue: h.usdValue
        })),
        incomeStreams: [],
        comparison: {
          labels: ['6h', '12h', '18h', '24h'],
          cryptoUsdValue: [
            totalValue - (realPortfolio.pnl24h || 0) * 0.75,
            totalValue - (realPortfolio.pnl24h || 0) * 0.5,
            totalValue - (realPortfolio.pnl24h || 0) * 0.25,
            totalValue
          ],
          fiatUsdValue: [
            totalValue - (realPortfolio.pnl24h || 0) * 0.75,
            totalValue - (realPortfolio.pnl24h || 0) * 0.5,
            totalValue - (realPortfolio.pnl24h || 0) * 0.25,
            totalValue
          ]
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
      incomeStreams: [],
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
    // Try to get real transactions
    const realTransactions = await heliusService.getWalletTransactions(walletAddress, 50);
    
    if (realTransactions && realTransactions.length > 0) {
      return realTransactions.slice(0, 20).map((tx, index) => ({
        id: tx.signature || `tx-${index}`,
        date: new Date(tx.blockTime * 1000).toISOString(),
        type: 'Transaction',
        asset: 'SOL',
        amountCrypto: 0,
        amountUsd: 0,
        status: 'completed',
        counterparty: 'On-chain',
        signature: tx.signature
      }));
    }
  } catch (error) {
    console.error('Real transactions fetch failed:', error.message);
  }
  
  // Return empty array if no real data available - don't show fake transactions
  return [];
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

const DEFAULT_PREFILL_PROMPT = 'Introduce yourself as Phanta, the user\'s AI-powered crypto banking assistant powered by Google Gemini. Analyze their real Solana portfolio and give a concise summary of holdings, risk profile, and how you can help optimize their strategy.';

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

const buildSystemInstruction = (overview, walletAddress, extraContext = []) => {
  const parts = [
    {
      text: `You are Phanta, an expert AI-powered crypto banking assistant powered by Google Gemini, analyzing wallet ${walletAddress} on Solana. You have access to real on-chain data including token balances, prices, and portfolio composition.`
    },
    {
      text: 'Provide actionable insights: analyze risk, suggest rebalancing, identify opportunities, and warn about dangerous positions. Reference specific tokens and amounts when relevant.'
    },
    {
      text: 'Always close with a concrete recommendation or next step.'
    }
  ];
  
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
    `You are Phanta, an expert AI-powered crypto banking assistant powered by Google Gemini, analyzing wallet ${walletAddress} on Solana. You have access to real on-chain data including token balances, prices, and portfolio composition.`,
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

const chatWithAssistant = async ({ walletAddress, question, prompt, history = [], overview, prefill = false, contextBlocks = [], groupContext = null }) => {
  const portfolio = overview || (await getOverview(walletAddress));
  const userPrompt = (prompt ?? question ?? (prefill ? DEFAULT_PREFILL_PROMPT : '')).trim();

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
        systemInstruction: buildSystemInstruction(portfolio, walletAddress, contextBlocks),
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
