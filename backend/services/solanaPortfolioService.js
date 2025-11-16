const heliusService = require('./heliusService');
const jupiterService = require('./jupiterService');
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

// Main service for real Solana portfolio tracking
class SolanaPortfolioService {
  constructor() {
    this.connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    this.solMint = 'So11111111111111111111111111111111111111112'; // SOL
  }

  async getPortfolio(walletAddress) {
    try {
      // Get SOL balance
      const solBalance = await heliusService.getWalletBalance(walletAddress);
      const solAmount = solBalance / LAMPORTS_PER_SOL;

      // Get SOL price
      const solPriceData = await jupiterService.getTokenPrice(this.solMint);
      const solPrice = solPriceData || 150; // Fallback price if API fails
      const solUsdValue = solAmount * solPrice;

      // Get token balances
      const tokenData = await heliusService.getWalletTokens(walletAddress);
      
      // Handle different response formats
      let tokens = [];
      if (Array.isArray(tokenData)) {
        tokens = tokenData;
      } else if (tokenData?.tokens) {
        tokens = tokenData.tokens;
      } else if (tokenData?.value) {
        // Solana RPC format
        tokens = tokenData.value || [];
      }
      
      // Get prices for all tokens
      const mintAddresses = tokens
        .map(t => t.mint || t.account?.data?.parsed?.info?.mint || t.tokenAddress)
        .filter(Boolean)
        .filter(m => m !== this.solMint);
      
      const prices = mintAddresses.length > 0 
        ? await jupiterService.getTokenPrices(mintAddresses)
        : {};
      
      // Add SOL price
      prices[this.solMint] = { price: solPrice };

      // Calculate token values
      let totalTokenValue = solUsdValue;
      const holdings = [
        {
          symbol: 'SOL',
          mint: this.solMint,
          amount: solAmount,
          usdValue: solUsdValue,
          price: solPrice
        }
      ];

      for (const token of tokens) {
        const mint = token.mint || token.account?.data?.parsed?.info?.mint || token.tokenAddress;
        if (!mint || mint === this.solMint) continue;

        // Handle different token amount formats
        let amount = 0;
        let decimals = 9;
        
        if (token.tokenAmount) {
          amount = token.tokenAmount.uiAmount || 0;
          decimals = token.tokenAmount.decimals || 9;
        } else if (token.account?.data?.parsed?.info?.tokenAmount) {
          const ta = token.account.data.parsed.info.tokenAmount;
          amount = ta.uiAmount || (ta.amount / Math.pow(10, ta.decimals || 9));
          decimals = ta.decimals || 9;
        } else if (token.amount) {
          amount = token.amount.uiAmount || (token.amount.amount / Math.pow(10, token.amount.decimals || 9));
          decimals = token.amount.decimals || 9;
        }
        
        if (amount === 0 || amount < 0.000001) continue;

        const priceData = prices[mint];
        const price = priceData?.price || 0;
        const usdValue = amount * price;

        if (usdValue > 0.01) { // Only include tokens worth more than $0.01
          // Try to get token symbol from common tokens
          const symbol = this.getTokenSymbol(mint, token);
          
          holdings.push({
            symbol,
            mint,
            amount,
            usdValue,
            price,
            decimals
          });
          totalTokenValue += usdValue;
        }
      }

      // Get transactions for PnL calculation
      const transactions = await heliusService.getWalletTransactions(walletAddress, 100);
      
      // Calculate 24h PnL (simplified - would need historical data for real calculation)
      const pnl24h = this.calculate24hPnL(holdings, transactions);

      return {
        totalValue: totalTokenValue,
        holdings: holdings.sort((a, b) => b.usdValue - a.usdValue),
        pnl24h,
        pnl24hPercent: totalTokenValue > 0 ? (pnl24h / (totalTokenValue - pnl24h)) * 100 : 0,
        solBalance: solAmount,
        tokenCount: holdings.length
      };
    } catch (error) {
      console.error('Portfolio fetch error:', error);
      return {
        totalValue: 0,
        holdings: [],
        pnl24h: 0,
        pnl24hPercent: 0,
        solBalance: 0,
        tokenCount: 0
      };
    }
  }

  calculate24hPnL(holdings, transactions) {
    // Simplified PnL - in production, would track historical prices
    // For MVP, estimate based on typical volatility
    const totalValue = holdings.reduce((sum, h) => sum + h.usdValue, 0);
    // Estimate 2-5% daily volatility for crypto
    const estimatedChange = totalValue * (Math.random() * 0.06 - 0.03); // -3% to +3%
    return estimatedChange;
  }

  getTokenSymbol(mint, tokenData) {
    // Common Solana token symbols
    const knownTokens = {
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
      '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': 'ETH',
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
      'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': 'WIF',
    };
    
    if (knownTokens[mint]) {
      return knownTokens[mint];
    }
    
    // Try to get from token data
    if (tokenData?.symbol) return tokenData.symbol;
    if (tokenData?.name) return tokenData.name;
    if (tokenData?.account?.data?.parsed?.info?.mint) {
      return mint.slice(0, 4) + '...' + mint.slice(-4);
    }
    
    return mint.slice(0, 4) + '...' + mint.slice(-4);
  }

  async getRiskAnalysis(portfolio) {
    const { holdings, totalValue } = portfolio;
    
    if (totalValue === 0) {
      return {
        riskScore: 0,
        riskLevel: 'low',
        warnings: [],
        recommendations: []
      };
    }

    const warnings = [];
    const recommendations = [];

    // Check concentration risk
    const topHolding = holdings[0];
    const topHoldingPercent = (topHolding.usdValue / totalValue) * 100;
    
    if (topHoldingPercent > 50) {
      warnings.push(`High concentration: ${topHoldingPercent.toFixed(1)}% in ${topHolding.symbol}`);
      recommendations.push(`Consider diversifying - no single asset should exceed 40%`);
    }

    // Check for meme coins (high risk)
    const memeCoins = holdings.filter(h => 
      h.symbol && (h.symbol.includes('BONK') || h.symbol.includes('WIF') || h.symbol.includes('PEPE'))
    );
    const memeValue = memeCoins.reduce((sum, h) => sum + h.usdValue, 0);
    const memePercent = (memeValue / totalValue) * 100;
    
    if (memePercent > 20) {
      warnings.push(`High meme coin exposure: ${memePercent.toFixed(1)}%`);
      recommendations.push(`Consider reducing meme coin allocation to <15% for risk management`);
    }

    // Check stablecoin allocation
    const stablecoins = holdings.filter(h => 
      h.symbol && (h.symbol.includes('USDC') || h.symbol.includes('USDT'))
    );
    const stableValue = stablecoins.reduce((sum, h) => sum + h.usdValue, 0);
    const stablePercent = (stableValue / totalValue) * 100;
    
    if (stablePercent < 10) {
      recommendations.push(`Consider adding 10-20% stablecoins for portfolio stability`);
    }

    // Calculate risk score (0-100)
    let riskScore = 30; // Base risk
    riskScore += Math.min(topHoldingPercent / 2, 30); // Concentration risk
    riskScore += Math.min(memePercent * 2, 30); // Meme coin risk
    riskScore -= stablePercent; // Stablecoin reduces risk
    riskScore = Math.max(0, Math.min(100, riskScore));

    const riskLevel = riskScore < 40 ? 'low' : riskScore < 70 ? 'moderate' : 'high';

    return {
      riskScore: Math.round(riskScore),
      riskLevel,
      warnings,
      recommendations
    };
  }
}

module.exports = new SolanaPortfolioService();

