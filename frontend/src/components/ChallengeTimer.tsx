export default function ChallengeTimer({ seconds, total }: { seconds: number; total: number }) {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  const pct = total > 0 ? (Math.max(0, seconds) / total) * 100 : 0;
  const urgent = seconds <= 10;
  return (
    <div aria-label={`Time remaining ${m}:${String(s).padStart(2, '0')}`}>
      <p className={`text-center font-display text-5xl font-extrabold tabular-nums ${urgent ? 'text-red-500' : ''}`}>
        {m}:{String(s).padStart(2, '0')}
      </p>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full transition-all ${urgent ? 'bg-red-500' : 'bg-kivo-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
