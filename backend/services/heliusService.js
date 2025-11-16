const axios = require('axios');

// Helius API for Solana wallet indexing
class HeliusService {
  constructor() {
    // Use free tier or get API key from https://helius.dev
    this.apiKey = process.env.HELIUS_API_KEY || '';
    this.baseUrl = this.apiKey 
      ? `https://api.helius.xyz/v0`
      : 'https://api.mainnet-beta.solana.com'; // Fallback to public RPC
  }

  async getWalletTokens(walletAddress) {
    try {
      if (this.apiKey) {
        // Helius enhanced API
        const response = await axios.get(`${this.baseUrl}/addresses/${walletAddress}/balances`, {
          params: {
            'api-key': this.apiKey
          }
        });
        return response.data;
      } else {
        // Fallback: Use Solana RPC to get token accounts
        const response = await axios.post(this.baseUrl, {
          jsonrpc: '2.0',
          id: 1,
          method: 'getTokenAccountsByOwner',
          params: [
            walletAddress,
            { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
            { encoding: 'jsonParsed' }
          ]
        });
        return response.data.result;
      }
    } catch (error) {
      console.error('Helius API error:', error.message);
      return { tokens: [] };
    }
  }

  async getWalletTransactions(walletAddress, limit = 50) {
    try {
      if (this.apiKey) {
        const response = await axios.get(`${this.baseUrl}/addresses/${walletAddress}/transactions`, {
          params: {
            'api-key': this.apiKey,
            limit
          }
        });
        return response.data;
      } else {
        // Fallback: Use Solana RPC
        const response = await axios.post(this.baseUrl, {
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignaturesForAddress',
          params: [walletAddress, { limit }]
        });
        return response.data.result || [];
      }
    } catch (error) {
      console.error('Helius transactions error:', error.message);
      return [];
    }
  }

  async getWalletBalance(walletAddress) {
    try {
      const response = await axios.post(this.baseUrl, {
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [walletAddress]
      });
      return response.data.result?.value || 0;
    } catch (error) {
      console.error('Balance fetch error:', error.message);
      return 0;
    }
  }
}

module.exports = new HeliusService();

