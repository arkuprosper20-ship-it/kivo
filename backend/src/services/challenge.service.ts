import type { Attempt, ChildDetail, CompleteResult, OutcomeKey, OutcomeScores, PersonalBest } from '../types';
import { ageFromDob } from '../utils/age';
import { badgeProgress, checkBadges, updateStreak } from './gamification.service';
import { bestAttempt, calculateScore, DIFFICULTY_LABEL, evaluateDifficulty, improvementPercent, isPersonalBest, kivoScore, levelFromXp, levelProgress, updateOutcomes, xpForScore } from './scoring';
import { getStore } from './store/getStore';

function metricOf(challengeId: string, raw: Record<string, number>): { label: string; value: string } {
  if (challengeId === 'rope-rush') return { label: 'Jumps', value: `${raw.jumps || 0} jumps` };
  if (challengeId === 'reaction-rush') return { label: 'Reaction', value: `${(((raw.avgMs || 0)) / 1000).toFixed(2)}s` };
  if (challengeId === 'power-pulse') return { label: 'Power reps', value: `${raw.reps || 0} reps` };
  if (challengeId === 'endurance-quest') return { label: 'Steps', value: `${raw.steps || 0} steps` };
  if (challengeId === 'balance-master') return { label: 'Timing error', value: `${raw.avgErrorMs || 0}ms` };
  return { label: 'Time', value: `${raw.seconds || 0}s` };
}

function improvementFor(challengeId: string, prevRaw: Record<string, number>, raw: Record<string, number>): number {
  const pct = (p: number, c: number, lower: boolean) => {
    const v = improvementPercent(p, c, lower);
    return Number.isFinite(v) ? v : 0;
  };
  switch (challengeId) {
    case 'rope-rush': return pct(Number(prevRaw.jumps || 0), Number(raw.jumps || 0), false);
    case 'reaction-rush': return pct(Number(prevRaw.avgMs || 0), Number(raw.avgMs || 0), true);
    case 'power-pulse': return pct(Number(prevRaw.reps || 0), Number(raw.reps || 0), false);
    case 'endurance-quest': return pct(Number(prevRaw.steps || 0), Number(raw.steps || 0), false);
    case 'balance-master': return pct(Number(prevRaw.avgErrorMs || 0), Number(raw.avgErrorMs || 0), true);
    default: return pct(Number(prevRaw.seconds || 0), Number(raw.seconds || 0), true);
  }
}

export async function completeChallenge(childId: string, challengeId: string, raw: Record<string, number>): Promise<CompleteResult> {
  const store = getStore();
  const child = await store.getChild(childId);
  if (!child) throw Object.assign(new Error('Child not found'), { status: 404 });
  const challenge = await store.getChallenge(challengeId);
  if (!challenge) throw Object.assign(new Error('Challenge not found'), { status: 404 });

  const attempts = await store.listAttempts(childId);
  const prevSame = attempts.filter((a) => a.challengeId === challengeId);
  const prevBest = prevSame.reduce((m, a) => Math.max(m, a.score), 0);
  const prevMetric = prevSame.length ? prevSame[prevSame.length - 1] : null;

  const score = calculateScore(challengeId, raw);
  const isPB = isPersonalBest(attempts, challengeId, score);

  // Improvement vs own previous attempt (metric-aware direction)
  let improvement = 0;
  if (prevMetric) {
    improvement = improvementFor(challengeId, prevMetric.raw as Record<string, number>, raw);
  }

  const xpEarned = xpForScore(score, { isPersonalBest: isPB, improvement });
  const xpBefore = await store.getXp(childId);
  const xpTotal = await store.addXp(childId, xpEarned);
  const level = levelFromXp(xpTotal);
  const leveledUp = levelFromXp(xpBefore) < level;

  const streak = await updateStreak(store, childId);

  const prevScores = await store.getProgress(childId);
  const progress = await store.setProgress(childId, updateOutcomes(prevScores, challengeId, score));

  const attempt: Attempt = await store.createAttempt({
    childId, challengeId, score, raw, improvement, isPersonalBest: isPB, xpEarned,
    createdAt: new Date().toISOString(),
  });

  const badgesUnlocked = await checkBadges(store, childId, attempt, streak.currentDays);

  const allAttempts = [...attempts, attempt];
  const difficulty = evaluateDifficulty(allAttempts, challengeId);

  return { attempt, score, improvement, isPersonalBest: isPB, xpEarned, xpTotal, level, leveledUp, badgesUnlocked, progress, streak, difficulty, difficultyLabel: DIFFICULTY_LABEL[difficulty] };
}

export async function getChildDetail(childId: string): Promise<ChildDetail> {
  const store = getStore();
  const child = await store.getChild(childId);
  if (!child) throw Object.assign(new Error('Child not found'), { status: 404 });
  // Resolve display age from DOB when present
  const dobAge = ageFromDob(child.dob, 0);
  if (child.dob && dobAge > 0) child.age = dobAge;
  const [progress, baseline, streak, xpTotal, badges, attempts, challenges, assigned] = await Promise.all([
    store.getProgress(childId), store.getBaseline(childId), store.getStreak(childId), store.getXp(childId),
    store.listBadges(childId), store.listAttempts(childId), store.listChallenges(), store.getAssignment(childId),
  ]);
  const level = levelFromXp(xpTotal);
  const personalBests: PersonalBest[] = challenges.map((c) => {
    const list = attempts.filter((a) => a.challengeId === c.id);
    if (!list.length) return null;
    const best = list.reduce((b, a) => (a.score > b.score ? a : b));
    const m = metricOf(c.id, best.raw as Record<string, number>);
    const prevList = list.filter((a) => a.id !== best.id);
    const prevBest = prevList.length ? prevList.reduce((b, a) => (a.score > b.score ? a : b)) : null;
    const pm = prevBest ? metricOf(c.id, prevBest.raw as Record<string, number>) : null;
    return {
      challengeId: c.id, challengeName: c.name, score: best.score,
      metricLabel: m.label, metricValue: m.value,
      previousMetricValue: pm?.value,
      improvement: best.improvement || undefined,
      achievedAt: best.createdAt,
    };
  }).filter(Boolean) as PersonalBest[];

  return {
    child, progress,
    baseline: baseline || { ...progress },
    changes: (Object.keys(progress) as OutcomeKey[]).reduce((acc, k) => {
      acc[k] = progress[k] - (baseline ? baseline[k] : progress[k]);
      return acc;
    }, {} as Record<OutcomeKey, number>),
    kivoScore: kivoScore(progress),
    streak, xpTotal, level,
    levelProgress: levelProgress(xpTotal), badges, personalBests,
    recentAttempts: attempts.slice(-8).reverse(),
    assignedChallenge: assigned,
  };
}

export { badgeProgress, bestAttempt, kivoScore };
