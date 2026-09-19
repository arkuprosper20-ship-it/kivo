import type { Attempt, Badge } from '../types';
import type { Store } from './store';

export const BADGE_DEFS: Array<{ name: string; label: string; icon: string; hint: string }> = [
  { name: 'first-challenge', label: 'First Challenge', icon: '🏅', hint: 'Complete your first challenge' },
  { name: 'streak-7', label: '7-Day Streak', icon: '🔥', hint: 'Train 7 days in a row' },
  { name: 'speed-master', label: 'Speed Master', icon: '⚡', hint: 'Score 85+ in Reaction Rush' },
  { name: 'strength-starter', label: 'Strength Starter', icon: '💪', hint: 'Score 60+ in any challenge' },
  { name: 'endurance-star', label: 'Endurance Star', icon: '🌀', hint: 'Jump 40+ in Rope Rush' },
  { name: 'agility-ace', label: 'Agility Ace', icon: '🎯', hint: 'Score 80+ in Agility Command' },
  { name: 'personal-best', label: 'Personal Best', icon: '🏆', hint: 'Beat your own best score' },
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
  if (streakDays >= 7) await award('streak-7');
  return unlocked;
}
