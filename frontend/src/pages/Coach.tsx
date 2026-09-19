import { motion } from 'framer-motion';
import { ArrowRight, Dumbbell, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AIInsightCard from '../components/AIInsightCard';
import { ErrorState, Spinner } from '../components/ScoreCard';
import { outcomeMeta } from '../config/theme';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { CoachResponse, WorkoutBlock } from '../types';

export default function Coach() {
  const { child, lastResult, isAdult } = useApp();
  const [coach, setCoach] = useState<CoachResponse | null>(null);
  const [plan, setPlan] = useState<WorkoutBlock[] | null>(null);
  const [planSource, setPlanSource] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    if (!child) return;
    api.post<CoachResponse>('/ai/coach', {
      childId: child.id,
      lastResult: lastResult ? {
        challengeId: lastResult.attempt.challengeId,
        score: lastResult.score,
        improvement: lastResult.improvement,
        isPersonalBest: lastResult.isPersonalBest,
      } : undefined,
    })
      .then((r) => { setCoach(r); setPlan(r.workout); setPlanSource(r.source); })
      .catch((e) => setErr(e.message));
  }, [child]);

  const regen = async () => {
    if (!child) return;
    setLoadingPlan(true);
    try {
      const r = await api.post<{ workout: WorkoutBlock[]; source: string }>('/ai/workout', { childId: child.id, minutes: 10 });
      setPlan(r.workout); setPlanSource(r.source);
    } catch (e: any) { setErr(e?.message); }
    finally { setLoadingPlan(false); }
  };

  if (err && !coach) return <div className="space-y-4"><ErrorState message={err} onRetry={() => window.location.reload()} /></div>;
  if (!coach || !child) return <Spinner label="KIVO Coach is thinking…" />;

  const strong = outcomeMeta(coach.strongestArea);
  const weak = outcomeMeta(coach.weakestArea);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-3xl font-extrabold">{isAdult ? 'AI Coach 📊' : 'AI Coach 🤖'}</h1>
        <p className="mt-1 font-semibold text-slate-500">
          {isAdult ? `Performance coaching for ${child.name}` : `Personalized for ${child.name}`} · {coach.source === 'llm' ? 'live AI' : 'KIVO built-in brain'}
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="kivo-card border-2 border-kivo-100 bg-gradient-to-br from-kivo-50 to-white">
        <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-widest text-kivo-700">
          <Sparkles size={16} aria-hidden="true" /> Encouragement
        </p>
        <p className="mt-2 text-lg font-medium leading-relaxed">{coach.encouragement}</p>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="kivo-card">
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Strongest area</p>
          <p className="mt-1 font-display text-2xl font-extrabold" style={{ color: strong.color }}>{strong.label} 💪</p>
        </div>
        <div className="kivo-card">
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Focus area</p>
          <p className="mt-1 font-display text-2xl font-extrabold" style={{ color: weak.color }}>{weak.label} 🎯</p>
        </div>
      </div>

      <AIInsightCard text={coach.recommendation} />

      <div className="kivo-card border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
        <p className="font-display text-sm font-extrabold uppercase tracking-widest text-amber-700">Why this plan?</p>
        <p className="mt-2 text-[15px] font-medium leading-relaxed text-slate-700">{coach.reason}</p>
      </div>

      <div className="kivo-card">
        <p className="font-display text-sm font-extrabold uppercase tracking-widest text-slate-500">Next challenge · {coach.difficulty}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="font-display text-2xl font-extrabold capitalize">{coach.nextChallenge.replace('-', ' ')}</p>
          <Link to={`/challenge/${coach.nextChallenge}`} className="kivo-btn-primary !min-h-[48px] shrink-0">
            Start <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <section aria-label="Today's plan">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold">
            <Dumbbell size={20} aria-hidden="true" /> {isAdult ? "Today's training" : "Today's 10-minute plan"}
          </h2>
          <button onClick={regen} disabled={loadingPlan} className="text-sm font-bold text-kivo-600 hover:underline disabled:opacity-50">
            {loadingPlan ? 'Planning…' : 'Regenerate'}
          </button>
        </div>
        <ol className="space-y-2.5">
          {(plan || []).map((b, i) => (
            <motion.li key={`${b.label}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              className="kivo-card flex items-center gap-4 !p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-kivo-600 font-display font-extrabold text-white">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-extrabold">{b.label} <span className="ml-1 text-sm font-bold text-slate-400">· {b.minutes} min</span></p>
                <p className="truncate text-sm text-slate-600">{b.detail}</p>
              </div>
            </motion.li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-slate-400">Plan adapts to recent performance{planSource ? ` · source: ${planSource}` : ''}. Activity coaching only — never medical advice.</p>
      </section>
    </div>
  );
}
