import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AIInsightCard from '../components/AIInsightCard';
import BadgeCard from '../components/BadgeCard';
import ChildProfileCard from '../components/ChildProfileCard';
import LevelProgress from '../components/LevelProgress';
import OutcomeCard from '../components/OutcomeCard';
import PersonalBest from '../components/PersonalBest';
import { EmptyState, ErrorState, ScoreCard, Spinner } from '../components/ScoreCard';
import StreakCard from '../components/StreakCard';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { ChallengeDef, CoachResponse, OutcomeKey } from '../types';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { child, detail, scores, setScores } = useApp();
  const [challenges, setChallenges] = useState<ChallengeDef[]>([]);
  const [coach, setCoach] = useState<CoachResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api.get<{ challenges: ChallengeDef[] }>('/challenges')
      .then((r) => { if (alive) setChallenges(r.challenges); })
      .catch((e) => { if (alive) setErr(e.message); });
    if (child) {
      api.post<CoachResponse>('/ai/coach', { childId: child.id })
        .then((r) => { if (alive) setCoach(r); })
        .catch(() => { /* coach card is optional */ });
    }
    return () => { alive = false; };
  }, [child]);

  useEffect(() => { if (detail) setScores(detail.progress); }, [detail]);

  if (!child || !detail || !scores) return <Spinner label="Loading your journey…" />;
  if (err && !challenges.length) return <ErrorState message={err} onRetry={() => window.location.reload()} />;

  const keys: OutcomeKey[] = ['stronger', 'fitter', 'faster', 'champs'];
  const trends: Record<OutcomeKey, number> = { stronger: 7, fitter: 15, faster: 10, champs: 21 };
  const today = challenges.find((c) => c.id === 'reaction-rush') || challenges[0];
  const bestPb = [...detail.personalBests].sort((a, b) => b.score - a.score)[0];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold">
          {greeting()}, {child.name}! 👋
        </h1>
        <p className="mt-1 font-semibold text-slate-500">Ready to get better today? Your streak is on fire.</p>
      </motion.div>

      <section aria-label="Your KIVO journey">
        <h2 className="mb-3 font-display text-xl font-extrabold">YOUR KIVO JOURNEY</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {keys.map((k) => (
            <OutcomeCard key={k} k={k} score={scores[k]} trend={child.id === 'c_aarav' ? trends[k] : undefined} />
          ))}
        </div>
      </section>

      {today && (
        <section className="kivo-card bg-gradient-to-r from-kivo-700 to-kivo-900 !text-white border-0" aria-label="Today's challenge">
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-kivo-200">Today's challenge</p>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold">
            {today.id === 'reaction-rush' ? 'Improve your reaction speed.' : `Time to conquer ${today.name}.`}
          </h2>
          <p className="mt-1 text-sm text-white/75">{today.description}</p>
          <Link to={`/challenge/${today.id}`} className="kivo-btn-ghost mt-4 !bg-amber-400 !text-ink hover:!bg-amber-300">
            START CHALLENGE <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StreakCard days={detail.streak.currentDays} />
        <LevelProgress level={detail.level} xp={detail.xpTotal} progress={detail.levelProgress} />
        {bestPb ? <PersonalBest pb={bestPb} /> : <EmptyState title="No personal best yet" hint="Finish a challenge to set one!" />}
      </div>

      {coach && <AIInsightCard text={coach.encouragement} compact />}

      <section aria-label="Recent achievements">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold">Recent achievements</h2>
          <Link to="/achievements" className="text-sm font-bold text-kivo-600 hover:underline">View all →</Link>
        </div>
        {detail.badges.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {detail.badges.slice(-4).map((b) => (
              <BadgeCard key={b.id} name={b.badgeName} earned earnedAt={b.earnedAt} />
            ))}
          </div>
        ) : (
          <EmptyState title="No badges yet" hint="Complete your first challenge to earn one!" />
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <ScoreCard label="Level" value={`Lv.${detail.level}`} sub={`${detail.xpTotal} XP total`} />
        <ScoreCard label="Current streak" value={`${detail.streak.currentDays}🔥`} sub={`Best: ${detail.streak.longestDays} days`} accent="#F59E0B" />
        <ScoreCard label="Challenges" value={`${detail.recentAttempts.length}`} sub="recent sessions" accent="#8B5CF6" />
      </div>

      <ChildProfileCard child={child} />
      <Link to="/coach" className="inline-flex items-center gap-2 text-sm font-bold text-kivo-600 hover:underline">
        <Sparkles size={15} aria-hidden="true" /> Get today's plan from KIVO Coach
      </Link>
    </div>
  );
}
