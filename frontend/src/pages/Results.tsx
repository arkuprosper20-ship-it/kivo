import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Celebrate from '../components/Celebrate';
import { ScoreCard } from '../components/ScoreCard';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { Attempt } from '../types';

function useCountUp(target: number, ms = 1100): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function metricRows(r: { challengeId: string; raw: Record<string, number> }): Array<[string, string]> {
  if (r.challengeId === 'rope-rush')
    return [['Jumps', `${r.raw.jumps} jumps`], ['Time', `${r.raw.durationSec}s`], ['Consistency', `${r.raw.consistency ?? '—'}%`]];
  if (r.challengeId === 'reaction-rush')
    return [['Reaction', `${((r.raw.avgMs || 0) / 1000).toFixed(2)} sec`], ['Accuracy', `${r.raw.accuracy}%`], ['Hits', `${r.raw.hits}/${r.raw.rounds || 10}`]];
  return [['Completion time', `${r.raw.seconds} sec`], ['Accuracy', `${r.raw.accuracy}%`], ['Errors', `${r.raw.errors}`]];
}

const NEXT: Record<string, string> = {
  'rope-rush': 'reaction-rush',
  'reaction-rush': 'agility-command',
  'agility-command': 'rope-rush',
};

export default function Results() {
  const { lastResult, child, refresh, setLastResult } = useApp();
  const nav = useNavigate();
  const [prev, setPrev] = useState<Attempt | null>(null);
  const [showParty, setShowParty] = useState(true);
  const score = useCountUp(lastResult?.score ?? 0);

  useEffect(() => {
    if (!lastResult) { nav('/challenges'); return; }
    void refresh();
    if (child) {
      api.get<{ attempts: Attempt[] }>(`/children/${child.id}/history`)
        .then((h) => {
          const older = h.attempts.filter((a) => a.challengeId === lastResult.attempt.challengeId && a.id !== lastResult.attempt.id);
          setPrev(older[0] || null);
        })
        .catch(() => { /* optional */ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!lastResult) return null;
  const r = lastResult;
  const rows = metricRows({ challengeId: r.attempt.challengeId, raw: r.attempt.raw as Record<string, number> });
  const prevRows = prev ? metricRows({ challengeId: prev.challengeId, raw: prev.raw as Record<string, number> }) : null;
  const party = (r.leveledUp || r.badgesUnlocked.length > 0) && showParty;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {party && (
        <Celebrate levelUp={r.leveledUp} newLevel={r.level} badges={r.badgesUnlocked} onDone={() => setShowParty(false)} />
      )}

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="kivo-card text-center">
        <p className="text-5xl" aria-hidden="true">🎉</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold">CHALLENGE COMPLETE!</h1>
        <p className="mt-4 text-xs font-extrabold uppercase tracking-widest text-slate-500">Score</p>
        <p className="font-display text-7xl font-extrabold tabular-nums text-kivo-600" aria-live="polite">
          {score}<span className="text-2xl text-slate-400">/100</span>
        </p>
        <div className="mx-auto mt-3 h-3 max-w-xs overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={r.score} aria-valuemin={0} aria-valuemax={100}>
          <motion.div className="h-full rounded-full bg-gradient-to-r from-kivo-400 to-kivo-700"
            initial={{ width: 0 }} animate={{ width: `${r.score}%` }} transition={{ duration: 1.1, ease: 'easeOut' }} />
        </div>
        {r.improvement > 0 && (
          <p className="mx-auto mt-3 inline-block rounded-full bg-green-100 px-4 py-1.5 text-sm font-extrabold text-green-700">
            ▲ +{r.improvement}% vs your last try
          </p>
        )}
      </motion.div>

      {r.isPersonalBest && (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }}
          className="kivo-card border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white text-center">
          <p className="font-display text-2xl font-extrabold text-amber-600">🏆 NEW PERSONAL BEST!</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">You beat your own record. That’s what champions do.</p>
        </motion.div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {rows.map(([k, v], i) => (
          <ScoreCard key={k} label={k} value={v} sub={prevRows ? `Prev: ${prevRows[i]?.[1] ?? '—'}` : undefined} />
        ))}
      </div>

      <div className="kivo-card flex items-center justify-between">
        <div>
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-slate-500">XP earned</p>
          <p className="font-display text-3xl font-extrabold text-amber-500">+{r.xpEarned} XP</p>
        </div>
        <div className="text-right">
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-slate-500">Level</p>
          <p className="font-display text-3xl font-extrabold">Lv.{r.level}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-slate-500">Streak</p>
          <p className="font-display text-3xl font-extrabold">🔥{r.streak.currentDays}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to={`/challenge/${NEXT[r.attempt.challengeId] || 'reaction-rush'}`} className="kivo-btn-primary flex-1"
          onClick={() => setLastResult(null)}>
          NEXT CHALLENGE <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <Link to="/coach" className="kivo-btn-ghost flex-1">
          <Sparkles size={18} aria-hidden="true" /> ASK KIVO COACH
        </Link>
      </div>
    </div>
  );
}
