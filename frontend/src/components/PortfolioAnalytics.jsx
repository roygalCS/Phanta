import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#A5B4FC',
        usePointStyle: true,
        pointStyleWidth: 12,
        padding: 16
      }
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.92)',
      titleColor: '#E0E7FF',
      bodyColor: '#E2E8F0',
      cornerRadius: 10
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(148, 163, 184, 0.15)',
        drawBorder: false
      },
      ticks: {
        color: '#CBD5F5',
        font: {
          size: 12
        }
      }
    },
    y: {
      grid: {
        color: 'rgba(148, 163, 184, 0.15)',
        drawBorder: false
      },
      ticks: {
        color: '#CBD5F5',
        font: {
          size: 12
        }
      }
    }
  }
};

const PortfolioAnalytics = ({ overview, loading }) => {
  const allocationData = useMemo(() => {
    if (!overview?.savingsAllocation) return null;

    return {
      labels: overview.savingsAllocation.map((item) => item.label),
      datasets: [
        {
          label: 'Allocation %',
          data: overview.savingsAllocation.map((item) => item.percentage),
          backgroundColor: [
            'rgba(59, 130, 246, 0.85)',
            'rgba(99, 102, 241, 0.85)',
            'rgba(16, 185, 129, 0.85)',
            'rgba(249, 115, 22, 0.85)',
            'rgba(244, 114, 182, 0.85)'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    };
  }, [overview]);

  const performanceData = useMemo(() => {
    if (!overview?.performanceTrend) return null;

    return {
      labels: overview.performanceTrend.labels,
      datasets: [
        {
          label: 'Portfolio USD value',
          data: overview.performanceTrend.usdBalances,
          fill: true,
          tension: 0.35,
          borderColor: 'rgba(37, 99, 235, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          pointRadius: 4,
          pointBackgroundColor: 'rgba(37, 99, 235, 1)'
        }
      ]
    };
  }, [overview]);

  const comparisonData = useMemo(() => {
    if (!overview?.comparison) return null;

    return {
      labels: overview.comparison.labels,
      datasets: [
        {
          label: 'Blockchain Holdings (USD)',
          data: overview.comparison.cryptoUsdValue,
          tension: 0.35,
          fill: false,
          borderColor: 'rgba(59, 130, 246, 1)',
          pointRadius: 4,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)'
        },
        {
          label: 'Fiat Equivalent (USD)',
          data: overview.comparison.fiatUsdValue,
          tension: 0.35,
          fill: false,
          borderColor: 'rgba(16, 185, 129, 1)',
          pointRadius: 4,
          pointBackgroundColor: 'rgba(16, 185, 129, 1)'
        }
      ]
    };
  }, [overview]);

  if (loading) {
    return (
      <div className="bg-indigo-500/10 rounded-2xl border border-indigo-500/20 p-6 animate-pulse">
        <div className="h-6 bg-indigo-500/20 rounded w-48 mb-6"></div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-indigo-500/10 rounded-xl"></div>
          <div className="h-64 bg-indigo-500/10 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="bg-indigo-500/10 rounded-2xl border border-indigo-500/20 p-6">
        <p className="text-sm text-indigo-200/80">Connect a wallet to see portfolio analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="bg-indigo-500/10 rounded-2xl border border-indigo-500/20 p-6 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-indigo-100">Performance momentum</h3>
          <span className="text-xs uppercase tracking-wide text-indigo-200 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/40">
            Updated {new Date(overview.lastUpdated).toLocaleDateString()}
          </span>
        </div>
        <div className="h-72">
          <Line data={performanceData} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } } }} />
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="bg-indigo-500/10 rounded-2xl border border-indigo-500/20 p-6 flex flex-col backdrop-blur">
          <h3 className="text-lg font-semibold text-indigo-100 mb-4">Blockchain vs fiat value</h3>
          <div className="h-64">
            <Line data={comparisonData} options={chartDefaults} />
          </div>
        </section>

        <section className="bg-indigo-500/10 rounded-2xl border border-indigo-500/20 p-6 flex flex-col backdrop-blur">
          <h3 className="text-lg font-semibold text-indigo-100 mb-4">Savings allocation</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={allocationData}
              options={{
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: '#C7D2FE',
                      usePointStyle: true,
                      padding: 18
                    }
                  }
                }
              }}
            />
          </div>
          <ul className="mt-4 space-y-2 text-sm text-indigo-200">
            {overview.savingsAllocation.map((item) => (
              <li key={item.label} className="flex items-center justify-between">
                <span>{item.label}</span>
                <span className="font-medium text-indigo-100">{item.percentage}% · ${item.usdValue.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default PortfolioAnalytics;
