import React from 'react';
import { exportToCSV } from '../utils/export';
import { useToast } from '../hooks/useToast';

const statusBadge = {
  completed: 'text-emerald-200 bg-emerald-500/10 border border-emerald-500/40',
  pending: 'text-amber-200 bg-amber-500/10 border border-amber-500/40',
  failed: 'text-rose-200 bg-rose-500/10 border border-rose-500/40'
};

const TransactionTable = ({ transactions, loading }) => {
  const { success, error } = useToast();

  const handleExport = () => {
    if (!transactions || transactions.length === 0) {
      error('No transactions to export');
      return;
    }
    
    try {
      exportToCSV(transactions, 'phanta-transactions');
      success('Transactions exported to CSV!');
    } catch (err) {
      error('Failed to export transactions');
    }
  };
  if (loading) {
    return (
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-indigo-500/20 rounded w-52 mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-14 bg-indigo-500/10 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6">
        <p className="text-sm text-indigo-200/80">No transactions recorded for this wallet yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl backdrop-blur">
      <div className="px-6 py-4 border-b border-indigo-500/20 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-indigo-100">Recent activity</h3>
          <p className="text-sm text-indigo-200/80">Track swaps, deposits, yield claims, and allocations in one feed.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={!transactions || transactions.length === 0}
          className="text-sm font-medium text-indigo-200/80 hover:text-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <span>📥</span>
          <span>Export CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-indigo-500/20">
          <thead className="bg-indigo-500/10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-200/70 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-200/70 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-200/70 uppercase tracking-wider">Asset</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-indigo-200/70 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-indigo-200/70 uppercase tracking-wider">USD</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-200/70 uppercase tracking-wider">Counterparty</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-200/70 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-indigo-500/5 divide-y divide-indigo-500/20">
            {transactions.map((txn) => (
              <tr key={txn.id} className="hover:bg-indigo-500/10 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-200">
                  {new Date(txn.date).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-100">
                  {txn.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-200/80">
                  {txn.asset}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-indigo-200">
                  {typeof txn.amountCrypto === 'number' ? txn.amountCrypto.toLocaleString() : txn.amountCrypto}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-indigo-100">
                  ${txn.amountUsd.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-200/80">
                  {txn.counterparty}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge[txn.status] || statusBadge.completed}`}>
                    {txn.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
