import React, { useEffect, useMemo, useState } from 'react';
import { useWallet } from './WalletContext';
import apiService from './services/api';
import PortfolioAnalytics from './components/PortfolioAnalytics';
import TransactionTable from './components/TransactionTable';
import GeminiSummaryCard from './components/GeminiSummaryCard';
import TradingRecommendations from './components/TradingRecommendations';

const Dashboard = ({ initialTab = 'overview' }) => {
  const { account, balance } = useWallet();
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [error, setError] = useState(null);
  const [funds, setFunds] = useState([]);
  const [newFund, setNewFund] = useState({ name: '', thesis: '' });
  const [fundError, setFundError] = useState('');

  useEffect(() => {
    setSelectedTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!account) {
      setOverview(null);
      setTransactions([]);
      return;
    }

    const loadOverview = async () => {
      setLoadingOverview(true);
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

    const loadTransactions = async () => {
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
    };

    loadOverview();
    loadTransactions();
  }, [account]);

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
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-8 animate-pulse h-48" />
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-8 animate-pulse h-80" />
        </div>
      );
    }

    if (!overview) {
      return (
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-8 text-slate-400">
          Connect a wallet to populate your dashboard.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-indigo-500/15 border border-indigo-500/30 rounded-3xl p-8 shadow-[0_30px_80px_rgba(79,70,229,0.25)]">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.35em] text-indigo-200">Total assets</p>
              <p className="text-4xl sm:text-5xl font-semibold text-indigo-50">
                ${overview.balances.totalUsd.toLocaleString()}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-indigo-100/80">
                <span>{overview.balances.crypto.amount.toFixed(2)} {overview.balances.crypto.symbol}</span>
                <span>• Stable reserve ${overview.balances.stablecoinsUsd.toLocaleString()}</span>
                <span>• Fiat runway ${overview.runwayReserveUsd.toLocaleString()}</span>
              </div>
            </div>
            <div className="grid gap-3 text-sm text-indigo-100/80">
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-widest text-indigo-200/80">24h PnL</p>
                <p className={`text-lg font-semibold ${overview.growth.percentChange >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {overview.growth.percentChange > 0 ? '+' : ''}{overview.growth.percentChange?.toFixed(2) || '0.00'}%
                </p>
                <p className="text-xs mt-1 text-indigo-100/70">
                  {overview.growth.deltaUsd > 0 ? '+' : ''}${overview.growth.deltaUsd?.toLocaleString() || '0.00'}
                </p>
              </div>
              {overview.riskAnalysis && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-widest text-indigo-200/80">Risk Score</p>
                  <p className={`text-lg font-semibold ${
                    overview.riskAnalysis.riskScore < 40 ? 'text-emerald-300' : 
                    overview.riskAnalysis.riskScore < 70 ? 'text-amber-300' : 'text-rose-300'
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
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Portfolio Holdings</h3>
            <div className="space-y-2">
              {overview.holdings.slice(0, 10).map((holding, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-900/80 rounded-xl p-3 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                      {holding.symbol?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-100">{holding.symbol || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{holding.amount?.toFixed(4) || '0'} @ ${holding.price?.toFixed(4) || '0'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-100">${holding.usdValue?.toFixed(2) || '0.00'}</p>
                    <p className="text-xs text-slate-400">
                      {((holding.usdValue / overview.balances.totalUsd) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
    <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Yield sources</h3>
          <p className="text-sm text-slate-400">Real yield data from your on-chain positions.</p>
        </div>
        {incomeStreams.length > 0 && (
          <span className="px-3 py-1 text-xs rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">
            ${incomeStreams.reduce((acc, stream) => acc + stream.usdPerMonth, 0).toLocaleString()} / mo
          </span>
        )}
      </div>
      <div className="space-y-4">
        {incomeStreams.length > 0 ? (
          incomeStreams.map((stream) => (
            <div key={stream.label} className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-100">{stream.label}</p>
                <p className="text-xs text-slate-400">APR {stream.apr}%</p>
              </div>
              <span className="text-sm font-semibold text-emerald-300">${stream.usdPerMonth.toLocaleString()} / mo</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No active yield sources detected from your on-chain positions.</p>
        )}
      </div>
    </div>
  );

  const renderWalletFingerprint = () => (
    <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-8">
      <h3 className="text-lg font-semibold text-slate-100">Wallet fingerprint</h3>
      <ul className="mt-6 space-y-3 text-sm text-slate-400">
        <li className="flex items-center justify-between">
          <span>Wallet address</span>
          <span className="font-medium text-slate-100">{account ? `${account.slice(0, 6)}…${account.slice(-4)}` : '—'}</span>
        </li>
        <li className="flex items-center justify-between">
          <span>Phantom balance</span>
          <span className="font-medium text-slate-100">{balance} SOL</span>
        </li>
        {pricePerEth && (
          <li className="flex items-center justify-between">
            <span>Implied SOL spot</span>
            <span className="font-medium text-slate-100">${pricePerEth.toFixed(2)} / SOL</span>
          </li>
        )}
        <li className="flex items-center justify-between">
          <span>Risk profile</span>
          <span className="capitalize font-medium text-slate-100">{overview?.riskProfile || 'moderate'}</span>
        </li>
        <li className="flex items-center justify-between">
          <span>Last portfolio sync</span>
          <span className="font-medium text-slate-100">
            {overview?.lastUpdated ? new Date(overview.lastUpdated).toLocaleString() : '—'}
          </span>
        </li>
      </ul>
    </div>
  );

  const renderPortfolioSplit = () => (
    <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-8 space-y-6">
      <h3 className="text-lg font-semibold text-slate-100">Capital allocation</h3>
      <p className="text-sm text-slate-400">How your balance is apportioned across strategies.</p>
      <div className="space-y-4">
        {overview?.savingsAllocation?.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{item.label}</span>
              <span className="text-slate-100 font-medium">{item.percentage}% · ${item.usdValue.toLocaleString()}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400"
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
      <form onSubmit={addFund} className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div>
          <label htmlFor="fund-name" className="block text-sm font-semibold text-slate-200 mb-2">
            Create a new fund
          </label>
          <input
            id="fund-name"
            type="text"
            value={newFund.name}
            onChange={(event) => setNewFund((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="e.g. Momentum Plays"
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
          />
        </div>
        <div>
          <label htmlFor="fund-thesis" className="block text-sm font-semibold text-slate-200 mb-2">
            Thesis / Objective
          </label>
          <textarea
            id="fund-thesis"
            rows={3}
            value={newFund.thesis}
            onChange={(event) => setNewFund((prev) => ({ ...prev, thesis: event.target.value }))}
            placeholder="Outline the allocation strategy Phanta should track."
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
          />
        </div>
        {fundError && <p className="text-xs text-rose-300">{fundError}</p>}
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-400 transition-colors"
        >
          Add fund
        </button>
      </form>

      <div className="space-y-4">
        {funds.map((fund) => (
          <div key={fund.name} className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-slate-100">{fund.name}</h4>
              <span className="text-xs uppercase tracking-widest text-indigo-300">Custom fund</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">{fund.thesis}</p>
          </div>
        ))}
        {!funds.length && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 text-sm text-slate-400">
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
    <div className="px-[5vw] py-10 bg-slate-950 min-h-full space-y-6 overflow-y-auto">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/40 rounded-3xl p-4 text-sm text-rose-200">
          {error}
        </div>
      )}
      {renderTab()}
    </div>
  );
};

export default Dashboard;
