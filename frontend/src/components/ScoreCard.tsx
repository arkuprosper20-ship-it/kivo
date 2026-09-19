import { motion } from 'framer-motion';

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10" role="status" aria-label={label}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-kivo-100 border-t-kivo-600" aria-hidden="true" />
      <p className="text-sm font-semibold text-slate-500">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="kivo-card text-center" role="alert">
      <p className="text-4xl" aria-hidden="true">😞</p>
      <h3 className="mt-2 font-display text-xl font-extrabold">Something went wrong</h3>
      <p className="mt-1 text-sm text-slate-600">{message}</p>
      {onRetry && <button className="kivo-btn-primary mt-4" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="kivo-card text-center">
      <p className="text-4xl" aria-hidden="true">🌱</p>
      <h3 className="mt-2 font-display text-xl font-extrabold">{title}</h3>
      {hint && <p className="mt-1 text-sm text-slate-600">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ScoreCard({ label, value, sub, accent = '#1B4FD6' }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="kivo-card text-center">
      <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 font-display text-4xl font-extrabold tabular-nums" style={{ color: accent }}>{value}</p>
      {sub && <p className="mt-1 text-sm font-semibold text-slate-500">{sub}</p>}
    </motion.div>
  );
}
