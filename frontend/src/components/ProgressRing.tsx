export default function ProgressRing({ value, size = 120, color = '#1B4FD6', label }: { value: number; size?: number; color?: string; label?: string }) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="inline-flex flex-col items-center gap-1" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label || 'progress'}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8EDF5" strokeWidth="12" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: 'stroke-dashoffset 0.9s ease-out' }}
        />
      </svg>
      <span className="-mt-[58%] font-display text-2xl font-extrabold tabular-nums" style={{ marginTop: `-${size * 0.62}px` }}>
        {Math.round(pct)}
      </span>
      {label && <span className="mt-8 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>}
    </div>
  );
}
