import React, { useState } from 'react';
import apiService from '../services/api';

const Onboarding = ({ walletAddress, onComplete }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('investor');
  const [portfolioTag, setPortfolioTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !portfolioTag.trim()) {
      setError('Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.onboardUser({
        name: name.trim(),
        email: email.trim(),
        walletAddress,
        userType,
        portfolioTag: portfolioTag.trim()
      });

      onComplete(response.user);
    } catch (error) {
      setError(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-3xl border border-indigo-500/40 bg-indigo-500/15 text-indigo-200 font-semibold"
              aria-hidden="true"
            >
              AI
            </div>
          </div>
          <h2 className="text-3xl font-semibold text-slate-100">Let's set up your Phanta profile</h2>
          <p className="text-sm text-slate-400">
            Tell us who you are so Phanta can tailor insights to your portfolio.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 shadow-[0_10px_35px_rgba(8,15,40,0.45)]">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-slate-300 mb-2">
                Role
              </label>
              <select
                id="userType"
                name="userType"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
              >
                <option value="investor">Individual Investor</option>
                <option value="advisor">Advisor / Family Office</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Phanta adapts dashboards to match your role and objectives.
              </p>
            </div>

            <div>
              <label htmlFor="wallet" className="block text-sm font-medium text-slate-300 mb-2">
                Wallet Address
              </label>
              <input
                id="wallet"
                name="wallet"
                type="text"
                disabled
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-500"
                value={walletAddress}
              />
            </div>

            <div>
              <label htmlFor="portfolioTag" className="block text-sm font-medium text-slate-300 mb-2">
                Portfolio Tag
              </label>
              <input
                id="portfolioTag"
                name="portfolioTag"
                type="text"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                placeholder="e.g. founders-fund"
                value={portfolioTag}
                onChange={(e) => setPortfolioTag(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">
                A short handle Phanta can use to reference this portfolio.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-rose-200">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 rounded-xl text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Complete Setup'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-950 text-slate-500">
                What happens next?
              </span>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-slate-400">
            <p>Once you complete setup, you’ll unlock:</p>
            <ul className="mt-2 space-y-1">
              <li>• A unified view of on-chain and fiat holdings</li>
              <li>• AI-guided allocation ideas from Phanta + Gemini</li>
              <li>• Transaction history with clean yield & swap tracking</li>
              <li>• Analytics that benchmark performance over time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding; 
