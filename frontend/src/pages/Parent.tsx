import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AIInsightCard from '../components/AIInsightCard';
import { ErrorState, Spinner } from '../components/ScoreCard';
import { OUTCOMES } from '../config/theme';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { ChildDetail, CoachResponse } from '../types';
import { ageOfProfile } from '../utils/age';

export default function Parent() {
  const { child, children, selectChild, refreshChildren } = useApp();
  const [detail, setDetail] = useState<ChildDetail | null>(null);
  const [summary, setSummary] = useState<{ weeklyActivityMin: number; challengesCompleted: number; personalRecords: number } | null>(null);
  const [coach, setCoach] = useState<CoachResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { void refreshChildren(); }, []);

  useEffect(() => {
    if (!child) return;
    let alive = true;
    setDetail(null); setSummary(null); setCoach(null);
    Promise.all([
      api.get<ChildDetail>(`/children/${child.id}`),
      api.get<any>(`/children/${child.id}/progress`),
      api.post<CoachResponse>('/ai/coach', { childId: child.id }),
    ])
      .then(([d, p, c]) => {
        if (!alive) return;
        setDetail(d);
        setSummary({ weeklyActivityMin: p.weeklyActivityMin, challengesCompleted: p.challengesCompleted, personalRecords: p.personalRecords });
        setCoach(c);
      })
      .catch((e) => { if (alive) setErr(e.message); });
    return () => { alive = false; };
  }, [child]);

  if (err) return <ErrorState message={err} onRetry={() => window.location.reload()} />;
  if (!child) return <Spinner label="Loading your children…" />;

  const insight = coach && detail
    ? `${child.name} is showing the strongest improvement in ${coach.strongestArea.toUpperCase()}. ` +
      `Activity in ${coach.weakestArea.toUpperCase()} has room to grow — the coach recommends ${coach.nextChallenge.replace('-', ' ')} twice this week.`
    : 'Loading insight…';

  const switchTo = async (id: string) => {
    try { await selectChild(id); } catch (e: any) { setErr(e?.message); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Good evening 👋</h1>
        <p className="mt-1 font-semibold text-slate-500">A clear, non-medical view of your children's activity.</p>
      </div>

      {/* Children selector */}
      <section aria-label="Your children">
        <h2 className="mb-2 font-display text-xl font-extrabold">YOUR CHILDREN</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {children.map((c) => {
            const active = c.id === child.id;
            return (
              <button
                key={c.id} onClick={() => void switchTo(c.id)} aria-pressed={active}
                className={`kivo-card flex items-center gap-3 border-2 text-left transition-all ${active ? 'border-kivo-500 shadow-pop' : 'border-transparent hover:border-slate-200'}`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl font-display text-xl font-extrabold text-white"
                  style={{ background: c.avatarColor }} aria-hidden="true">
                  {c.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-extrabold uppercase">{c.name}</span>
                  <span className="block text-xs font-semibold text-slate-500">Age {ageOfProfile(c)} · {c.fitnessLevel}</span>
                </span>
                {active && <span className="rounded-full bg-kivo-100 px-3 py-1 text-xs font-extrabold text-kivo-700">Viewing</span>}
              </button>
            );
          })}
        </div>
        <Link to="/children" className="mt-2 inline-block text-sm font-bold text-kivo-600 hover:underline">Manage children →</Link>
      </section>

      {detail && summary ? (
        <>
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
              <h2 className="font-display text-xl font-extrabold uppercase">{child.name} · Age {ageOfProfile(child)}</h2>
              <p className="text-sm font-bold text-slate-500">🔥 {detail.streak.currentDays}-day streak</p>
            </div>
            <div className="mt-4 space-y-3">
              {OUTCOMES.map((o, i) => {
                const v = detail.progress[o.key] ?? 0;
                const ch = detail.changes[o.key] ?? 0;
                return (
                  <div key={o.key}>
                    <div className="flex justify-between text-sm font-bold">
                      <span style={{ color: o.color }}>{o.label}</span>
                      <span className="tabular-nums">{v}/100
                        {ch !== 0 && <span className={`ml-2 text-xs font-extrabold ${ch > 0 ? 'text-green-600' : 'text-red-500'}`}>{ch > 0 ? `↑ +${ch}` : `↓ ${ch}`}</span>}
                      </span>
                    </div>
                    <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100">
                      <motion.div className="h-full rounded-full" style={{ background: o.color }}
                        initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.7, delay: i * 0.1 }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to="/progress" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-kivo-600 hover:underline">
              View progress <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <section aria-label="This week's insight">
            <h2 className="mb-2 font-display text-xl font-extrabold">AI PARENT INSIGHT</h2>
            {coach ? <AIInsightCard text={insight} /> : <Spinner label="Loading insight…" />}
          </section>
        </>
      ) : (
        <Spinner label="Loading child data…" />
      )}

      <p className="text-xs text-slate-400">
        KIVO shows activity and practice trends only. It never diagnoses conditions or gives medical advice.
      </p>
    </div>
  );
}
