import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import AIInsightCard from '../components/AIInsightCard';
import { ErrorState, Spinner } from '../components/ScoreCard';
import { OUTCOMES } from '../config/theme';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { Attempt, ChildDetail, CoachResponse, OutcomeKey } from '../types';

/** Parent insights: per-child improvements + AI guidance. */
export default function Insights() {
  const { child, children, selectChild } = useApp();
  const [detail, setDetail] = useState<ChildDetail | null>(null);
  const [coach, setCoach] = useState<CoachResponse | null>(null);
  const [history, setHistory] = useState<Attempt[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!child) return;
    let alive = true;
    setDetail(null); setCoach(null);
    Promise.all([
      api.get<ChildDetail>(`/children/${child.id}`),
      api.post<CoachResponse>('/ai/coach', { childId: child.id }),
      api.get<{ attempts: Attempt[] }>(`/children/${child.id}/history`),
    ])
      .then(([d, c, h]) => { if (alive) { setDetail(d); setCoach(c); setHistory(h.attempts); } })
      .catch((e) => { if (alive) setErr(e.message); });
    return () => { alive = false; };
  }, [child]);

  if (err) return <ErrorState message={err} onRetry={() => window.location.reload()} />;
  if (!child) return <Spinner label="Loading…" />;

  const keys: OutcomeKey[] = ['stronger', 'fitter', 'faster', 'champs'];
  const best = detail ? keys.reduce((a, b) => (detail.changes[a] >= detail.changes[b] ? a : b)) : 'faster';
  const focus = detail ? keys.reduce((a, b) => (detail.progress[a] <= detail.progress[b] ? a : b)) : 'fitter';

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Insights 💡</h1>
        <p className="mt-1 font-semibold text-slate-500">Supportive, non-medical guidance for {child.name}.</p>
      </div>

      {children.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Select child">
          {children.map((c) => (
            <button key={c.id} onClick={() => void selectChild(c.id)} aria-pressed={c.id === child.id}
              className={`rounded-full px-4 py-2 text-sm font-bold ${c.id === child.id ? 'bg-kivo-600 text-white' : 'bg-white text-slate-600 shadow-card'}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {!detail || !coach ? <Spinner label="Analyzing progress…" /> : (
        <>
          <section className="kivo-card" aria-label="Improvements">
            <h2 className="font-display text-xl font-extrabold">{child.name} improved</h2>
            <div className="mt-3 space-y-3">
              {keys.map((k, i) => {
                const o = OUTCOMES.find((x) => x.key === k)!;
                const ch = detail.changes[k];
                const pct = detail.baseline[k] > 0 ? Math.round((ch / detail.baseline[k]) * 100) : 0;
                return (
                  <div key={k}>
                    <div className="flex justify-between text-sm font-bold">
                      <span style={{ color: o.color }}>{o.label}</span>
                      <span className={ch >= 0 ? 'text-green-600' : 'text-red-500'}>{ch >= 0 ? `+${pct}%` : `${pct}%`}</span>
                    </div>
                    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <motion.div className="h-full rounded-full" style={{ background: o.color }}
                        initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(4, Math.abs(pct) * 3))}%` }}
                        transition={{ duration: 0.6, delay: i * 0.08 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="kivo-card border-2 border-green-200">
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Biggest improvement</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-green-600 uppercase">{best} +{Math.round((detail.changes[best] / Math.max(1, detail.baseline[best])) * 100)}%</p>
            </div>
            <div className="kivo-card border-2 border-amber-200">
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Next focus</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-amber-600 uppercase">{focus}</p>
            </div>
          </div>

          <AIInsightCard text={
            `Your child is showing strong progress in ${best.toUpperCase()}. ` +
            `Continue with short, enjoyable ${best === 'faster' ? 'agility' : best} activities while gradually developing ${focus} — ` +
            `the area with the most room for improvement. ${history.length} sessions fuel this insight.`
          } />

          <p className="text-xs text-slate-400">Weekly activity ~{history.slice(-7).length * 8} min · {detail.streak.currentDays}-day streak · KIVO Score {detail.kivoScore}/100</p>
        </>
      )}
    </div>
  );
}
