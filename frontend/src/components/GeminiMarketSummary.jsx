import React, { useMemo } from 'react';

const GeminiMarketSummary = ({ insights }) => {
  const summary = useMemo(() => {
    if (!insights?.data?.length) {
      return null;
    }

    const ranked = [...insights.data].sort((a, b) => {
      const sharpeA = a.metrics?.sharpeRatio ?? -Infinity;
      const sharpeB = b.metrics?.sharpeRatio ?? -Infinity;
      return sharpeB - sharpeA;
    });

    const best = ranked[0];
    if (!best) {
      return null;
    }

    const metrics = best.metrics || {};
    const volatility = metrics.historicalVolatility ?? 0;
    const meanReturn = metrics.meanReturn ?? 0;
    const sharpe = metrics.sharpeRatio ?? 0;

    let horizon;
    if (volatility > 45) {
      horizon = 'short-term (3-6 months) while momentum persists';
    } else if (volatility > 25) {
      horizon = 'medium-term (6-12 months) to capture trend while monitoring drawdowns';
    } else {
      horizon = 'long-term (12+ months) with low-volatility compounding potential';
    }

    const aggregateCorrelation = (() => {
      const matrix = insights.analytics?.returnsCorrelationMatrix;
      if (!matrix?.length) return null;
      const values = [];
      for (let i = 0; i < matrix.length; i += 1) {
        for (let j = i + 1; j < matrix.length; j += 1) {
          const value = matrix[i][j];
          if (typeof value === 'number') {
            values.push(value);
          }
        }
      }
      if (!values.length) return null;
      const avg = values.reduce((acc, val) => acc + val, 0) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      return { avg, max, min };
    })();

    const bulletPoints = [];
    bulletPoints.push(
      `Sharpe leaderboard favours ${best.symbol} (Sharpe ${sharpe.toFixed(2)}, annualised mean ${meanReturn.toFixed(1)}%, vol ${volatility.toFixed(1)}%).`
    );

    const runnerUp = ranked[1];
    if (runnerUp) {
      bulletPoints.push(
        `${runnerUp.symbol} trails with Sharpe ${(runnerUp.metrics?.sharpeRatio ?? 0).toFixed(2)}; consider pairing it only if you want diversified sector exposure.`
      );
    }

    if (aggregateCorrelation) {
      bulletPoints.push(
        `Cross-ticker correlations average ${aggregateCorrelation.avg.toFixed(2)} (range ${aggregateCorrelation.min.toFixed(2)} to ${aggregateCorrelation.max.toFixed(2)}); use the low end for diversification and hedge the highly coupled pairs.`
      );
    }

    const regression = insights.analytics?.regressionAnalytics || [];
    const strongPair = regression.find((entry) => (entry.rSquared ?? 0) > 0.4);
    if (strongPair) {
      bulletPoints.push(
        `${strongPair.pair.join(' ↔ ')} show r² ${(strongPair.rSquared ?? 0).toFixed(2)} (β ${strongPair.beta.toFixed(2)}); rotate between them when spreads widen beyond the recent regression band.`
      );
    }

    const action = `Decision: allocate marginal capital to ${best.symbol} with a ${horizon}, keeping cash on hand to rebalance if vol spikes > ${volatility.toFixed(0)}%.`;
    bulletPoints.push(action);

    return {
      bulletPoints,
      note: 'Local analytics generated offline while Gemini connectivity is restored.'
    };
  }, [insights]);

  const statusLabel = 'Offline • Local analysis';
  const statusTone = 'bg-indigo-500/15 text-indigo-200 border border-indigo-400/40';

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-indigo-200">Gemini analysis</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-100">Ticker decision support</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusTone}`}>{statusLabel}</span>
      </div>

      <div className="mt-4 min-h-[140px] space-y-3 text-sm text-slate-200">
        {summary ? (
          <ul className="space-y-2">
            {summary.bulletPoints.map((line, index) => (
              <li key={`${index}-${line.slice(0, 12)}`} className="flex gap-2">
                <span className="text-indigo-300">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">Add at least one valid ticker to unlock analytics.</p>
        )}
      </div>

      {summary?.note && (
        <p className="mt-3 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-3 py-2">
          {summary.note}
        </p>
      )}

      <span className="mt-4 block text-[11px] uppercase tracking-widest text-slate-500">
        Covers range {insights?.range?.toUpperCase() || '—'} • Interval {insights?.interval?.toUpperCase() || '—'}
      </span>
    </section>
  );
};

export default GeminiMarketSummary;
