const { runQuery, runQuerySingle, runQueryExecute } = require('../database');

class UserService {
  // Check if user exists by wallet address
  async getUserByWalletAddress(walletAddress) {
    try {
      const user = await runQuerySingle(
        `SELECT u.*, p.balance_usd, p.balance_tokens 
         FROM users u 
         LEFT JOIN portfolios p ON u.portfolio_tag = p.portfolio_tag 
         WHERE u.wallet_address = ?`,
        [walletAddress]
      );
      return user;
    } catch (error) {
      console.error('Error getting user by wallet address:', error);
      throw error;
    }
  }

  // Create new user (onboarding)
  async createUser(userData) {
    try {
      const { name, email, walletAddress, userType, portfolioTag } = userData;

      // Check if portfolio tag is already assigned to another user
      const existingUser = await runQuerySingle(
        'SELECT * FROM users WHERE portfolio_tag = ?',
        [portfolioTag]
      );

      if (existingUser) {
        throw new Error('Portfolio tag is already assigned to another user');
      }

      // Create portfolio snapshot if it doesn't exist
      await runQueryExecute(
        `INSERT OR IGNORE INTO portfolios (portfolio_tag, balance_usd, balance_tokens) 
         VALUES (?, 0.0, 0.0)`,
        [portfolioTag]
      );

      // Create user
      const result = await runQueryExecute(
        `INSERT INTO users (name, email, wallet_address, user_type, portfolio_tag) 
         VALUES (?, ?, ?, ?, ?)`,
        [name, email, walletAddress, userType, portfolioTag]
      );

      // Get the created user with portfolio data
      const newUser = await this.getUserByWalletAddress(walletAddress);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }



  // Update stored portfolio snapshot
  async updatePortfolioSnapshot(portfolioTag, balanceUsd, balanceTokens) {
    try {
      const result = await runQueryExecute(
        `UPDATE portfolios 
         SET balance_usd = ?, balance_tokens = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE portfolio_tag = ?`,
        [balanceUsd, balanceTokens, portfolioTag]
      );
      return result;
    } catch (error) {
      console.error('Error updating portfolio snapshot:', error);
      throw error;
    }
  }

  // Update user balance
  async updateUserBalance(walletAddress, balanceData) {
    try {
      const { balanceUsd, balanceTokens } = balanceData;
      
      // Get user to find portfolio tag
      const user = await this.getUserByWalletAddress(walletAddress);
      if (!user) {
        throw new Error('User not found');
      }

      // Update portfolio snapshot
      await this.updatePortfolioSnapshot(user.portfolio_tag, balanceUsd, balanceTokens);

      // Return updated user data
      return await this.getUserByWalletAddress(walletAddress);
    } catch (error) {
      console.error('Error updating user balance:', error);
      throw error;
    }
  }

  // Get user's portfolio data
  async getUserPortfolioData(walletAddress) {
    try {
      const portfolioData = await runQuerySingle(
        `SELECT p.portfolio_tag, p.balance_usd, p.balance_tokens, p.updated_at
         FROM portfolios p 
         JOIN users u ON p.portfolio_tag = u.portfolio_tag 
         WHERE u.wallet_address = ?`,
        [walletAddress]
      );
      return portfolioData;
    } catch (error) {
      console.error('Error getting user portfolio data:', error);
      throw error;
    }
  }

  // Get all users with their portfolio data
  async getAllUsers() {
    try {
      const users = await runQuery(
        `SELECT u.*, p.balance_usd, p.balance_tokens 
         FROM users u 
         LEFT JOIN portfolios p ON u.portfolio_tag = p.portfolio_tag`
      );
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }
}

module.exports = new UserService(); 
