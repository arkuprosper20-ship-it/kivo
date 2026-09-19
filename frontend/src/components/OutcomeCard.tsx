import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { outcomeMeta } from '../config/theme';
import type { OutcomeKey } from '../types';

export default function OutcomeCard({ k, score, trend }: { k: OutcomeKey; score: number; trend?: number }) {
  const m = outcomeMeta(k);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="kivo-card relative overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: m.color }} aria-hidden="true" />
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-sm font-extrabold tracking-widest" style={{ color: m.color }}>{m.label}</p>
          <p className="mt-0.5 text-xs text-slate-500">{m.tagline}</p>
        </div>
        {typeof trend === 'number' && trend !== 0 && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
            {trend > 0 ? `▲ +${trend}` : `▼ ${trend}`}
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-5xl font-extrabold tabular-nums">
        {score}<span className="text-xl text-slate-400">/100</span>
      </p>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={`${m.label} score`}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${m.color}88, ${m.color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </div>
      <Link to="/progress" className="mt-3 inline-block text-sm font-bold text-kivo-600 hover:underline">
        View progress →
      </Link>
    </motion.div>
  );
}
