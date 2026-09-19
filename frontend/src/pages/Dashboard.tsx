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
import ProgressRing from '../components/ProgressRing';
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

const FOCUS_CHALLENGE: Record<OutcomeKey, string> = {
  stronger: 'power-pulse', fitter: 'endurance-quest', faster: 'reaction-rush', champs: 'balance-master',
};

export default function Dashboard() {
  const { child, detail, scores, setScores, isAdult, viewRole } = useApp();
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
  const weakest = keys.reduce((a, b) => (scores[a] <= scores[b] ? a : b));
  const assigned = detail.assignedChallenge;
  const today = challenges.find((c) => c.id === (assigned?.challengeId || FOCUS_CHALLENGE[weakest])) || challenges[0];
  const bestPb = [...detail.personalBests].sort((a, b) => b.score - a.score)[0];
  const weeklyMin = detail.recentAttempts.length * 8;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold">
          {isAdult ? `${greeting()}, ${child.name}.` : `${greeting()}, ${child.name}! 👋`}
        </h1>
        <p className="mt-1 font-semibold text-slate-500">
          {isAdult ? 'Your progress at a glance. Beat your own best — that’s the game.' : 'Ready to get better today? Your streak is on fire.'}
        </p>
      </motion.div>

      {/* KIVO SCORE */}
      <section className="kivo-card flex items-center gap-5" aria-label="KIVO score">
        <ProgressRing value={detail.kivoScore} size={110} label="KIVO" />
        <div className="min-w-0">
          <h2 className="font-display text-xl font-extrabold">{isAdult ? 'PERFORMANCE' : 'YOUR KIVO JOURNEY'}</h2>
          <p className="text-sm font-semibold text-slate-500">
            KIVO Score <strong className="text-ink">{detail.kivoScore}/100</strong> — your age doesn't define your potential. Your progress does.
          </p>
          {isAdult && (
            <p className="mt-1 text-sm font-bold text-slate-600">Weekly activity {weeklyMin} min · 🔥 {detail.streak.currentDays}-day streak</p>
          )}
        </div>
      </section>

      <section aria-label="Outcomes">
        <div className="grid gap-4 sm:grid-cols-2">
          {keys.map((k) => (
            <OutcomeCard key={k} k={k} score={scores[k]} trend={detail.changes[k]} />
          ))}
        </div>
      </section>

      {today && (
        <section className="kivo-card bg-gradient-to-r from-kivo-700 to-kivo-900 !text-white border-0" aria-label="Today's challenge">
          <p className="font-display text-sm font-extrabold uppercase tracking-widest text-kivo-200">
            {isAdult ? "Today's training" : "Today's challenge"}
          </p>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold">
            {assigned ? `Coach assigned: ${today.name}` : today.id === 'reaction-rush' ? 'Improve your reaction speed.' : `Time to conquer ${today.name}.`}
          </h2>
          <p className="mt-1 text-sm text-white/75">
            {assigned?.note || today.description}
            {isAdult ? '' : " Let's beat your personal best!"}
          </p>
          <Link to={`/challenge/${today.id}`} className="kivo-btn-ghost mt-4 !bg-amber-400 !text-ink hover:!bg-amber-300">
            {isAdult ? 'START →' : 'START CHALLENGE →'} <ArrowRight size={18} aria-hidden="true" className="hidden" />
          </Link>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StreakCard days={detail.streak.currentDays} />
        <LevelProgress level={detail.level} xp={detail.xpTotal} progress={detail.levelProgress} />
        {bestPb ? <PersonalBest pb={bestPb} /> : <EmptyState title="No personal best yet" hint="Finish a challenge to set one!" />}
      </div>

      {coach && (
        <section aria-label="KIVO coach preview">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-xl font-extrabold">KIVO COACH</h2>
            <Link to="/coach" className="inline-flex items-center gap-1 text-sm font-bold text-kivo-600 hover:underline">
              <Sparkles size={15} aria-hidden="true" /> {isAdult ? 'View training plan →' : 'Ask KIVO Coach →'}
            </Link>
          </div>
          <AIInsightCard text={isAdult
            ? `Your ${coach.strongestArea.toUpperCase()} score is ${scores[coach.strongestArea]}/100. Focus: ${coach.weakestArea.toUpperCase()} at ${scores[coach.weakestArea]}/100.`
            : coach.encouragement} compact />
        </section>
      )}

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
        <ScoreCard label={isAdult ? 'Personal best' : 'Challenges'} value={bestPb ? bestPb.metricValue : `${detail.recentAttempts.length}`} sub={bestPb ? bestPb.challengeName : 'recent sessions'} accent="#8B5CF6" />
      </div>

      <ChildProfileCard child={child} />
      {viewRole === 'child' && (
        <p className="text-xs text-slate-400">Your parent manages your profile and can see your progress anytime. Beat your own best — that's the game. 🎮</p>
      )}
    </div>
  );
}
