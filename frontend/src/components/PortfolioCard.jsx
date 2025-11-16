import React from 'react';

const PortfolioCard = ({ holding, totalValue, index }) => {
  const percentage = totalValue > 0 ? (holding.usdValue / totalValue) * 100 : 0;
  const colors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
  ];
  const colorClass = colors[index % colors.length];

  return (
    <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-4 hover:bg-[#1a1a1a] transition-all duration-200 hover:border-[#2a2a2a] group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-sm`}>
            {holding.symbol?.charAt(0) || '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{holding.symbol || 'Unknown'}</p>
            <p className="text-xs text-gray-400">
              {holding.amount?.toFixed(4) || '0'} @ ${holding.price?.toFixed(4) || '0'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-white">${holding.usdValue?.toFixed(2) || '0.00'}</p>
          <p className="text-xs text-gray-400">{percentage.toFixed(1)}%</p>
        </div>
      </div>
      <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default PortfolioCard;

