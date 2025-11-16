import React, { useMemo } from 'react';

const GeminiSummaryCard = ({ overview }) => {
  const derivedSummary = useMemo(() => {
    if (!overview) {
      return [];
    }

    const { balances, growth, runwayReserveUsd, incomeStreams = [] } = overview;
    const totalUsd = balances?.totalUsd ?? 0;
    const cryptoUsd = balances?.crypto?.usdValue ?? 0;
    const stableUsd = balances?.stablecoinsUsd ?? 0;
    const cryptoShare = totalUsd > 0 ? (cryptoUsd / totalUsd) * 100 : 0;
    const runwayMonths = (() => {
      const monthlyYield = incomeStreams.reduce((acc, stream) => acc + (stream.usdPerMonth || 0), 0);
      if (!monthlyYield) {
        return null;
      }
      return (runwayReserveUsd || 0) / monthlyYield;
    })();

    const summary = [
      `Portfolio stands at $${totalUsd.toLocaleString()} with roughly ${cryptoShare.toFixed(1)}% in crypto beta and $${stableUsd.toLocaleString()} parked in stables/liquidity.`,
      `Last allocation change lifted NAV by ${growth?.percentChange ?? 0}% (Δ $${Math.abs(growth?.deltaUsd ?? 0).toLocaleString()}); current runway buffer holds $${(runwayReserveUsd || 0).toLocaleString()}.`
    ];

    if (runwayMonths && Number.isFinite(runwayMonths)) {
      summary.push(`Income streams cover about ${runwayMonths.toFixed(1)} months of runway at present yield; consider scaling deposits if monthly burn increases.`);
    } else if (incomeStreams.length) {
      summary.push('Yield ladders are active; reinvesting weekly accruals will steadily extend operating runway.');
    } else {
      summary.push('No recurring yield captured yet—divert a slice of stables into laddered vaults to build passive runway coverage.');
    }

    summary.push('Call to action: rebalance if crypto share exceeds risk budget; otherwise deploy spare stables into short-duration treasuries to harden runway.');

    return summary;
  }, [overview]);

  const statusLabel = 'Offline • Local insights';
  const statusTone = 'bg-indigo-500/15 text-indigo-200 border border-indigo-400/40';

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6 text-left shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-indigo-200">Gemini overview</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-100">Portfolio briefing</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusTone}`}>{statusLabel}</span>
      </div>

      <div className="mt-4 space-y-3 text-sm text-slate-200">
        {derivedSummary.length ? (
          <ul className="space-y-2">
            {derivedSummary.map((line, index) => (
              <li key={`${index}-${line.slice(0, 12)}`} className="flex gap-2">
                <span className="text-indigo-300">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">Connect your wallet to surface a briefing.</p>
        )}
      </div>

      <span className="mt-4 block text-[11px] uppercase tracking-widest text-slate-500">
        Snapshot as of {overview?.lastUpdated ? new Date(overview.lastUpdated).toLocaleString() : '—'}
      </span>
    </section>
  );
};

export default GeminiSummaryCard;
