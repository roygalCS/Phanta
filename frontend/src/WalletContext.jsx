import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import apiService from './services/api';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [connection, setConnection] = useState(null);
  const connectionRef = useRef(null);
  const [publicKey, setPublicKey] = useState(null);
  const [balance, setBalance] = useState('0.0000');
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Initialize Solana connection - using public RPC endpoint
  useEffect(() => {
    // Use a public RPC endpoint - try multiple fallbacks
    const rpcEndpoints = [
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
    ];
    
    const solanaConnection = new Connection(rpcEndpoints[0], {
      commitment: 'confirmed',
    });
    setConnection(solanaConnection);
    connectionRef.current = solanaConnection;
    checkExistingConnection(solanaConnection);
  }, []);

  const checkExistingConnection = async (solanaConnection) => {
    try {
      const wasConnected = localStorage.getItem('walletConnected') === 'true';
      const savedAccount = localStorage.getItem('walletAccount');
      
      if (wasConnected && savedAccount && window.solana?.isPhantom) {
        // Check if Phantom still has the account connected
        try {
          const response = await window.solana.connect({ onlyIfTrusted: true });
          if (response.publicKey.toString() === savedAccount) {
            await establishWalletConnection(response.publicKey, solanaConnection);
          } else {
            clearWalletState();
          }
        } catch (error) {
          // User hasn't authorized or wallet disconnected
          clearWalletState();
        }
      }
    } catch (error) {
      console.error('Error checking existing connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const establishWalletConnection = async (publicKeyInstance, solanaConnection = null) => {
    try {
      setIsLoading(true);
      
      const walletAddress = publicKeyInstance.toString();
      setAccount(walletAddress);
      setPublicKey(publicKeyInstance);
      setIsConnected(true);
      
      // Use provided connection or state connection
      const activeConnection = solanaConnection || connection;
      
      // Fetch balance from Solana network
      if (activeConnection) {
        try {
          const balanceLamports = await activeConnection.getBalance(publicKeyInstance);
          const balanceSol = balanceLamports / LAMPORTS_PER_SOL;
          setBalance(balanceSol.toFixed(4));
        } catch (balanceError) {
          console.warn('Could not fetch balance, using default:', balanceError);
          // Set a default balance if RPC fails
          setBalance('0.0000');
        }
      }
      
      // Persist connection state
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAccount', walletAddress);
      
      // Verify user in backend system
      await checkUserInBackend(walletAddress);
      
      // Monitor account changes
      if (window.solana) {
        window.solana.on('accountChanged', async (newPublicKey) => {
          if (newPublicKey) {
            const newAddress = newPublicKey.toString();
            setAccount(newAddress);
            setPublicKey(newPublicKey);
            await checkUserInBackend(newAddress);
            
            // Use the connection ref which is always available
            const activeConnection = connectionRef.current;
            if (activeConnection) {
              try {
                const balanceLamports = await activeConnection.getBalance(newPublicKey);
                const balanceSol = balanceLamports / LAMPORTS_PER_SOL;
                setBalance(balanceSol.toFixed(4));
              } catch (balanceError) {
                console.warn('Could not fetch balance on account change:', balanceError);
                setBalance('0.0000');
              }
            }
          } else {
            disconnectWallet();
          }
        });
      }
    } catch (error) {
      console.error('Error establishing wallet connection:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    if (!window.solana?.isPhantom) {
      alert('Phantom wallet is required to use this application. Please install Phantom from https://phantom.app');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Request connection from Phantom
      const response = await window.solana.connect();
      // Use connectionRef which is always available
      const activeConnection = connectionRef.current || connection || new Connection('https://api.mainnet-beta.solana.com', {
        commitment: 'confirmed',
      });
      await establishWalletConnection(response.publicKey, activeConnection);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setIsLoading(false);
      if (error.code !== 4001) { // User rejected the request
        alert('Failed to connect wallet. Please try again.');
      }
    }
  };

  const checkUserInBackend = async (walletAddress) => {
    try {
      const response = await apiService.checkUser(walletAddress);
      
      if (response.exists) {
        setUserData(response.user);
        setIsOnboarding(false);
      } else {
        setUserData(null);
        setIsOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking user in backend:', error);
      setUserData(null);
      setIsOnboarding(false);
    }
  };

  const completeOnboarding = (user) => {
    setUserData(user);
    setIsOnboarding(false);
  };

  const disconnectWallet = async () => {
    try {
      if (window.solana && isConnected) {
        await window.solana.disconnect();
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    } finally {
      setIsConnected(false);
      setAccount('');
      setConnection(null);
      setPublicKey(null);
      setBalance('0.0000');
      setUserData(null);
      setIsOnboarding(false);
      
      clearWalletState();
    }
  };

  const clearWalletState = () => {
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAccount');
  };

  const value = {
    isConnected,
    account,
    connection,
    publicKey,
    balance,
    isLoading,
    userData,
    isOnboarding,
    connectWallet,
    disconnectWallet,
    completeOnboarding
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
