const axios = require('axios');

// Jupiter API for token prices and quotes
class JupiterService {
  constructor() {
    this.baseUrl = 'https://quote-api.jup.ag/v6';
    this.priceUrl = 'https://price.jup.ag/v4';
  }

  async getTokenPrice(mintAddress) {
    try {
      const response = await axios.get(`${this.priceUrl}/price`, {
        params: {
          ids: mintAddress
        }
      });
      return response.data?.data?.[mintAddress]?.price || 0;
    } catch (error) {
      console.error('Jupiter price error:', error.message);
      return 0;
    }
  }

  async getTokenPrices(mintAddresses) {
    try {
      const ids = Array.isArray(mintAddresses) ? mintAddresses.join(',') : mintAddresses;
      const response = await axios.get(`${this.priceUrl}/price`, {
        params: { ids }
      });
      return response.data?.data || {};
    } catch (error) {
      console.error('Jupiter prices error:', error.message);
      return {};
    }
  }

  async getQuote(inputMint, outputMint, amount, slippageBps = 50) {
    try {
      const response = await axios.get(`${this.baseUrl}/quote`, {
        params: {
          inputMint,
          outputMint,
          amount,
          slippageBps
        }
      });
      return response.data;
    } catch (error) {
      console.error('Jupiter quote error:', error.message);
      return null;
    }
  }

  async getTokenList() {
    try {
      const response = await axios.get('https://token.jup.ag/all');
      return response.data || [];
    } catch (error) {
      console.error('Jupiter token list error:', error.message);
      return [];
    }
  }
}

module.exports = new JupiterService();

