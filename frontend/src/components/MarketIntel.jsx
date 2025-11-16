import React, { useEffect, useMemo, useState, useCallback } from 'react';
import SearchBar from './SearchBar';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Scatter } from 'react-chartjs-2';
import apiService from '../services/api';
import GeminiMarketSummary from './GeminiMarketSummary';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const RANGE_OPTIONS = [
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
  { label: '2Y', value: '2y' }
];

const SERIES_COLORS = [
  { border: 'rgba(59, 130, 246, 1)', background: 'rgba(59, 130, 246, 0.15)' },
  { border: 'rgba(16, 185, 129, 1)', background: 'rgba(16, 185, 129, 0.15)' },
  { border: 'rgba(244, 114, 182, 1)', background: 'rgba(244, 114, 182, 0.15)' },
  { border: 'rgba(249, 115, 22, 1)', background: 'rgba(249, 115, 22, 0.15)' },
  { border: 'rgba(165, 180, 252, 1)', background: 'rgba(165, 180, 252, 0.15)' }
];

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#E2E8F0',
        usePointStyle: true,
        padding: 18
      }
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      titleColor: '#E2E8F0',
      bodyColor: '#CBD5F5',
      borderColor: 'rgba(59, 130, 246, 0.4)',
      borderWidth: 1
    }
  },
  elements: {
    point: {
      radius: 0
    }
  },
  scales: {
    x: {
      ticks: {
        color: '#A5B4FC',
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 10
      },
      grid: {
        color: 'rgba(148, 163, 184, 0.12)',
        drawBorder: false
      }
    },
    y: {
      ticks: {
        color: '#A5B4FC'
      },
      grid: {
        color: 'rgba(148, 163, 184, 0.12)',
        drawBorder: false
      }
    }
  }
};

const formatPercent = (value, digits = 2) => (Number.isFinite(value) ? `${value.toFixed(digits)}%` : '—');
const formatNumber = (value, digits = 2) => (Number.isFinite(value) ? value.toFixed(digits) : '—');
const formatCurrency = (value, currency = 'USD') =>
  Number.isFinite(value)
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2
      }).format(value)
    : '—';

const correlationBackground = (value) => {
  if (!Number.isFinite(value)) {
    return 'rgba(15, 23, 42, 0.8)';
  }
  const intensity = Math.min(Math.abs(value), 1);
  const alpha = 0.12 + intensity * 0.45;
  return value >= 0
    ? `rgba(59, 130, 246, ${alpha.toFixed(3)})`
    : `rgba(244, 114, 182, ${alpha.toFixed(3)})`;
};

const correlationText = (value) => (Math.abs(value) > 0.6 ? '#0f172a' : '#e2e8f0');

const MarketIntel = () => {
  const [symbolsInput, setSymbolsInput] = useState('SOL, BTC, ETH');
  const [range, setRange] = useState('6mo');
  const [interval] = useState('1d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [insights, setInsights] = useState(null);
  const [partialErrors, setPartialErrors] = useState([]);
  const [activeRegressionIndex, setActiveRegressionIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMarketIntel = useCallback(async () => {
    const symbols = symbolsInput
      .split(',')
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean);

    if (!symbols.length) {
      setError('Add at least one blockchain asset to analyse.');
      setInsights(null);
      return;
    }

    setLoading(true);
    setError('');
    setPartialErrors([]);

    try {
      console.log('[MarketIntel] Fetching data for:', { symbols, range, interval });
      const response = await apiService.getCryptoMetrics({ symbols, range, interval });
      console.log('[MarketIntel] Response received:', response);
      
      if (!response || !response.data || response.data.length === 0) {
        // Check if it's a rate limit issue
        if (response?.errors?.some(e => e.message?.includes('Rate limit'))) {
          throw new Error('CoinGecko API rate limit exceeded. The free tier allows ~10-30 calls/minute. Please wait 1-2 minutes and try again, or reduce the number of blockchain assets.');
        }
        throw new Error('No data could be fetched for any of the requested blockchain assets. Please check the symbols and try again.');
      }
      
      setInsights(response);
      setPartialErrors(response.errors || []);
    } catch (err) {
      console.error('[MarketIntel] Error:', err);
      setInsights(null);
      setPartialErrors([]);
      const errorMessage = err.response?.data?.message || err.message || 'Unable to load blockchain market intelligence right now.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [symbolsInput, range, interval]);

  useEffect(() => {
    fetchMarketIntel();
  }, [fetchMarketIntel]);

  const regressionCount = insights?.analytics?.regressionAnalytics?.length || 0;

  useEffect(() => {
    setActiveRegressionIndex(0);
  }, [regressionCount]);

  useEffect(() => {
    if (activeRegressionIndex > 0 && activeRegressionIndex > regressionCount - 1) {
      setActiveRegressionIndex(0);
    }
  }, [activeRegressionIndex, regressionCount]);

  const displayRangeLabel = useMemo(
    () => (insights?.range ? insights.range.toUpperCase() : range.toUpperCase()),
    [insights, range]
  );

  const priceChartData = useMemo(() => {
    if (!insights?.data?.length) {
      return null;
    }

    const labelSet = new Set();
    insights.data.forEach(({ series }) => {
      series.forEach((point) => {
        labelSet.add(point.date.slice(0, 10));
      });
    });

    const sortedLabels = Array.from(labelSet).sort();
    const displayLabels = sortedLabels.map((dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    });

    const datasets = insights.data.map(({ symbol, series }, index) => {
      const mapping = new Map(series.map((point) => [point.date.slice(0, 10), point.close]));
      const palette = SERIES_COLORS[index % SERIES_COLORS.length];

      return {
        label: symbol,
        data: sortedLabels.map((label) => (mapping.has(label) ? Number(mapping.get(label)) : null)),
        borderColor: palette.border,
        backgroundColor: palette.background,
        borderWidth: 2,
        spanGaps: true,
        tension: 0.3,
        fill: true
      };
    });

    return {
      labels: displayLabels,
      datasets
    };
  }, [insights]);

  const metricSummaries = useMemo(() => {
    if (!insights?.data?.length) return [];
    return insights.data.map(({ symbol, metrics, meta }) => ({ symbol, metrics, meta }));
  }, [insights]);

  const correlationTable = useMemo(() => {
    const symbols = insights?.analytics?.symbols;
    const matrix = insights?.analytics?.returnsCorrelationMatrix;
    if (!symbols || !matrix) {
      return null;
    }
    return symbols.map((symbol, index) => ({
      symbol,
      values: matrix[index] || []
    }));
  }, [insights]);

  const rollingChartData = useMemo(() => {
    const rolling = insights?.analytics?.rollingCorrelations;
    if (!rolling?.length) {
      return null;
    }

    const labelSet = new Set();
    rolling.forEach(({ series }) => {
      series.forEach((point) => labelSet.add(point.date));
    });

    const sortedLabels = Array.from(labelSet).sort();
    const displayLabels = sortedLabels.map((dateStr) =>
      new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    );

    const datasets = rolling.map((entry, index) => {
      const palette = SERIES_COLORS[index % SERIES_COLORS.length];
      const mapping = new Map(entry.series.map((point) => [point.date, point.value]));
      return {
        label: `${entry.pair[0]} vs ${entry.pair[1]}`,
        data: sortedLabels.map((label) => (mapping.has(label) ? Number(mapping.get(label)) : null)),
        borderColor: palette.border,
        backgroundColor: palette.background,
        borderWidth: 2,
        spanGaps: true,
        tension: 0.2,
        fill: false
      };
    });

    return {
      labels: displayLabels,
      datasets
    };
  }, [insights]);

  const regressionAnalytics = insights?.analytics?.regressionAnalytics || [];

  const currentRegression = useMemo(() => {
    if (!regressionAnalytics.length) {
      return null;
    }
    const safeIndex = Math.min(activeRegressionIndex, regressionAnalytics.length - 1);
    return regressionAnalytics[safeIndex];
  }, [regressionAnalytics, activeRegressionIndex]);

  const regressionChartData = useMemo(() => {
    if (!currentRegression) {
      return null;
    }

    const scatterPoints = currentRegression.scatter.map(({ x, y }) => ({ x, y }));
    const regressionLine = currentRegression.regressionLine || [];

    return {
      datasets: [
        {
          label: `${currentRegression.pair[0]} vs ${currentRegression.pair[1]} returns`,
          data: scatterPoints,
          backgroundColor: 'rgba(59, 130, 246, 0.65)',
          borderColor: 'rgba(59, 130, 246, 0.65)',
          pointRadius: 3,
          pointHoverRadius: 4,
          showLine: false,
          parsing: false
        },
        {
          type: 'line',
          label: 'Regression fit',
          data: regressionLine,
          borderColor: 'rgba(249, 115, 22, 0.9)',
          backgroundColor: 'rgba(249, 115, 22, 0.15)',
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          parsing: false
        }
      ]
    };
  }, [currentRegression]);

  const regressionChartOptions = useMemo(() => {
    if (!currentRegression) {
      return null;
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#E2E8F0'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          titleColor: '#E2E8F0',
          bodyColor: '#CBD5F5',
          callbacks: {
            label: (context) => {
              const { parsed } = context;
              return `x ${formatNumber(parsed.x, 4)} / y ${formatNumber(parsed.y, 4)}`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          grid: {
            color: 'rgba(148, 163, 184, 0.12)',
            drawBorder: false
          },
          ticks: {
            color: '#A5B4FC'
          },
          title: {
            display: true,
            text: `${currentRegression.pair[0]} log returns`,
            color: '#94A3B8'
          }
        },
        y: {
          type: 'linear',
          grid: {
            color: 'rgba(148, 163, 184, 0.12)',
            drawBorder: false
          },
          ticks: {
            color: '#A5B4FC'
          },
          title: {
            display: true,
            text: `${currentRegression.pair[1]} log returns`,
            color: '#94A3B8'
          }
        }
      }
    };
  }, [currentRegression]);

  const regressionLineSpan = currentRegression?.regressionLine?.length >= 2
    ? currentRegression.regressionLine[1].x - currentRegression.regressionLine[0].x
    : null;

  const loadingState = (
    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 animate-pulse">
      <div className="h-6 bg-indigo-500/20 rounded w-48 mb-4" />
      <div className="h-64 bg-indigo-500/10 rounded-xl" />
    </div>
  );

  return (
    <div className="px-[5vw] py-10 bg-black text-indigo-50 min-h-full">
      <div className="max-w-6xl space-y-6">
        <section className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-indigo-100">Blockchain Market Intelligence</h3>
              <p className="text-sm text-indigo-200/80">
                Pull live blockchain asset pricing, volatility, and distribution stats from CoinGecko to analyze market trends.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-indigo-200/70">
                Blockchain Assets
                <div className="relative">
                  <input
                    type="text"
                    value={symbolsInput}
                    onChange={(event) => setSymbolsInput(event.target.value)}
                    placeholder="SOL, BTC, ETH"
                    className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-2 text-sm text-indigo-100 placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/40 w-full"
                    disabled={loading}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-indigo-300/70">
                    {symbolsInput.split(',').filter(s => s.trim()).length} selected
                  </span>
                </div>
                <p className="text-[10px] text-indigo-300/60 mt-1">
                  💡 Tip: CoinGecko free tier limits requests. Use 1-2 symbols for faster results.
                </p>
              </label>

              <label className="flex flex-col gap-1 text-xs uppercase tracking-widest text-indigo-200/70">
                Range
                <div className="flex gap-2">
                  {RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRange(option.value)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${
                        range === option.value
                          ? 'bg-indigo-500/30 border-indigo-500/40 text-indigo-100'
                          : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200/70 hover:text-indigo-100 hover:border-indigo-500/30'
                      }`}
                      disabled={loading}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </label>

              <button
                type="button"
                onClick={fetchMarketIntel}
                className="bg-indigo-500/30 border border-indigo-500/40 hover:bg-indigo-500/40 hover:border-indigo-500/60 text-indigo-100 px-6 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Fetching…' : 'Refresh'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-rose-500/10 border border-rose-500/40 text-rose-200 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {!!partialErrors.length && !error && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm rounded-xl px-4 py-3">
              {partialErrors.map((item) => (
                <div key={item.symbol}>
                  {item.symbol}: {item.message}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          {loading && loadingState}

          {!loading && priceChartData && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-indigo-100">Price trajectory</h4>
                <span className="text-xs uppercase tracking-widest text-indigo-300">
                  {displayRangeLabel} • Interval {interval.toUpperCase()}
                </span>
              </div>
              <div className="h-80">
                <Line data={priceChartData} options={chartOptions} />
              </div>
            </div>
          )}
        </section>

        {!loading && metricSummaries.length > 0 && (
          <section className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur">
            <h4 className="text-lg font-semibold text-indigo-100 mb-4">Distribution stats</h4>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {metricSummaries.map(({ symbol, metrics, meta }) => (
                <article
                  key={symbol}
                  className="border border-indigo-500/20 bg-indigo-500/10 rounded-2xl p-4 flex flex-col gap-3"
                >
                  <header className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-indigo-100">{symbol}</span>
                    <span className="text-xs uppercase tracking-widest text-indigo-300/70">
                      {meta?.currency || 'USD'}
                    </span>
                  </header>

                  <div className="text-2xl font-semibold text-indigo-200">
                    {formatCurrency(metrics.lastClose, meta?.currency || 'USD')}
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-xs text-indigo-200/80">
                    <div>
                      <dt className="uppercase tracking-widest">Return Δ</dt>
                      <dd className={`${metrics.priceChangePercent >= 0 ? 'text-indigo-200' : 'text-indigo-300/70'} font-medium`}>
                        {formatPercent(metrics.priceChangePercent)}
                      </dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-widest">Hist Vol</dt>
                      <dd>{formatPercent(metrics.historicalVolatility)}</dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-widest">Mean (ann.)</dt>
                      <dd>{formatPercent(metrics.meanReturn)}</dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-widest">Std Dev</dt>
                      <dd>{formatPercent(metrics.stdReturn)}</dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-widest">Sharpe</dt>
                      <dd>{formatNumber(metrics.sharpeRatio)}</dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-widest">Skew / Kurt</dt>
                      <dd>{`${formatNumber(metrics.skewness)} / ${formatNumber(metrics.kurtosis)}`}</dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-widest">Samples</dt>
                      <dd>{metrics.sampleSize || '—'}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </section>
        )}

        {!loading && insights?.data?.length > 0 && (
          <GeminiMarketSummary insights={insights} />
        )}

        {correlationTable && (
          <section className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h4 className="text-lg font-semibold text-indigo-100">Correlation surfaces</h4>
                <p className="text-sm text-indigo-200/80">
                  Rolling and aggregate correlations help you spot co-movement and hedging potential in minutes.
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-separate" style={{ borderSpacing: '0 6px' }}>
                  <thead>
                    <tr>
                      <th className="text-left text-xs uppercase tracking-widest text-indigo-200/70 px-2">Asset</th>
                      {correlationTable.map(({ symbol }) => (
                        <th key={symbol} className="text-xs uppercase tracking-widest text-indigo-200/70 px-2 text-center">
                          {symbol}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {correlationTable.map((row) => (
                      <tr key={row.symbol}>
                        <td className="px-2 py-2 font-medium text-indigo-100 whitespace-nowrap">{row.symbol}</td>
                        {row.values.map((value, idx) => (
                          <td
                            key={`${row.symbol}-${idx}`}
                            className="px-2 py-2 text-center font-medium rounded-lg"
                            style={{
                              backgroundColor: correlationBackground(value),
                              color: correlationText(value)
                            }}
                          >
                            {Number.isFinite(value) ? value.toFixed(2) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rollingChartData ? (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                  <h5 className="text-sm font-semibold text-slate-100 mb-2">30-day rolling correlation</h5>
                  <div className="h-64">
                    <Line data={rollingChartData} options={chartOptions} />
                  </div>
                </div>
              ) : (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-sm text-indigo-300/70 flex items-center justify-center">
                  Add a second ticker to unlock rolling correlation trends.
                </div>
              )}
            </div>
          </section>
        )}

        {currentRegression && regressionChartData && regressionChartOptions && (
          <section className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 backdrop-blur space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h4 className="text-lg font-semibold text-indigo-100">Regression & beta mapping</h4>
                <p className="text-sm text-indigo-200/80">
                  Linear regression on log returns surfaces betas, alpha drift, and co-movement confidence.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs uppercase tracking-widest text-indigo-200/70">
                  Pair
                  <select
                    value={Math.min(activeRegressionIndex, regressionAnalytics.length - 1)}
                    onChange={(event) => setActiveRegressionIndex(Number(event.target.value))}
                    className="ml-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2 text-sm text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/40"
                  >
                    {regressionAnalytics.map((entry, index) => (
                      <option key={entry.pair.join('-')} value={index}>
                        {entry.pair[0]} ↔ {entry.pair[1]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
              <div className="h-80 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
                <Scatter data={regressionChartData} options={regressionChartOptions} />
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 space-y-4 text-sm text-indigo-200">
                <div>
                  <p className="text-xs uppercase tracking-widest text-indigo-300/70">β / α</p>
                  <p className="text-lg font-semibold text-indigo-200">
                    {formatNumber(currentRegression.beta)} / {formatNumber(currentRegression.alpha)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-indigo-300/70">R²</p>
                    <p className="text-base font-semibold text-indigo-100">{formatNumber(currentRegression.rSquared)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-indigo-300/70">Correlation</p>
                    <p className="text-base font-semibold text-indigo-100">{formatNumber(currentRegression.correlation)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-indigo-300/70">Samples</p>
                    <p className="text-base font-semibold text-indigo-100">{currentRegression.sampleSize}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-indigo-300/70">Line coverage</p>
                    <p className="text-base font-semibold text-indigo-100">
                      {formatNumber(regressionLineSpan, 4)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">All pairs</p>
                  <ul className="space-y-1 text-xs text-slate-400">
                    {regressionAnalytics.map((entry) => (
                      <li key={`summary-${entry.pair.join('-')}`}>
                        <span className="text-slate-300 font-medium">{entry.pair[0]} ↔ {entry.pair[1]}</span>
                        {` · β ${formatNumber(entry.beta)} · R² ${formatNumber(entry.rSquared)}`}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default MarketIntel;
