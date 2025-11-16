const express = require('express');
const router = express.Router();
const env = require('../config/loadEnv');

// Health check endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Phanta Backend is running',
    timestamp: new Date().toISOString()
  });
});

// API key status endpoint
router.get('/api-keys', (req, res) => {
  const apiKeys = {
    gemini: {
      configured: !!env.GEMINI_API_KEY,
      message: env.GEMINI_API_KEY 
        ? 'API key is configured' 
        : 'GEMINI_API_KEY is missing. Please add it to your .env file.'
    }
  };

  const availableProviders = Object.entries(apiKeys)
    .filter(([_, status]) => status.configured)
    .map(([key, _]) => key);

  res.json({
    success: true,
    apiKeys,
    availableProviders,
    message: availableProviders.length === 0
      ? 'GEMINI_API_KEY is not configured. Please add it to your .env file.'
      : 'Gemini is configured and ready.'
  });
});

module.exports = router;
