import type { Attempt, ChildDetail, CompleteResult, PersonalBest } from '../types';
import { checkBadges, updateStreak } from './gamification.service';
import { calculateScore, improvementPercent, isPersonalBest, kivoScore, levelFromXp, levelProgress, updateOutcomes, xpForScore } from './scoring';
import { getStore } from './store/getStore';

function metricOf(challengeId: string, raw: Record<string, number>): { label: string; value: string } {
  if (challengeId === 'rope-rush') return { label: 'Jumps', value: `${raw.jumps || 0} jumps` };
  if (challengeId === 'reaction-rush') return { label: 'Reaction', value: `${(((raw.avgMs || 0)) / 1000).toFixed(2)}s` };
  return { label: 'Time', value: `${raw.seconds || 0}s` };
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
    if (challengeId === 'rope-rush') {
      improvement = improvementPercent(Number((prevMetric.raw as any).jumps || 0), Number(raw.jumps || 0), false);
    } else if (challengeId === 'reaction-rush') {
      improvement = improvementPercent(Number((prevMetric.raw as any).avgMs || 0), Number(raw.avgMs || 0), true);
    } else {
      improvement = improvementPercent(Number((prevMetric.raw as any).seconds || 0), Number(raw.seconds || 0), true);
    }
    if (!Number.isFinite(improvement)) improvement = 0;
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

  return { attempt, score, improvement, isPersonalBest: isPB, xpEarned, xpTotal, level, leveledUp, badgesUnlocked, progress, streak };
}

export async function getChildDetail(childId: string): Promise<ChildDetail> {
  const store = getStore();
  const child = await store.getChild(childId);
  if (!child) throw Object.assign(new Error('Child not found'), { status: 404 });
  const [progress, streak, xpTotal, badges, attempts, challenges] = await Promise.all([
    store.getProgress(childId), store.getStreak(childId), store.getXp(childId),
    store.listBadges(childId), store.listAttempts(childId), store.listChallenges(),
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
    child, progress, streak, xpTotal, level,
    levelProgress: levelProgress(xpTotal), badges, personalBests,
    recentAttempts: attempts.slice(-8).reverse(),
  };
}

export { kivoScore };
