import React from 'react';
import { useWallet } from './WalletContext';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import PhantaLogo from './components/PhantaLogo';
import ToastContainer from './components/ToastContainer';
import { useToast } from './hooks/useToast';
import './App.css';

const App = () => {
  const {
    isConnected,
    account,
    userData,
    isOnboarding,
    connectWallet,
    completeOnboarding,
    isLoading
  } = useWallet();
  
  const [showDashboard, setShowDashboard] = React.useState(false);
  const { toasts, removeToast, success, error } = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-800 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-sm">Connecting...</p>
        </div>
      </div>
    );
  }

  if (isConnected && isOnboarding && !userData) {
    return (
      <Onboarding
        walletAddress={account}
        onComplete={completeOnboarding}
      />
    );
  }

  if (isConnected && userData && showDashboard) {
    return <Layout />;
  }

  // Ultra minimalistic Gemini dark mode style
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Main content - Ultra minimal */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          {/* Phanta bottle logo - Large with hover animation */}
          <div className="flex justify-center mb-16">
            <PhantaLogo size={96} />
          </div>

          {/* Title - Ultra minimal */}
          <h1 className="text-8xl md:text-9xl font-extralight text-center mb-20 text-white tracking-tighter animate-fade-in">
            Phanta
          </h1>

          {/* Main action button - With hover scale effect */}
          <div className="flex justify-center mb-16">
            {!isConnected ? (
              <button
                onClick={async () => {
                  try {
                    await connectWallet();
                    success('Wallet connected successfully!');
                  } catch (err) {
                    error('Failed to connect wallet. Please try again.');
                  }
                }}
                className="px-10 py-4 bg-[#1a73e8] text-white rounded-full text-sm font-normal transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/40 active:scale-105"
              >
                Connect Phantom Wallet
              </button>
            ) : isConnected && userData && !isOnboarding ? (
              <button
                onClick={() => {
                  setShowDashboard(true);
                  success('Welcome back!');
                }}
                className="px-10 py-4 bg-[#1a73e8] text-white rounded-full text-sm font-normal transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/40 active:scale-105"
              >
                Launch Dashboard
              </button>
            ) : null}
            </div>
          </div>
      </main>
    </div>
  );
};

export default App;
