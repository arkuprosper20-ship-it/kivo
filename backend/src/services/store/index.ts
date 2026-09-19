import type { Attempt, Badge, ChallengeDef, Child, OutcomeScores, Streak, User } from '../../types';

/** Storage abstraction. Memory store is default; Supabase activates via env. */
export interface Store {
  kind: 'memory' | 'supabase';
  // users
  createUser(u: Omit<User, 'createdAt'> & { password: string }): Promise<User>;
  getUserByEmail(email: string): Promise<(User & { password?: string }) | null>;
  getUserById(id: string): Promise<User | null>;
  // children
  createChild(c: Omit<Child, 'id' | 'createdAt'>): Promise<Child>;
  getChild(id: string): Promise<Child | null>;
  listChildrenByParent(parentId: string): Promise<Child[]>;
  updateChild(id: string, patch: Partial<Child>): Promise<Child | null>;
  // progress
  getProgress(childId: string): Promise<OutcomeScores>;
  setProgress(childId: string, scores: OutcomeScores): Promise<OutcomeScores>;
  // challenges (static catalogue, but kept behind store for symmetry)
  listChallenges(): Promise<ChallengeDef[]>;
  getChallenge(id: string): Promise<ChallengeDef | null>;
  // attempts
  createAttempt(a: Omit<Attempt, 'id'> & { id?: string }): Promise<Attempt>;
  listAttempts(childId: string): Promise<Attempt[]>;
  // badges
  awardBadge(childId: string, badgeName: string): Promise<{ badge: Badge; isNew: boolean }>;
  listBadges(childId: string): Promise<Badge[]>;
  // streak + xp
  getStreak(childId: string): Promise<Streak>;
  setStreak(childId: string, s: Streak): Promise<Streak>;
  getXp(childId: string): Promise<number>;
  addXp(childId: string, amount: number): Promise<number>;
  // demo
  resetDemo(): Promise<void>;
}
