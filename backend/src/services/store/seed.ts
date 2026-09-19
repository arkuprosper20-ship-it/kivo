import type { Attempt, OutcomeScores } from '../../types';
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
/** DOB exactly N years ago today (keeps demo ages stable). */
const dobYearsAgo = (years: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
};

interface SeedAttempt { challengeId: string; raw: Attempt['raw']; daysAgo: number }

function addHistory(store: MemoryStore, childId: string, history: SeedAttempt[], startIdx: number): number {
  const attempts: Attempt[] = [];
  const bestByChallenge = new Map<string, number>();
  history.forEach((h, i) => {
    const score = calculateScore(h.challengeId, h.raw as Record<string, number>);
    const prevBest = bestByChallenge.get(h.challengeId) || 0;
    const isPB = score > prevBest;
    if (isPB) bestByChallenge.set(h.challengeId, score);
    attempts.push({
      id: `a_seed_${startIdx + i}`,
      childId,
      challengeId: h.challengeId,
      score,
      raw: h.raw,
      improvement: 0,
      isPersonalBest: isPB,
      xpEarned: 40 + Math.round(score / 3),
      createdAt: isoDaysAgo(h.daysAgo, 17 - (i % 5)),
    });
  });
  store.attempts.set(childId, attempts);
  return startIdx + history.length;
}

/**
 * Seeds the demo universe — 5 personas:
 * Aarav (10, parent-managed) · Riya (17, independent) · Alex (28, independent)
 * Demo Parent (guardian of Aarav + Riya) · Demo Coach (access to all athletes)
 */
export function seedDemo(store: MemoryStore) {
  // ---------- users ----------
  store.users.set('u_demo_parent', {
    id: 'u_demo_parent', name: 'Priya Sharma', email: 'demo@kivo.app',
    role: 'parent', dob: dobYearsAgo(38), password: 'demo1234', createdAt: isoDaysAgo(60),
  });
  store.users.set('u_riya', {
    id: 'u_riya', name: 'Riya', email: 'riya@kivo.app',
    role: 'individual', dob: dobYearsAgo(17), password: 'demo1234', createdAt: isoDaysAgo(40),
  });
  store.users.set('u_alex', {
    id: 'u_alex', name: 'Alex', email: 'alex@kivo.app',
    role: 'individual', dob: dobYearsAgo(28), password: 'demo1234', createdAt: isoDaysAgo(50),
  });
  store.users.set('u_coach', {
    id: 'u_coach', name: 'Coach Dev', email: 'coach@kivo.app',
    role: 'coach', dob: dobYearsAgo(34), password: 'demo1234', createdAt: isoDaysAgo(90),
  });

  let n = 0;

  // ---------- Aarav (10, parent-managed) ----------
  const aarav = 'c_aarav';
  store.children.set(aarav, {
    id: aarav, parentId: 'u_demo_parent', kind: 'child', name: 'Aarav',
    age: 10, dob: dobYearsAgo(10), height: 132, fitnessLevel: 'Active',
    favoriteActivities: ['Football', 'Cycling'],
    goals: ['endurance', 'speed', 'consistency'],
    avatarColor: '#2563EB', createdAt: isoDaysAgo(30),
  });
  const aaravScores: OutcomeScores = { stronger: 62, fitter: 58, faster: 71, champs: 40 };
  store.progress.set(aarav, { ...aaravScores });
  store.baseline.set(aarav, { ...aaravScores });
  store.streaks.set(aarav, { childId: aarav, currentDays: 6, longestDays: 6, lastActiveDate: dayStr(1) });
  store.xp.set(aarav, 320);
  n = addHistory(store, aarav, [
    { challengeId: 'rope-rush', raw: { jumps: 30, durationSec: 60, consistency: 72 }, daysAgo: 6 },
    { challengeId: 'reaction-rush', raw: { avgMs: 940, accuracy: 88, hits: 8, misses: 2, rounds: 10 }, daysAgo: 5 },
    { challengeId: 'agility-command', raw: { seconds: 16.4, accuracy: 84, errors: 2, roundsCompleted: 3 }, daysAgo: 4 },
    { challengeId: 'rope-rush', raw: { jumps: 35, durationSec: 60, consistency: 78 }, daysAgo: 3 },
    { challengeId: 'reaction-rush', raw: { avgMs: 910, accuracy: 90, hits: 9, misses: 1, rounds: 10 }, daysAgo: 2 },
    { challengeId: 'agility-command', raw: { seconds: 14.2, accuracy: 92, errors: 1, roundsCompleted: 3 }, daysAgo: 1 },
    { challengeId: 'reaction-rush', raw: { avgMs: 820, accuracy: 94, hits: 9, misses: 1, rounds: 10 }, daysAgo: 1 },
  ], n);
  store.badges.set(aarav, [
    { id: 'b_seed_1', childId: aarav, badgeName: 'first-challenge', earnedAt: isoDaysAgo(6) },
    { id: 'b_seed_2', childId: aarav, badgeName: 'strength-starter', earnedAt: isoDaysAgo(4) },
    { id: 'b_seed_3', childId: aarav, badgeName: 'speed-master', earnedAt: isoDaysAgo(1) },
    { id: 'b_seed_4', childId: aarav, badgeName: 'personal-best', earnedAt: new Date().toISOString() },
  ]);

  // ---------- Riya (17, independent) ----------
  const riya = 'c_riya';
  store.children.set(riya, {
    id: riya, parentId: 'u_demo_parent', ownerUserId: 'u_riya', kind: 'individual', name: 'Riya',
    age: 17, dob: dobYearsAgo(17), height: 160, fitnessLevel: 'Sporty',
    favoriteActivities: ['Running', 'Basketball'],
    goals: ['speed', 'agility', 'overall'],
    avatarColor: '#8B5CF6', createdAt: isoDaysAgo(40),
  });
  const riyaScores: OutcomeScores = { stronger: 58, fitter: 66, faster: 78, champs: 55 };
  store.progress.set(riya, { ...riyaScores });
  store.baseline.set(riya, { stronger: 52, fitter: 58, faster: 64, champs: 44 });
  store.streaks.set(riya, { childId: riya, currentDays: 4, longestDays: 9, lastActiveDate: dayStr(0) });
  store.xp.set(riya, 410);
  n = addHistory(store, riya, [
    { challengeId: 'reaction-rush', raw: { avgMs: 880, accuracy: 90, hits: 9, misses: 1, rounds: 10 }, daysAgo: 4 },
    { challengeId: 'power-pulse', raw: { reps: 52, durationSec: 30 }, daysAgo: 3 },
    { challengeId: 'reaction-rush', raw: { avgMs: 790, accuracy: 93, hits: 9, misses: 1, rounds: 10 }, daysAgo: 1 },
    { challengeId: 'balance-master', raw: { avgErrorMs: 320, accuracy: 88, roundsCompleted: 3 }, daysAgo: 0 },
  ], n);
  store.badges.set(riya, [
    { id: 'b_riya_1', childId: riya, badgeName: 'first-challenge', earnedAt: isoDaysAgo(4) },
    { id: 'b_riya_2', childId: riya, badgeName: 'speed-master', earnedAt: isoDaysAgo(1) },
    { id: 'b_riya_3', childId: riya, badgeName: 'personal-best', earnedAt: isoDaysAgo(1) },
  ]);

  // ---------- Alex (28, independent) ----------
  const alex = 'c_alex';
  store.children.set(alex, {
    id: alex, parentId: 'u_alex', ownerUserId: 'u_alex', kind: 'individual', name: 'Alex',
    age: 28, dob: dobYearsAgo(28), height: 178, fitnessLevel: 'Sporty',
    favoriteActivities: ['Running', 'Swimming'],
    goals: ['strength', 'endurance', 'overall'],
    avatarColor: '#16A34A', createdAt: isoDaysAgo(50),
  });
  const alexScores: OutcomeScores = { stronger: 82, fitter: 76, faster: 71, champs: 88 };
  store.progress.set(alex, { ...alexScores });
  store.baseline.set(alex, { stronger: 70, fitter: 64, faster: 66, champs: 70 });
  store.streaks.set(alex, { childId: alex, currentDays: 12, longestDays: 21, lastActiveDate: dayStr(0) });
  store.xp.set(alex, 1240);
  n = addHistory(store, alex, [
    { challengeId: 'power-pulse', raw: { reps: 74, durationSec: 30 }, daysAgo: 6 },
    { challengeId: 'endurance-quest', raw: { steps: 96, durationSec: 45, errors: 2 }, daysAgo: 4 },
    { challengeId: 'reaction-rush', raw: { avgMs: 860, accuracy: 91, hits: 9, misses: 1, rounds: 10 }, daysAgo: 2 },
    { challengeId: 'power-pulse', raw: { reps: 81, durationSec: 30 }, daysAgo: 1 },
    { challengeId: 'balance-master', raw: { avgErrorMs: 210, accuracy: 94, roundsCompleted: 3 }, daysAgo: 0 },
  ], n);
  store.badges.set(alex, [
    { id: 'b_alex_1', childId: alex, badgeName: 'first-challenge', earnedAt: isoDaysAgo(6) },
    { id: 'b_alex_2', childId: alex, badgeName: 'strength-starter', earnedAt: isoDaysAgo(6) },
    { id: 'b_alex_3', childId: alex, badgeName: 'endurance-star', earnedAt: isoDaysAgo(4) },
    { id: 'b_alex_4', childId: alex, badgeName: 'personal-best', earnedAt: isoDaysAgo(1) },
    { id: 'b_alex_5', childId: alex, badgeName: 'streak-7', earnedAt: isoDaysAgo(2) },
  ]);

  // ---------- coach permissions + assignment ----------
  const perms = store.perms;
  perms.set('u_coach', new Set([aarav, riya, alex]));
  store.assignments.set(aarav, {
    coachId: 'u_coach', profileId: aarav, challengeId: 'endurance-quest',
    note: 'Build that engine! 2 endurance rounds this week.',
    createdAt: isoDaysAgo(1),
  });
}
