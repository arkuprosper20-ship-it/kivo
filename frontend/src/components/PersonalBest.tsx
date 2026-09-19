import type { PersonalBest } from '../types';

export default function PersonalBest({ pb }: { pb: PersonalBest }) {
  return (
    <div className="kivo-card border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
      <p className="font-display text-sm font-extrabold uppercase tracking-widest text-amber-600">🏆 Personal Best</p>
      <p className="mt-1 text-sm font-bold text-slate-600">{pb.challengeName} · {pb.metricLabel}</p>
      <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">{pb.metricValue}</p>
      {pb.previousMetricValue && (
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Previous: {pb.previousMetricValue}
          {typeof pb.improvement === 'number' && pb.improvement > 0 && (
            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">+{pb.improvement}%</span>
          )}
        </p>
      )}
    </div>
  );
}
