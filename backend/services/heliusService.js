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
        const endpoints = [
          'https://api.mainnet-beta.solana.com',
          'https://solana-api.projectserum.com',
          'https://rpc.ankr.com/solana'
        ];
        
        for (const endpoint of endpoints) {
          try {
            const response = await axios.post(endpoint, {
              jsonrpc: '2.0',
              id: 1,
              method: 'getTokenAccountsByOwner',
              params: [
                walletAddress,
                { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
                { encoding: 'jsonParsed' }
              ]
            }, {
              timeout: 15000
            });
            
            if (response.data?.result) {
              return response.data.result;
            }
          } catch (err) {
            console.warn(`Failed to fetch tokens from ${endpoint}:`, err.message);
            continue;
          }
        }
        
        // Return empty result if all endpoints fail
        return { value: [] };
      }
    } catch (error) {
      console.error('Helius API error:', error.message);
      return { tokens: [] };
    }
  }

  async getWalletTransactions(walletAddress, limit = 50) {
    try {
      if (this.apiKey) {
        // Use Helius enhanced API with transaction details
        const response = await axios.get(`${this.baseUrl}/addresses/${walletAddress}/transactions`, {
          params: {
            'api-key': this.apiKey,
            limit,
            type: 'TRANSFER' // Get transfer transactions with details
          }
        });
        return response.data || [];
      } else {
        // Fallback: Use Solana RPC to get signatures, then fetch details
        const sigResponse = await axios.post('https://api.mainnet-beta.solana.com', {
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignaturesForAddress',
          params: [walletAddress, { limit }]
        });
        
        const signatures = sigResponse.data.result || [];
        const transactions = [];
        
        // Fetch transaction details for each signature
        for (const sig of signatures.slice(0, 20)) { // Limit to 20 for performance
          try {
            const txResponse = await axios.post('https://api.mainnet-beta.solana.com', {
              jsonrpc: '2.0',
              id: 1,
              method: 'getTransaction',
              params: [sig.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]
            });
            
            if (txResponse.data?.result) {
              transactions.push({
                signature: sig.signature,
                blockTime: sig.blockTime,
                ...txResponse.data.result
              });
            }
          } catch (err) {
            // Continue if individual tx fetch fails
            continue;
          }
        }
        
        return transactions;
      }
    } catch (error) {
      console.error('Helius transactions error:', error.message);
      return [];
    }
  }

  async getWalletBalance(walletAddress) {
    try {
      // Try multiple RPC endpoints
      const endpoints = [
        'https://api.mainnet-beta.solana.com',
        'https://solana-api.projectserum.com',
        'https://rpc.ankr.com/solana'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.post(endpoint, {
            jsonrpc: '2.0',
            id: 1,
            method: 'getBalance',
            params: [walletAddress]
          }, {
            timeout: 10000
          });
          
          if (response.data?.result?.value !== undefined) {
            return response.data.result.value;
          }
        } catch (err) {
          console.warn(`Failed to fetch balance from ${endpoint}:`, err.message);
          continue;
        }
      }
      
      return 0;
    } catch (error) {
      console.error('Balance fetch error:', error.message);
      return 0;
    }
  }
}

module.exports = new HeliusService();

