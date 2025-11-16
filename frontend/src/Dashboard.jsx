import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useWallet } from './WalletContext';
import apiService from './services/api';
import PortfolioAnalytics from './components/PortfolioAnalytics';
import TransactionTable from './components/TransactionTable';
import GeminiSummaryCard from './components/GeminiSummaryCard';
import TradingRecommendations from './components/TradingRecommendations';
import QuickStats from './components/QuickStats';
import PortfolioCard from './components/PortfolioCard';
import AnimatedNumber from './components/AnimatedNumber';
import { SkeletonCard, SkeletonTable } from './components/Skeleton';
import { useToast } from './hooks/useToast';
import { exportToCSV, exportToJSON } from './utils/export';

const Dashboard = ({ initialTab = 'overview' }) => {
  const { account, balance, isConnected } = useWallet();
  const { success, error: showError } = useToast();
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [error, setError] = useState(null);
  const [funds, setFunds] = useState([]);
  const [newFund, setNewFund] = useState({ name: '', thesis: '' });
  const [fundError, setFundError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    setSelectedTab(initialTab);
  }, [initialTab]);

  const loadOverview = useCallback(async (showToast = false) => {
    if (!account) return;
    
    setLoadingOverview(true);
    try {
      const response = await apiService.getPortfolioOverview(account);
      setOverview(response.overview);
      setError(null);
      setLastRefresh(new Date());
      if (showToast) {
        success('Portfolio data refreshed!');
      }
    } catch (err) {
      console.error('Unable to load overview:', err);
      setError('We could not load your portfolio snapshot. Please retry shortly.');
      setOverview(null);
      if (showToast) {
        showError('Failed to refresh portfolio data');
      }
    } finally {
      setLoadingOverview(false);
    }
  }, [account, success, showError]);

  const loadTransactions = useCallback(async () => {
    if (!account) return;
    
    setLoadingTransactions(true);
    try {
      const response = await apiService.getFinanceTransactions(account);
      setTransactions(response.transactions || []);
    } catch (err) {
      console.error('Unable to load transactions:', err);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  }, [account]);

  useEffect(() => {
    if (!account) {
      setOverview(null);
      setTransactions([]);
      return;
    }

    loadOverview();
    loadTransactions();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadOverview();
    }, 30000);

    return () => clearInterval(interval);
  }, [account, loadOverview, loadTransactions]);

  // Removed fake funds initialization - only show user-created funds

  const pricePerEth = useMemo(() => {
    if (!overview?.balances?.crypto?.amount) {
      return null;
    }
    return overview.balances.crypto.usdValue / overview.balances.crypto.amount;
  }, [overview]);

  // Only show real income streams if they exist
  const incomeStreams = (overview?.incomeStreams && overview.incomeStreams.length > 0) ? overview.incomeStreams : [];

  const addFund = (event) => {
    event.preventDefault();
    if (!newFund.name.trim()) {
      setFundError('Name your fund to keep things organized.');
      return;
    }
    setFunds((prev) => [
      { name: newFund.name.trim(), thesis: newFund.thesis.trim() || 'No thesis provided yet.' },
      ...prev
    ]);
    setNewFund({ name: '', thesis: '' });
    setFundError('');
  };

  const renderOverview = () => {
    if (loadingOverview && !overview) {
      return (
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      );
    }

    if (!isConnected || !account) {
      return (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-8 text-indigo-200/70">
          Connect a wallet to populate your dashboard.
        </div>
      );
    }

    if (!overview && !loadingOverview) {
      return (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-8 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-indigo-100 mb-2">No Portfolio Data</h3>
          <p className="text-sm text-indigo-200/80 mb-4">
            {error || 'Unable to load portfolio data. This could be because:'}
          </p>
          <ul className="text-xs text-indigo-300/70 text-left max-w-md mx-auto space-y-1 mb-4">
            <li>• Your wallet has no tokens or SOL</li>
            <li>• RPC endpoints are temporarily unavailable</li>
            <li>• Network connectivity issues</li>
          </ul>
          <button
            onClick={() => {
              setLoadingOverview(true);
              setError(null);
              const loadOverview = async () => {
                try {
                  const response = await apiService.getPortfolioOverview(account);
                  setOverview(response.overview);
                  setError(null);
                } catch (err) {
                  console.error('Unable to load overview:', err);
                  setError('We could not load your portfolio snapshot. Please retry shortly.');
                  setOverview(null);
                } finally {
                  setLoadingOverview(false);
                }
              };
              loadOverview();
            }}
                className="px-6 py-2.5 bg-indigo-500/30 border border-indigo-500/40 text-indigo-100 rounded-xl text-sm hover:bg-indigo-500/40 hover:border-indigo-500/60 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      );
    }

    if (!overview) {
      return null; // Still loading
    }

    return (
      <div className="space-y-6">
        {/* Quick Stats */}
        <QuickStats overview={overview} onRefresh={() => loadOverview(true)} />

        {/* Main Portfolio Card */}
        <div className="bg-indigo-500/15 border border-indigo-500/30 rounded-3xl p-8 shadow-[0_30px_80px_rgba(79,70,229,0.25)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-indigo-200">Total assets</p>
              <p className="text-4xl sm:text-5xl font-semibold text-indigo-50 mt-2">
                $<AnimatedNumber value={overview.balances.totalUsd} decimals={0} />
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastRefresh && (
                <span className="text-xs text-gray-400">
                  Updated {lastRefresh.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => loadOverview(true)}
                disabled={loadingOverview}
                className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Refresh portfolio data"
              >
                {loadingOverview ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Refresh</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm text-indigo-100/80">
                <span>{overview.balances.crypto.amount.toFixed(2)} {overview.balances.crypto.symbol}</span>
                <span>• Stable reserve ${overview.balances.stablecoinsUsd.toLocaleString()}</span>
                <span>• Fiat runway ${overview.runwayReserveUsd.toLocaleString()}</span>
              </div>
            </div>
            <div className="grid gap-3 text-sm text-indigo-100/80">
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-widest text-indigo-200/80">24h PnL</p>
                <p className={`text-lg font-semibold ${overview.growth.percentChange >= 0 ? 'text-indigo-200' : 'text-indigo-300/70'}`}>
                  {overview.growth.percentChange > 0 ? '+' : ''}
                  <AnimatedNumber value={overview.growth.percentChange || 0} decimals={2} suffix="%" />
                </p>
                <p className="text-xs mt-1 text-indigo-100/70">
                  {overview.growth.deltaUsd > 0 ? '+' : ''}$
                  <AnimatedNumber value={Math.abs(overview.growth.deltaUsd || 0)} decimals={2} />
                </p>
              </div>
              {overview.riskAnalysis && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-widest text-indigo-200/80">Risk Score</p>
                  <p className={`text-lg font-semibold ${
                    overview.riskAnalysis.riskScore < 40 ? 'text-indigo-200' : 
                    overview.riskAnalysis.riskScore < 70 ? 'text-indigo-300' : 'text-indigo-400'
                  }`}>
                    {overview.riskAnalysis.riskScore}/100
                  </p>
                  <p className="text-xs mt-1 text-indigo-100/70 capitalize">
                    {overview.riskAnalysis.riskLevel} risk
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Risk Warnings */}
        {overview?.riskAnalysis?.warnings?.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
            <p className="text-sm font-semibold text-amber-200 mb-2">⚠️ Risk Warnings</p>
            <ul className="space-y-1 text-xs text-amber-100/80">
              {overview.riskAnalysis.warnings.map((warning, idx) => (
                <li key={idx}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Real Holdings Display */}
        {overview?.holdings && overview.holdings.length > 0 && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-indigo-100">Portfolio Holdings</h3>
              <button
                onClick={() => {
                  const exportData = overview.holdings.map(h => ({
                    Symbol: h.symbol,
                    Amount: h.amount,
                    Price: h.price,
                    'USD Value': h.usdValue,
                    Percentage: `${((h.usdValue / overview.balances.totalUsd) * 100).toFixed(2)}%`
                  }));
                  exportToCSV(exportData, 'phanta-holdings');
                  success('Holdings exported!');
                }}
                className="text-xs text-indigo-200/80 hover:text-indigo-100 transition-colors flex items-center gap-1"
              >
                <span>📥</span>
                <span>Export</span>
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {overview.holdings.slice(0, 10).map((holding, idx) => (
                <PortfolioCard
                  key={holding.mint || idx}
                  holding={holding}
                  totalValue={overview.balances.totalUsd}
                  index={idx}
                />
              ))}
            </div>
            {overview.holdings.length > 10 && (
              <p className="text-xs text-indigo-300/70 mt-4 text-center">
                Showing top 10 of {overview.holdings.length} holdings
              </p>
            )}
          </div>
        )}

        {/* Trading Recommendations */}
        {overview?.riskAnalysis && (
          <TradingRecommendations 
            portfolio={{ holdings: overview.holdings, totalValue: overview.balances.totalUsd }}
            riskAnalysis={overview.riskAnalysis}
          />
        )}

        <PortfolioAnalytics overview={overview} loading={loadingOverview} />

        <GeminiSummaryCard overview={overview} />
      </div>
    );
  };

  const renderIncomeStreams = () => (
    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-indigo-100">Yield sources</h3>
                <p className="text-sm text-indigo-200/80">Real yield data from your on-chain positions.</p>
              </div>
              {incomeStreams.length > 0 && (
                <span className="px-3 py-1 text-xs rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-200">
                  ${incomeStreams.reduce((acc, stream) => acc + stream.usdPerMonth, 0).toLocaleString()} / mo
                </span>
              )}
            </div>
            <div className="space-y-4">
              {incomeStreams.length > 0 ? (
                incomeStreams.map((stream) => (
                  <div key={stream.label} className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-indigo-100">{stream.label}</p>
                      <p className="text-xs text-indigo-200/70">APR {stream.apr}%</p>
                    </div>
                    <span className="text-sm font-semibold text-indigo-200">${stream.usdPerMonth.toLocaleString()} / mo</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-indigo-300/70">No active yield sources detected from your on-chain positions.</p>
              )}
            </div>
          </div>
  );

  const renderWalletFingerprint = () => (
    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-8">
      <h3 className="text-lg font-semibold text-indigo-100">Wallet fingerprint</h3>
      <ul className="mt-6 space-y-3 text-sm text-indigo-200/80">
        <li className="flex items-center justify-between">
          <span>Wallet address</span>
          <span className="font-medium text-indigo-100">{account ? `${account.slice(0, 6)}…${account.slice(-4)}` : '—'}</span>
        </li>
        <li className="flex items-center justify-between">
          <span>Phantom balance</span>
          <span className="font-medium text-indigo-100">{balance} SOL</span>
        </li>
        {pricePerEth && (
          <li className="flex items-center justify-between">
            <span>Implied SOL spot</span>
          <span className="font-medium text-indigo-100">${pricePerEth.toFixed(2)} / SOL</span>
        </li>
        )}
        <li className="flex items-center justify-between">
          <span>Risk profile</span>
          <span className="capitalize font-medium text-indigo-100">{overview?.riskProfile || 'moderate'}</span>
        </li>
        <li className="flex items-center justify-between">
          <span>Last portfolio sync</span>
          <span className="font-medium text-indigo-100">
            {overview?.lastUpdated ? new Date(overview.lastUpdated).toLocaleString() : '—'}
          </span>
        </li>
      </ul>
    </div>
  );

  const renderPortfolioSplit = () => (
    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-8 space-y-6">
      <h3 className="text-lg font-semibold text-indigo-100">Capital allocation</h3>
      <p className="text-sm text-indigo-200/80">How your balance is apportioned across strategies.</p>
      <div className="space-y-4">
        {overview?.savingsAllocation?.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-indigo-200">{item.label}</span>
              <span className="text-indigo-100 font-medium">{item.percentage}% · ${item.usdValue.toLocaleString()}</span>
            </div>
            <div className="h-2 rounded-full bg-indigo-500/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-indigo-300"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFunds = () => (
    <div className="space-y-6">
      <form onSubmit={addFund} className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6 space-y-4">
              <div>
                <label htmlFor="fund-name" className="block text-sm font-semibold text-indigo-100 mb-2">
                  Create a new fund
                </label>
                <input
                  id="fund-name"
                  type="text"
                  value={newFund.name}
                  onChange={(event) => setNewFund((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. Momentum Plays"
                  className="w-full rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-100 placeholder-indigo-300/50 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                />
              </div>
              <div>
                <label htmlFor="fund-thesis" className="block text-sm font-semibold text-indigo-100 mb-2">
                  Thesis / Objective
                </label>
                <textarea
                  id="fund-thesis"
                  rows={3}
                  value={newFund.thesis}
                  onChange={(event) => setNewFund((prev) => ({ ...prev, thesis: event.target.value }))}
                  placeholder="Outline the allocation strategy Phanta should track."
                  className="w-full rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-100 placeholder-indigo-300/50 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                />
              </div>
              {fundError && <p className="text-xs text-indigo-300">{fundError}</p>}
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-500/30 border border-indigo-500/40 text-indigo-100 text-sm font-medium hover:bg-indigo-500/40 hover:border-indigo-500/60 transition-colors"
              >
                Add fund
              </button>
            </form>

            <div className="space-y-4">
              {funds.map((fund) => (
                <div key={fund.name} className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold text-indigo-100">{fund.name}</h4>
                    <span className="text-xs uppercase tracking-widest text-indigo-300">Custom fund</span>
                  </div>
                  <p className="text-sm text-indigo-200/80 mt-2">{fund.thesis}</p>
                </div>
              ))}
              {!funds.length && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6 text-sm text-indigo-300/70">
                  No funds yet. Create one to start tracking thematic allocations.
                </div>
              )}
            </div>
    </div>
  );

  const renderTab = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'transactions':
        return <TransactionTable transactions={transactions} loading={loadingTransactions} />;
      case 'income':
        return renderIncomeStreams();
      case 'fingerprint':
        return renderWalletFingerprint();
      case 'portfolio':
        return renderPortfolioSplit();
      case 'funds':
        return renderFunds();
      default:
        return renderOverview();
    }
  };

  return (
          <div className="px-[5vw] py-10 bg-black min-h-full space-y-6 overflow-y-auto">
            {error && (
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-3xl p-4 text-sm text-indigo-200">
                {error}
              </div>
            )}
      {renderTab()}
    </div>
  );
};

export default Dashboard;
