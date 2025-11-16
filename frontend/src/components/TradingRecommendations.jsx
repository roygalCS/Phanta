import React from 'react';

const TradingRecommendations = ({ portfolio, riskAnalysis }) => {
  if (!portfolio || !riskAnalysis) return null;

  const recommendations = riskAnalysis.recommendations || [];
  const warnings = riskAnalysis.warnings || [];

  if (recommendations.length === 0 && warnings.length === 0) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
        <p className="text-sm font-semibold text-emerald-200 mb-1">✓ Portfolio Health</p>
        <p className="text-xs text-emerald-100/80">Your portfolio looks well-balanced. No immediate action needed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {warnings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-200 mb-2">⚠️ Risk Warnings</p>
          <ul className="space-y-1 text-xs text-amber-100/80">
            {warnings.map((warning, idx) => (
              <li key={idx}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4">
          <p className="text-sm font-semibold text-indigo-200 mb-2">💡 Recommendations</p>
          <ul className="space-y-1 text-xs text-indigo-100/80">
            {recommendations.map((rec, idx) => (
              <li key={idx}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Trading Suggestions */}
      {portfolio.holdings && portfolio.holdings.length > 0 && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
          <p className="text-sm font-semibold text-indigo-100 mb-2">📊 Quick Actions</p>
          <div className="space-y-2 text-xs text-indigo-200">
            <button className="w-full text-left px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/30 rounded-lg transition-colors">
              Rebalance portfolio for optimal allocation
            </button>
            <button className="w-full text-left px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/30 rounded-lg transition-colors">
              Add stablecoins for risk management
            </button>
            <button className="w-full text-left px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/30 rounded-lg transition-colors">
              Analyze top holding performance
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingRecommendations;

