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
        },
        timeout: 10000
      });
      const price = response.data?.data?.[mintAddress]?.price;
      if (price && price > 0) {
        return price;
      }
      // Fallback: Try to get SOL price from CoinGecko if Jupiter fails
      if (mintAddress === 'So11111111111111111111111111111111111111112') {
        try {
          const coingeckoResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: { ids: 'solana', vs_currencies: 'usd' },
            timeout: 5000
          });
          return coingeckoResponse.data?.solana?.usd || 150;
        } catch (e) {
          return 150; // Final fallback
        }
      }
      return 0;
    } catch (error) {
      console.error('Jupiter price error:', error.message);
      // Fallback for SOL
      if (mintAddress === 'So11111111111111111111111111111111111111112') {
        return 150; // Default SOL price fallback
      }
      return 0;
    }
  }

  async getTokenPrices(mintAddresses) {
    try {
      const ids = Array.isArray(mintAddresses) ? mintAddresses.join(',') : mintAddresses;
      if (!ids || ids.length === 0) return {};
      
      const response = await axios.get(`${this.priceUrl}/price`, {
        params: { ids },
        timeout: 15000
      });
      const prices = response.data?.data || {};
      
      // Ensure SOL price is always available
      const solMint = 'So11111111111111111111111111111111111111112';
      if (!prices[solMint] || prices[solMint].price === 0) {
        const solPrice = await this.getTokenPrice(solMint);
        prices[solMint] = { price: solPrice };
      }
      
      return prices;
    } catch (error) {
      console.error('Jupiter prices error:', error.message);
      // Return at least SOL price
      const solMint = 'So11111111111111111111111111111111111111112';
      const solPrice = await this.getTokenPrice(solMint);
      return { [solMint]: { price: solPrice } };
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

