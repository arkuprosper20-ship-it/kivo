import type { Attempt, Badge, BadgeProgress } from '../types';
import type { Store } from './store';

export const BADGE_DEFS: Array<{ name: string; label: string; icon: string; hint: string }> = [
  { name: 'first-challenge', label: 'First Challenge', icon: '🏅', hint: 'Complete your first challenge' },
  { name: 'streak-7', label: '7-Day Streak', icon: '🔥', hint: 'Train 7 days in a row' },
  { name: 'speed-master', label: 'Speed Master', icon: '⚡', hint: 'Score 85+ in Reaction Rush' },
  { name: 'strength-starter', label: 'Strength Starter', icon: '💪', hint: 'Score 60+ in any challenge' },
  { name: 'endurance-star', label: 'Endurance Star', icon: '🌀', hint: 'Jump 40+ in Rope Rush' },
  { name: 'agility-ace', label: 'Agility Ace', icon: '🎯', hint: 'Score 80+ in Agility Command' },
  { name: 'personal-best', label: 'Personal Best', icon: '🏆', hint: 'Beat your own best score' },
  { name: 'consistency-champion', label: 'Consistency Champion', icon: '🎯', hint: 'Try 4 different challenges' },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

/** Updates the daily streak and returns the new streak. */
export async function updateStreak(store: Store, childId: string) {
  const s = await store.getStreak(childId);
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (s.lastActiveDate === today) return s;
  const continued = s.lastActiveDate === yesterday;
  const next = {
    childId,
    currentDays: continued ? s.currentDays + 1 : 1,
    longestDays: Math.max(s.longestDays, continued ? s.currentDays + 1 : 1),
    lastActiveDate: today,
  };
  return store.setStreak(childId, next);
}

/** Awards any newly-earned badges after a completed attempt. */
export async function checkBadges(
  store: Store,
  childId: string,
  attempt: Attempt,
  streakDays: number,
): Promise<Badge[]> {
  const unlocked: Badge[] = [];
  const award = async (name: string) => {
    const { badge, isNew } = await store.awardBadge(childId, name);
    if (isNew) unlocked.push(badge);
  };
  await award('first-challenge');
  if (attempt.isPersonalBest) await award('personal-best');
  if (attempt.score >= 60) await award('strength-starter');
  if (attempt.challengeId === 'reaction-rush' && attempt.score >= 85) await award('speed-master');
  if (attempt.challengeId === 'rope-rush' && Number((attempt.raw as any).jumps || 0) >= 40) await award('endurance-star');
  if (attempt.challengeId === 'agility-command' && attempt.score >= 80) await award('agility-ace');
  if (attempt.challengeId === 'power-pulse' && attempt.score >= 80) await award('strength-starter');
  if (attempt.challengeId === 'endurance-quest' && attempt.score >= 80) await award('endurance-star');
  if (attempt.challengeId === 'balance-master' && attempt.score >= 80) await award('consistency-champion');
  if (streakDays >= 7) await award('streak-7');
  // consistency champion: 4 distinct challenges tried
  const distinct = new Set((await store.listAttempts(childId)).map((a) => a.challengeId));
  if (distinct.size >= 4) await award('consistency-champion');
  return unlocked;
}

/** Progress toward each badge (earned badges report full progress). */
export async function badgeProgress(store: Store, childId: string): Promise<BadgeProgress[]> {
  const [attempts, badges] = await Promise.all([store.listAttempts(childId), store.listBadges(childId)]);
  const earned = new Set(badges.map((b) => b.badgeName));
  const full = (name: string, target: number): BadgeProgress => ({ name, current: target, target, earned: true });
  const prog = (name: string, current: number, target: number): BadgeProgress =>
    ({ name, current: Math.min(target, current), target, earned: earned.has(name) });
  const speedTries = attempts.filter((a) => a.challengeId === 'reaction-rush').length;
  const distinct = new Set(attempts.map((a) => a.challengeId)).size;
  const streak = await store.getStreak(childId);
  return [
    attempts.length > 0 || earned.has('first-challenge') ? full('first-challenge', 1) : prog('first-challenge', 0, 1),
    prog('streak-7', streak.currentDays, 7),
    prog('speed-master', speedTries, 10),
    prog('strength-starter', attempts.filter((a) => a.score >= 60).length, 1),
    prog('endurance-star', attempts.filter((a) => a.challengeId === 'rope-rush' || a.challengeId === 'endurance-quest').length, 3),
    prog('agility-ace', attempts.filter((a) => a.challengeId === 'agility-command' && a.score >= 80).length, 1),
    prog('personal-best', attempts.filter((a) => a.isPersonalBest).length, 1),
    prog('consistency-champion', distinct, 4),
  ];
}
