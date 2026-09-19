import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import AIInsightCard from '../components/AIInsightCard';
import ChildProfileCard from '../components/ChildProfileCard';
import { ErrorState, Spinner } from '../components/ScoreCard';
import { OUTCOMES } from '../config/theme';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { CoachResponse } from '../types';

export default function Parent() {
  const { child } = useApp();
  const [summary, setSummary] = useState<{
    weeklyActivityMin: number; challengesCompleted: number; personalRecords: number;
  } | null>(null);
  const [detail, setDetail] = useState<{ progress: Record<string, number>; streak: { currentDays: number } } | null>(null);
  const [coach, setCoach] = useState<CoachResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!child) return;
    let alive = true;
    Promise.all([
      api.get<any>(`/children/${child.id}/progress`),
      api.post<CoachResponse>('/ai/coach', { childId: child.id }),
    ])
      .then(([p, c]) => {
        if (!alive) return;
        setSummary({ weeklyActivityMin: p.weeklyActivityMin, challengesCompleted: p.challengesCompleted, personalRecords: p.personalRecords });
        setDetail({ progress: p.scores, streak: p.streak });
        setCoach(c);
      })
      .catch((e) => { if (alive) setErr(e.message); });
    return () => { alive = false; };
  }, [child]);

  if (err) return <ErrorState message={err} onRetry={() => window.location.reload()} />;
  if (!child || !summary || !detail) return <Spinner label="Loading parent dashboard…" />;

  const insight = coach
    ? `${child.name} is showing the strongest improvement in ${coach.strongestArea.toUpperCase()}. ` +
      `Activity in ${coach.weakestArea.toUpperCase()} has room to grow — the coach recommends ${coach.nextChallenge.replace('-', ' ')} twice this week.`
    : 'Loading insight…';

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Parent dashboard 👪</h1>
        <p className="mt-1 font-semibold text-slate-500">A clear, non-medical view of {child.name}'s activity.</p>
      </div>

      <ChildProfileCard child={child} />

      <div className="grid grid-cols-3 gap-3">
        {[
          ['Weekly activity', `${summary.weeklyActivityMin} min`],
          ['Challenges', `${summary.challengesCompleted}`],
          ['Records', `${summary.personalRecords}`],
        ].map(([k, v]) => (
          <div key={k} className="kivo-card !p-4 text-center">
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">{k}</p>
            <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <div className="kivo-card">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-extrabold">Development</h2>
          <p className="text-sm font-bold text-slate-500">🔥 {detail.streak.currentDays}-day streak</p>
        </div>
        <div className="mt-4 space-y-3">
          {OUTCOMES.map((o, i) => {
            const v = detail.progress[o.key] ?? 0;
            return (
              <div key={o.key}>
                <div className="flex justify-between text-sm font-bold">
                  <span style={{ color: o.color }}>{o.label}</span>
                  <span className="tabular-nums">{v}/100</span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100">
                  <motion.div className="h-full rounded-full" style={{ background: o.color }}
                    initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.7, delay: i * 0.1 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <section aria-label="This week's insight">
        <h2 className="mb-2 font-display text-xl font-extrabold">THIS WEEK'S INSIGHT</h2>
        {coach ? <AIInsightCard text={insight} /> : <Spinner label="Loading insight…" />}
      </section>

      <p className="text-xs text-slate-400">
        KIVO shows activity and practice trends only. It never diagnoses conditions or gives medical advice.
      </p>
    </div>
  );
}
