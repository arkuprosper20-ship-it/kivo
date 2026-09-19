import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import OutcomeCard from '../components/OutcomeCard';
import PerformanceChart from '../components/PerformanceChart';
import PersonalBest from '../components/PersonalBest';
import { EmptyState, ErrorState, Spinner } from '../components/ScoreCard';
import StreakCard from '../components/StreakCard';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { Attempt, OutcomeKey } from '../types';

const BASELINE: Record<OutcomeKey, number> = { stronger: 62, fitter: 58, faster: 71, champs: 40 };

export default function Progress() {
  const { child, detail } = useApp();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [filter, setFilter] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!child) return;
    api.get<{ attempts: Attempt[] }>(`/children/${child.id}/history${filter ? `?category=${filter}` : ''}`)
      .then((r) => setAttempts(r.attempts))
      .catch((e) => setErr(e.message));
  }, [child, filter]);

  const weekly = useMemo(() => {
    if (!detail) return [];
    const keys: OutcomeKey[] = ['stronger', 'fitter', 'faster', 'champs'];
    return keys.map((k) => {
      const from = child?.id === 'c_aarav' ? BASELINE[k] : 40;
      const to = detail.progress[k];
      const pct = from > 0 ? Math.round(((to - from) / from) * 100) : 0;
      return { key: k, from, to, pct };
    });
  }, [detail, child]);

  if (err) return <ErrorState message={err} onRetry={() => window.location.reload()} />;
  if (!detail || !child) return <Spinner label="Loading progress…" />;

  const keys: OutcomeKey[] = ['stronger', 'fitter', 'faster', 'champs'];
  const activity = attempts.slice(-7).reverse().map((a) => ({
    name: new Date(a.createdAt).toLocaleDateString(undefined, { weekday: 'short' }),
    score: a.score,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Progress 📈</h1>
        <p className="mt-1 font-semibold text-slate-500">Watch yourself getting better — that's the whole game.</p>
      </div>

      <section aria-label="Weekly progress">
        <h2 className="mb-3 font-display text-xl font-extrabold">WEEKLY PROGRESS</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {keys.map((k) => (
            <OutcomeCard key={k} k={k} score={detail.progress[k]} />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {weekly.map((w) => (
            <div key={w.key} className="kivo-card !p-4 text-center">
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">{w.key}</p>
              <p className="mt-1 font-display text-lg font-extrabold tabular-nums">{w.from} → {w.to}</p>
              <p className={`text-sm font-extrabold ${w.pct >= 0 ? 'text-green-600' : 'text-slate-400'}`}>
                {w.pct >= 0 ? `+${w.pct}%` : `${w.pct}%`}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="kivo-card" aria-label="Score trend">
        <h2 className="mb-2 font-display text-xl font-extrabold">Score trend</h2>
        <PerformanceChart attempts={attempts} />
      </section>

      <section className="kivo-card" aria-label="Recent activity">
        <h2 className="mb-2 font-display text-xl font-extrabold">Recent activity</h2>
        <div className="h-52" role="img" aria-label="Recent activity chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activity} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" name="Score" fill="#1B4FD6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <StreakCard days={detail.streak.currentDays} />
        {detail.personalBests[0]
          ? <PersonalBest pb={[...detail.personalBests].sort((a, b) => b.score - a.score)[0]} />
          : <EmptyState title="No personal best yet" hint="Finish a challenge to set one!" />}
      </div>

      <section aria-label="Challenge history">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto font-display text-xl font-extrabold">Challenge history</h2>
          {['', 'STRONGER', 'FITTER', 'FASTER', 'CHAMPS'].map((c) => (
            <button key={c || 'all'} onClick={() => setFilter(c)} aria-pressed={filter === c}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${filter === c ? 'bg-kivo-600 text-white' : 'bg-white text-slate-600 shadow-card'}`}>
              {c || 'All'}
            </button>
          ))}
        </div>
        {attempts.length === 0 && <EmptyState title="No sessions yet" hint="Your completed challenges will appear here." />}
        <ol className="space-y-2">
          {attempts.map((a) => (
            <li key={a.id} className="kivo-card flex items-center gap-3 !p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-mist font-display font-extrabold">{a.score}</span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-extrabold capitalize">{a.challengeId.replace('-', ' ')}</p>
                <p className="truncate text-xs font-semibold text-slate-500">
                  {new Date(a.createdAt).toLocaleString()} · +{a.xpEarned} XP
                  {a.improvement > 0 && <span className="text-green-600"> · +{a.improvement}%</span>}
                </p>
              </div>
              {a.isPersonalBest && <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-700">🏆 PB</span>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
