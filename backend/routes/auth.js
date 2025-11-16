const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { clearAllData } = require('../database');

// Check if user exists by wallet address
router.post('/check-user', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Wallet address is required' 
      });
    }

    const user = await userService.getUserByWalletAddress(walletAddress);
    
    if (user) {
      // User exists, return user data
      return res.json({
        success: true,
        exists: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          walletAddress: user.wallet_address,
          userType: user.user_type,
          portfolioTag: user.portfolio_tag,
          balanceUsd: user.balance_usd,
          balanceTokens: user.balance_tokens
        }
      });
    } else {
      // User doesn't exist, return onboarding status
      return res.json({
        success: true,
        exists: false
      });
    }
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Create new user (onboarding)
router.post('/onboard', async (req, res) => {
  try {
    const { name, email, walletAddress, userType, portfolioTag } = req.body;

    if (!name || !email || !walletAddress || !userType || !portfolioTag) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, wallet address, role, and portfolio tag are required' 
      });
    }

    // Validate user type
    if (!['investor', 'advisor'].includes(userType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Role must be either "investor" or "advisor"' 
      });
    }

    // Check if user already exists
    const existingUser = await userService.getUserByWalletAddress(walletAddress);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Create new user
    const newUser = await userService.createUser({
      name,
      email,
      walletAddress,
      userType,
      portfolioTag
    });

    res.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        walletAddress: newUser.wallet_address,
        userType: newUser.user_type,
        portfolioTag: newUser.portfolio_tag,
        balanceUsd: newUser.balance_usd,
        balanceTokens: newUser.balance_tokens
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
});

// Get user data by wallet address
router.get('/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const user = await userService.getUserByWalletAddress(walletAddress);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        walletAddress: user.wallet_address,
        userType: user.user_type,
        portfolioTag: user.portfolio_tag,
        balanceUsd: user.balance_usd,
        balanceTokens: user.balance_tokens
      }
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Update user balance
router.put('/user/:walletAddress/balance', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { balanceUsd, balanceTokens, balanceWatts } = req.body;
    
    const user = await userService.getUserByWalletAddress(walletAddress);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update user balance
    const updatedUser = await userService.updateUserBalance(walletAddress, {
      balanceUsd: balanceUsd ?? user.balance_usd,
      balanceTokens: (balanceTokens ?? balanceWatts) ?? user.balance_tokens
    });

    res.json({
      success: true,
      message: 'Balance updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        walletAddress: updatedUser.wallet_address,
        userType: updatedUser.user_type,
        portfolioTag: updatedUser.portfolio_tag,
        balanceUsd: updatedUser.balance_usd,
        balanceTokens: updatedUser.balance_tokens
      }
    });
  } catch (error) {
    console.error('Error updating user balance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});



// Clear all data from database (for development/testing purposes)
router.delete('/clear-data', async (req, res) => {
  try {
    await clearAllData();
    res.json({
      success: true,
      message: 'All data cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear data' 
    });
  }
});

module.exports = router; 
