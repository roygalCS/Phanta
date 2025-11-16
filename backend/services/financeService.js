const env = require('../config/loadEnv');
const { DEFAULT_MODEL: GEMINI_MODEL, generateContent: generateGeminiContent } = require('./geminiClient');
const { DEFAULT_MODEL: CHATGPT_MODEL, generateContent: generateChatGPTContent } = require('./chatgptClient');
const { DEFAULT_MODEL: CLAUDE_MODEL, generateContent: generateClaudeContent } = require('./claudeClient');
const { DEFAULT_MODEL: GROQ_MODEL, generateContent: generateGroqContent } = require('./groqClient');
const { DEFAULT_MODEL: MISTRAL_MODEL, generateContent: generateMistralContent } = require('./mistralClient');
const { DEFAULT_MODEL: TOGETHER_MODEL, generateContent: generateTogetherContent } = require('./togetherClient');
const solanaPortfolioService = require('./solanaPortfolioService');
const heliusService = require('./heliusService');

const DEFAULT_PORTFOLIO = {
  overview: {
    ownerName: 'Alex Rivers',
    riskProfile: 'moderate',
    balances: {
      crypto: {
        symbol: 'ETH',
        amount: 1.82,
        usdValue: 6435.21
      },
      stablecoinsUsd: 2150.0,
      fiatEquivalentUsd: 6210.31
    },
    growth: {
      lastPurchaseDate: '2024-11-15',
      lastPurchaseUsdValue: 5720.0,
      lastPurchaseCryptoPriceUsd: 2265.0
    },
    runwayReserveUsd: 950.0,
    performanceTrend: {
      labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      usdBalances: [4280, 4725, 5180, 5660, 6025, 6435],
      cryptoHoldings: [1.21, 1.34, 1.46, 1.59, 1.68, 1.82]
    },
    savingsAllocation: [
      { label: 'Core ETH Holdings', percentage: 42, usdValue: 2702 },
      { label: 'Staked ETH (Lido)', percentage: 23, usdValue: 1480 },
      { label: 'Stablecoin Yield', percentage: 18, usdValue: 1130 },
      { label: 'RWA Treasuries', percentage: 9, usdValue: 578 },
      { label: 'AI & Gaming Tokens', percentage: 8, usdValue: 515 }
    ],
    incomeStreams: [
      { label: 'Liquid Staking Rewards', apr: 4.1, usdPerMonth: 22.5 },
      { label: 'Stablecoin Vault', apr: 7.6, usdPerMonth: 13.7 },
      { label: 'AI Index Fund', apr: 11.3, usdPerMonth: 9.8 }
    ],
    comparison: {
      labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug'],
      cryptoUsdValue: [4725, 5180, 5660, 6025, 6435],
      fiatUsdValue: [4510, 4825, 5290, 5740, 6125]
    }
  },
  transactions: [
    {
      id: 'txn-001',
      date: '2024-08-12T09:34:00Z',
      type: 'Deposit',
      asset: 'ETH',
      amountCrypto: 0.85,
      amountUsd: 2950,
      status: 'completed',
      counterparty: 'MetaMask Swap'
    },
    {
      id: 'txn-002',
      date: '2024-08-09T16:12:00Z',
      type: 'Yield Claim',
      asset: 'stETH',
      amountCrypto: 0.03,
      amountUsd: 105,
      status: 'completed',
      counterparty: 'Lido'
    },
    {
      id: 'txn-003',
      date: '2024-08-04T12:21:00Z',
      type: 'Swap',
      asset: 'USDC -> ETH',
      amountCrypto: 0.42,
      amountUsd: 1460,
      status: 'completed',
      counterparty: 'Uniswap v3'
    },
    {
      id: 'txn-004',
      date: '2024-07-28T19:50:00Z',
      type: 'Allocation',
      asset: 'USDC',
      amountCrypto: 850,
      amountUsd: 850,
      status: 'pending',
      counterparty: 'Maple Finance Pool'
    },
    {
      id: 'txn-005',
      date: '2024-07-18T08:05:00Z',
      type: 'Deposit',
      asset: 'USDC',
      amountCrypto: 1200,
      amountUsd: 1200,
      status: 'completed',
      counterparty: 'Stripe On-Ramp'
    }
  ]
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

const buildOverview = (walletAddress) => {
  const { overview } = DEFAULT_PORTFOLIO;
  const currentUsd = overview.balances.crypto.usdValue + overview.balances.stablecoinsUsd;
  const deltaUsd = currentUsd - overview.growth.lastPurchaseUsdValue;
  const pctChange = overview.growth.lastPurchaseUsdValue > 0
    ? (deltaUsd / overview.growth.lastPurchaseUsdValue) * 100
    : 0;

  return {
    walletAddress,
    ownerName: overview.ownerName,
    riskProfile: overview.riskProfile,
    balances: {
      crypto: overview.balances.crypto,
      stablecoinsUsd: overview.balances.stablecoinsUsd,
      fiatEquivalentUsd: overview.balances.fiatEquivalentUsd,
      totalUsd: Number((currentUsd).toFixed(2))
    },
    growth: {
      deltaUsd: Number(deltaUsd.toFixed(2)),
      percentChange: Number(pctChange.toFixed(2)),
      lastPurchaseDate: overview.growth.lastPurchaseDate,
      lastPurchaseUsdValue: overview.growth.lastPurchaseUsdValue,
      lastPurchaseCryptoPriceUsd: overview.growth.lastPurchaseCryptoPriceUsd
    },
    runwayReserveUsd: overview.runwayReserveUsd,
    performanceTrend: overview.performanceTrend,
    savingsAllocation: overview.savingsAllocation,
    incomeStreams: overview.incomeStreams,
    comparison: overview.comparison,
    lastUpdated: new Date().toISOString()
  };
};

const getOverview = async (walletAddress) => {
  try {
    // Try to get real Solana portfolio data
    const realPortfolio = await solanaPortfolioService.getPortfolio(walletAddress);
    
    if (realPortfolio.totalValue > 0) {
      // Use real data
      const riskAnalysis = await solanaPortfolioService.getRiskAnalysis(realPortfolio);
      
      // Format for frontend
      const topHolding = realPortfolio.holdings[0] || {};
      const stablecoins = realPortfolio.holdings.filter(h => 
        h.symbol && (h.symbol.includes('USDC') || h.symbol.includes('USDT'))
      );
      const stablecoinsUsd = stablecoins.reduce((sum, h) => sum + h.usdValue, 0);
      
      return {
        walletAddress,
        ownerName: 'Portfolio Owner',
        riskProfile: riskAnalysis.riskLevel,
        balances: {
          crypto: {
            symbol: topHolding.symbol || 'SOL',
            amount: topHolding.amount || 0,
            usdValue: topHolding.usdValue || 0
          },
          stablecoinsUsd: stablecoinsUsd,
          fiatEquivalentUsd: realPortfolio.totalValue,
          totalUsd: realPortfolio.totalValue
        },
        growth: {
          deltaUsd: realPortfolio.pnl24h,
          percentChange: realPortfolio.pnl24hPercent,
          lastPurchaseDate: new Date().toISOString().split('T')[0],
          lastPurchaseUsdValue: realPortfolio.totalValue - realPortfolio.pnl24h,
          lastPurchaseCryptoPriceUsd: topHolding.price || 0
        },
        runwayReserveUsd: stablecoinsUsd,
        performanceTrend: {
          labels: ['6h', '12h', '18h', '24h'],
          usdBalances: [
            realPortfolio.totalValue - realPortfolio.pnl24h * 0.75,
            realPortfolio.totalValue - realPortfolio.pnl24h * 0.5,
            realPortfolio.totalValue - realPortfolio.pnl24h * 0.25,
            realPortfolio.totalValue
          ],
          cryptoHoldings: realPortfolio.holdings.map(h => h.amount)
        },
        savingsAllocation: realPortfolio.holdings.slice(0, 5).map((h, i) => ({
          label: h.symbol,
          percentage: (h.usdValue / realPortfolio.totalValue) * 100,
          usdValue: h.usdValue
        })),
        incomeStreams: [],
        comparison: {
          labels: ['6h', '12h', '18h', '24h'],
          cryptoUsdValue: [
            realPortfolio.totalValue - realPortfolio.pnl24h * 0.75,
            realPortfolio.totalValue - realPortfolio.pnl24h * 0.5,
            realPortfolio.totalValue - realPortfolio.pnl24h * 0.25,
            realPortfolio.totalValue
          ],
          fiatUsdValue: [
            realPortfolio.totalValue - realPortfolio.pnl24h * 0.75,
            realPortfolio.totalValue - realPortfolio.pnl24h * 0.5,
            realPortfolio.totalValue - realPortfolio.pnl24h * 0.25,
            realPortfolio.totalValue
          ]
        },
        riskAnalysis,
        holdings: realPortfolio.holdings,
        lastUpdated: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Real portfolio fetch failed:', error.message);
  }
  
  // Return null if no real data available - don't show fake data
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

const DEFAULT_PREFILL_PROMPT = 'Introduce yourself as Phanta, the user\'s AI-powered crypto banking assistant. Analyze their real Solana portfolio and give a concise summary of holdings, risk profile, and how you can help optimize their strategy.';

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
      text: `You are Phanta, an expert AI-powered crypto banking assistant analyzing wallet ${walletAddress} on Solana. You have access to real on-chain data including token balances, prices, and portfolio composition.`
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

const mapHistoryToChatGPT = (history = []) =>
  history
    .filter((message) => ['assistant', 'user'].includes(message.role) && message.content)
    .slice(-12)
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content
    }));

const mapHistoryToClaude = (history = []) =>
  history
    .filter((message) => ['assistant', 'user'].includes(message.role) && message.content)
    .slice(-12)
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content
    }));

const buildPrefillFallback = (overview) => {
  const { balances, growth } = overview;
  const totalUsd = balances?.totalUsd ?? balances?.crypto?.usdValue + balances?.stablecoinsUsd;

  return [
    "Gemini Analyst is running in offline mode, so here is a quick snapshot based on cached telemetry:",
    `• Total assets stand at ~$${Number(totalUsd || 0).toLocaleString()} with ${balances?.crypto?.amount?.toFixed?.(2) ?? '—'} ${
      balances?.crypto?.symbol || 'ETH'
    } on book.`,
    `• Last recorded delta since your previous buy was ${growth?.percentChange ?? 0}% (${growth?.deltaUsd ? `$${growth.deltaUsd.toLocaleString()}` : 'N/A'}).`,
    'Ask any question and the copilot will respond with playbooks even without live Gemini access.'
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

const buildFailureNote = (error) => {
  if (!error) {
    return 'Gemini service is unreachable. Using offline playbooks for now.';
  }

  const status = error.status || error?.response?.status;
  if (status === 401 || status === 403) {
    return 'Gemini rejected the request. Verify your API key, project access, and billing status.';
  }

  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return 'Unable to reach Gemini. Check your network connectivity and firewall settings.';
  }

  const detail = error?.response?.error?.message || error?.message;
  if (detail && detail.toLowerCase() === 'fetch failed') {
    return 'Unable to reach Gemini. Check your internet connection or proxy settings.';
  }
  if (detail) {
    return `Gemini error. Fallback strategies are active while we recover.`;
  }

  return 'Gemini is unavailable right now. Fallback strategies are active while we recover.';
};

const buildSystemInstructionText = (overview, walletAddress, extraContext = []) => {
  const parts = [
    `You are Phanta, an expert AI-powered crypto banking assistant analyzing wallet ${walletAddress} on Solana. You have access to real on-chain data including token balances, prices, and portfolio composition.`,
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

const chatWithAssistant = async ({ walletAddress, question, prompt, history = [], overview, prefill = false, contextBlocks = [], provider = 'gemini', groupContext = null }) => {
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

  // Try Gemini
  if (provider === 'gemini' && env.GEMINI_API_KEY) {
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

  // Try ChatGPT
  if (provider === 'chatgpt' && env.CHATGPT_API_KEY) {
    try {
      const messages = [
        ...mapHistoryToChatGPT(history),
        { role: 'user', content: userPrompt }
      ];
      const data = await generateChatGPTContent({
        messages,
        systemInstruction: systemInstructionText,
        temperature: 0.7,
        maxTokens: 1000
      });

      const latencyMs = Date.now() - startedAt;
      const text = data?.choices?.[0]?.message?.content?.trim();

      if (text) {
        return {
          source: 'chatgpt',
          message: text,
          meta: {
            model: data?.model || CHATGPT_MODEL,
            usage: data?.usage || null,
            latencyMs
          }
        };
      }
    } catch (error) {
      console.error('ChatGPT request failed:', error);
    }
  }

  // Try Claude
  if (provider === 'claude' && env.CLAUDE_API_KEY) {
    try {
      const messages = [
        ...mapHistoryToClaude(history),
        { role: 'user', content: userPrompt }
      ];
      const data = await generateClaudeContent({
        messages,
        systemInstruction: systemInstructionText,
        maxTokens: 1024
      });

      const latencyMs = Date.now() - startedAt;
      const text = data?.content?.[0]?.text?.trim();

      if (text) {
        return {
          source: 'claude',
          message: text,
          meta: {
            model: data?.model || CLAUDE_MODEL,
            usage: data?.usage || null,
            latencyMs
          }
        };
      }
    } catch (error) {
      console.error('Claude request failed:', error);
    }
  }

  // Try Groq
  if (provider === 'groq' && env.GROQ_API_KEY) {
    try {
      const messages = [
        ...mapHistoryToChatGPT(history),
        { role: 'user', content: userPrompt }
      ];
      const data = await generateGroqContent({
        messages,
        systemInstruction: systemInstructionText,
        temperature: 0.7,
        maxTokens: 1000
      });

      const latencyMs = Date.now() - startedAt;
      const text = data?.choices?.[0]?.message?.content?.trim();

      if (text) {
        return {
          source: 'groq',
          message: text,
          meta: {
            model: data?.model || GROQ_MODEL,
            usage: data?.usage || null,
            latencyMs
          }
        };
      }
    } catch (error) {
      console.error('Groq request failed:', error);
    }
  }

  // Try Mistral
  if (provider === 'mistral' && env.MISTRAL_API_KEY) {
    try {
      const messages = [
        ...mapHistoryToChatGPT(history),
        { role: 'user', content: userPrompt }
      ];
      const data = await generateMistralContent({
        messages,
        systemInstruction: systemInstructionText,
        temperature: 0.7,
        maxTokens: 1000
      });

      const latencyMs = Date.now() - startedAt;
      const text = data?.choices?.[0]?.message?.content?.trim();

      if (text) {
        return {
          source: 'mistral',
          message: text,
          meta: {
            model: data?.model || MISTRAL_MODEL,
            usage: data?.usage || null,
            latencyMs
          }
        };
      }
    } catch (error) {
      console.error('Mistral request failed:', error);
    }
  }

  // Try Together AI
  if (provider === 'together' && env.TOGETHER_API_KEY) {
    try {
      const messages = [
        ...mapHistoryToChatGPT(history),
        { role: 'user', content: userPrompt }
      ];
      const data = await generateTogetherContent({
        messages,
        systemInstruction: systemInstructionText,
        temperature: 0.7,
        maxTokens: 1000
      });

      const latencyMs = Date.now() - startedAt;
      const text = data?.choices?.[0]?.message?.content?.trim();

      if (text) {
        return {
          source: 'together',
          message: text,
          meta: {
            model: data?.model || TOGETHER_MODEL,
            usage: data?.usage || null,
            latencyMs
          }
        };
      }
    } catch (error) {
      console.error('Together AI request failed:', error);
    }
  }

  // Fallback
  if (!env.GEMINI_API_KEY && !env.CHATGPT_API_KEY && !env.CLAUDE_API_KEY && !env.GROQ_API_KEY && !env.MISTRAL_API_KEY && !env.TOGETHER_API_KEY) {
    return prefill
      ? {
          source: 'fallback',
          message: buildPrefillFallback(portfolio),
          note: 'Set API keys to enable live AI insights.',
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
    note: `Selected provider (${provider}) is not available. Check API key configuration.`,
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
