const apiBaseFromEnv = typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : undefined;
const API_BASE_URL = (apiBaseFromEnv && apiBaseFromEnv.trim())
  ? apiBaseFromEnv.trim().replace(/\/$/, '')
  : 'http://localhost:3001/api';

class ApiService {
  // Check if user exists by wallet address
  async checkUser(walletAddress) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to check user');
      }

      return data;
    } catch (error) {
      console.error('Error checking user:', error);
      throw error;
    }
  }

  // Create new user (onboarding)
  async onboardUser(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to onboard user');
      }

      return data;
    } catch (error) {
      console.error('Error onboarding user:', error);
      throw error;
    }
  }

  // Get user data by wallet address
  async getUserData(walletAddress) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/user/${walletAddress}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get user data');
      }

      return data;
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  // Update user balance
  async updateUserBalance(walletAddress, balanceData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/user/${walletAddress}/balance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(balanceData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user balance');
      }

      return data;
    } catch (error) {
      console.error('Error updating user balance:', error);
      throw error;
    }
  }



  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Backend health check failed');
      }

      return data;
    } catch (error) {
      console.error('Error checking backend health:', error);
      throw error;
    }
  }

  // Orders API methods
  async getOrders(userAddress, status = null) {
    try {
      let url = `${API_BASE_URL}/orders/user/${userAddress}`;
      if (status) {
        url += `?status=${status}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }

      return data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  async createOrder(orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }

      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId, statusData) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update order status');
      }

      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  async deleteOrder(orderId) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete order');
      }

      return data;
    } catch (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  }

  // Finance dashboard endpoints
  async getPortfolioOverview(walletAddress) {
    try {
      const response = await fetch(`${API_BASE_URL}/finance/overview/${walletAddress}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load portfolio overview');
      }

      return data;
    } catch (error) {
      console.error('Error getting portfolio overview:', error);
      throw error;
    }
  }

  async getFinanceTransactions(walletAddress) {
    try {
      const response = await fetch(`${API_BASE_URL}/finance/transactions/${walletAddress}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load transactions');
      }

      return data;
    } catch (error) {
      console.error('Error getting finance transactions:', error);
      throw error;
    }
  }

  async sendAnalystMessage(payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/finance/ai-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch AI response');
      }

      return data;
    } catch (error) {
      console.error('Error contacting AI:', error);
      throw error;
    }
  }

  async sendGroupChatMessage(payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/finance/ai-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch AI response');
      }

      return data;
    } catch (error) {
      console.error('Error contacting AI for group chat:', error);
      throw error;
    }
  }

  async getStockMetrics(payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/finance/stocks/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to analyse tickers');
      }

      return data;
    } catch (error) {
      console.error('Error getting stock metrics:', error);
      throw error;
    }
  }

  // Get real-time Solana portfolio
  async getRealPortfolio(walletAddress) {
    try {
      const response = await fetch(`${API_BASE_URL}/finance/portfolio/${walletAddress}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load portfolio');
      }

      return data;
    } catch (error) {
      console.error('Error getting real portfolio:', error);
      throw error;
    }
  }

  // Group methods
  async getUserGroups(walletAddress) {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/user/${walletAddress}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load groups');
      }

      return data;
    } catch (error) {
      console.error('Error getting user groups:', error);
      throw error;
    }
  }

  async createGroup(groupData) {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create group');
      }

      return data;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  async joinGroup(joinData) {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(joinData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to join group');
      }

      return data;
    } catch (error) {
      console.error('Error joining group:', error);
      throw error;
    }
  }

  async getGroupDetails(groupAddress) {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupAddress}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load group');
      }

      return data;
    } catch (error) {
      console.error('Error getting group details:', error);
      throw error;
    }
  }
}

export default new ApiService();
