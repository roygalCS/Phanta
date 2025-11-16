const express = require('express');
const router = express.Router();
const financeService = require('../services/financeService');
const stockAnalyticsService = require('../services/stockAnalyticsService');
const cryptoAnalyticsService = require('../services/cryptoAnalyticsService');
const jupiterService = require('../services/jupiterService');

// Portfolio overview for a wallet
router.get('/overview/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    console.log(`[API] Fetching overview for wallet: ${walletAddress}`);
    
    const overview = await financeService.getOverview(walletAddress);
    console.log(`[API] Overview fetched successfully, total USD: $${overview?.balances?.totalUsd || 0}`);

    res.json({
      success: true,
      overview
    });
  } catch (error) {
    console.error('Failed to fetch portfolio overview:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Unable to load portfolio overview right now.',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Real-time portfolio data
router.get('/portfolio/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const solanaPortfolioService = require('../services/solanaPortfolioService');
    const portfolio = await solanaPortfolioService.getPortfolio(walletAddress);
    const riskAnalysis = await solanaPortfolioService.getRiskAnalysis(portfolio);

    res.json({
      success: true,
      portfolio: {
        ...portfolio,
        riskAnalysis
      }
    });
  } catch (error) {
    console.error('Failed to fetch real portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to load portfolio data right now.'
    });
  }
});

// Get trading quote (for generating transactions)
router.post('/quote', async (req, res) => {
  try {
    const { inputMint, outputMint, amount, slippageBps } = req.body;
    
    if (!inputMint || !outputMint || !amount) {
      return res.status(400).json({
        success: false,
        message: 'inputMint, outputMint, and amount are required'
      });
    }

    const quote = await jupiterService.getQuote(
      inputMint,
      outputMint,
      amount,
      slippageBps || 50
    );

    res.json({
      success: true,
      quote
    });
  } catch (error) {
    console.error('Failed to get quote:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to get trading quote right now.'
    });
  }
});

// Transaction history for a wallet
router.get('/transactions/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const transactions = await financeService.getTransactions(walletAddress);

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to load transactions right now.'
    });
  }
});

// AI-powered investment suggestions
router.post('/ai-suggestions', async (req, res) => {
  try {
    const {
      walletAddress,
      prompt,
      question,
      history = [],
      prefill = false,
      overview,
      context,
      groupContext = null
    } = req.body || {};

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'walletAddress is required.'
      });
    }

    const contextBlocks = Array.isArray(context)
      ? context.filter((entry) => typeof entry === 'string' && entry.trim())
      : typeof context === 'string' && context.trim()
        ? [context.trim()]
        : [];

    const payload = await financeService.chatWithAssistant({
      walletAddress,
      prompt,
      question,
      history,
      prefill: Boolean(prefill),
      overview,
      contextBlocks,
      groupContext
    });

    res.json({
      success: true,
      ...payload
    });
  } catch (error) {
    console.error('Failed to fetch AI suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch investment suggestions right now.'
    });
  }
});

// Stock analytics (Yahoo Finance powered)
router.post('/stocks/metrics', async (req, res) => {
  try {
    const { symbols, range, interval } = req.body || {};
    const insights = await stockAnalyticsService.getStockInsights({ symbols, range, interval });

    res.json({
      success: true,
      ...insights
    });
  } catch (error) {
    console.error('Failed to analyse stocks:', error);
    const statusCode = error.details ? 207 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Unable to analyse the requested tickers right now.',
      errors: error.details || []
    });
  }
});

// Crypto analytics (CoinGecko powered)
router.post('/crypto/metrics', async (req, res) => {
  try {
    const { symbols, range, interval } = req.body || {};
    const insights = await cryptoAnalyticsService.getCryptoInsights({ symbols, range, interval });

    res.json({
      success: true,
      ...insights
    });
  } catch (error) {
    console.error('Failed to analyse crypto:', error);
    const statusCode = error.errors ? 207 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Unable to analyse the requested blockchain assets right now.',
      errors: error.errors || []
    });
  }
});

module.exports = router;
