import type { Attempt } from '../../types';
import { calculateScore } from '../scoring';
import type { MemoryStore } from './memoryStore';

const isoDaysAgo = (days: number, hour = 17) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 12, 0, 0);
  return d.toISOString();
};
const dayStr = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};

/** Seeds the demo universe: parent + Aarav + 7-day history + badges + streak + XP. */
export function seedDemo(store: MemoryStore) {
  store.users.set('u_demo_parent', {
    id: 'u_demo_parent',
    name: 'Priya Sharma',
    email: 'demo@kivo.app',
    role: 'parent',
    password: 'demo1234',
    createdAt: isoDaysAgo(30),
  });

  const childId = 'c_aarav';
  store.children.set(childId, {
    id: childId,
    parentId: 'u_demo_parent',
    name: 'Aarav',
    age: 10,
    height: 132,
    fitnessLevel: 'Active',
    favoriteActivities: ['Football', 'Cycling'],
    avatarColor: '#2563EB',
    createdAt: isoDaysAgo(30),
  });
  store.progress.set(childId, { stronger: 62, fitter: 58, faster: 71, champs: 40 });

  // 6-day streak ending yesterday -> today's challenge makes it 7 + unlocks badge
  store.streaks.set(childId, { childId, currentDays: 6, longestDays: 6, lastActiveDate: dayStr(1) });
  store.xp.set(childId, 320);

  const history: Array<{ challengeId: string; raw: Attempt['raw']; daysAgo: number }> = [
    { challengeId: 'rope-rush', raw: { jumps: 30, durationSec: 60, consistency: 72 }, daysAgo: 6 },
    { challengeId: 'reaction-rush', raw: { avgMs: 940, accuracy: 88, hits: 8, misses: 2, rounds: 10 }, daysAgo: 5 },
    { challengeId: 'agility-command', raw: { seconds: 16.4, accuracy: 84, errors: 2, roundsCompleted: 3 }, daysAgo: 4 },
    { challengeId: 'rope-rush', raw: { jumps: 35, durationSec: 60, consistency: 78 }, daysAgo: 3 },
    { challengeId: 'reaction-rush', raw: { avgMs: 910, accuracy: 90, hits: 9, misses: 1, rounds: 10 }, daysAgo: 2 },
    { challengeId: 'agility-command', raw: { seconds: 14.2, accuracy: 92, errors: 1, roundsCompleted: 3 }, daysAgo: 1 },
    { challengeId: 'reaction-rush', raw: { avgMs: 820, accuracy: 94, hits: 9, misses: 1, rounds: 10 }, daysAgo: 1 },
  ];

  const attempts: Attempt[] = [];
  const bestByChallenge = new Map<string, number>();
  history.forEach((h, i) => {
    const score = calculateScore(h.challengeId, h.raw as Record<string, number>);
    const prevBest = bestByChallenge.get(h.challengeId) || 0;
    const isPB = score > prevBest;
    if (isPB) bestByChallenge.set(h.challengeId, score);
    attempts.push({
      id: `a_seed_${i}`,
      childId,
      challengeId: h.challengeId,
      score,
      raw: h.raw,
      improvement: 0,
      isPersonalBest: isPB,
      xpEarned: 40 + Math.round(score / 3),
      createdAt: isoDaysAgo(h.daysAgo, 17 - i),
    });
  });
  store.attempts.set(childId, attempts);

  const now = new Date().toISOString();
  store.badges.set(childId, [
    { id: 'b_seed_1', childId, badgeName: 'first-challenge', earnedAt: isoDaysAgo(6) },
    { id: 'b_seed_2', childId, badgeName: 'strength-starter', earnedAt: isoDaysAgo(4) },
    { id: 'b_seed_3', childId, badgeName: 'speed-master', earnedAt: isoDaysAgo(1) },
    { id: 'b_seed_4', childId, badgeName: 'personal-best', earnedAt: now },
  ]);
}
