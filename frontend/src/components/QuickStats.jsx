import React from 'react';
import { useWallet } from '../WalletContext';

const QuickStats = ({ overview, onRefresh }) => {
  const { balance } = useWallet();

  if (!overview) return null;

  const stats = [
    {
      label: 'Total Value',
      value: `$${overview.balances?.totalUsd?.toLocaleString() || '0'}`,
      change: overview.growth?.percentChange,
      icon: '💰'
    },
    {
      label: '24h Change',
      value: `${overview.growth?.percentChange >= 0 ? '+' : ''}${overview.growth?.percentChange?.toFixed(2) || '0.00'}%`,
      change: overview.growth?.percentChange,
      icon: '📈',
      color: overview.growth?.percentChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
    },
    {
      label: 'Risk Score',
      value: `${overview.riskAnalysis?.riskScore || 0}/100`,
      icon: '⚠️',
      color: overview.riskAnalysis?.riskScore < 40 ? 'text-emerald-400' : 
             overview.riskAnalysis?.riskScore < 70 ? 'text-amber-400' : 'text-rose-400'
    },
    {
      label: 'Holdings',
      value: `${overview.holdings?.length || 0} tokens`,
      icon: '🪙'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-4 hover:bg-[#1a1a1a] transition-all duration-200 hover:border-[#2a2a2a] group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{stat.icon}</span>
            {onRefresh && index === 0 && (
              <button
                onClick={onRefresh}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white text-xs"
                title="Refresh data"
              >
                🔄
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
          <p className={`text-lg font-semibold ${stat.color || 'text-white'}`}>
            {stat.value}
          </p>
          {stat.change !== undefined && (
            <p className={`text-xs mt-1 ${stat.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stat.change >= 0 ? '↑' : '↓'} ${Math.abs(overview.growth?.deltaUsd || 0).toFixed(2)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default QuickStats;

