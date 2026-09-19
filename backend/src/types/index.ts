// Shared KIVO domain types (backend source of truth).

export type Role = 'parent' | 'individual' | 'coach';
export type ViewRole = 'child' | 'parent' | 'individual' | 'coach';
export type OutcomeKey = 'stronger' | 'fitter' | 'faster' | 'champs';
export type Category = 'STRONGER' | 'FITTER' | 'FASTER' | 'CHAMPS';
export type ProfileKind = 'child' | 'individual';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  dob?: string; // YYYY-MM-DD
  createdAt: string;
}

export interface Child {
  id: string;
  parentId: string; // guardian user id (also set for individuals for guardian view)
  ownerUserId?: string; // set for independent (16+) profiles: the user who owns it
  kind: ProfileKind; // 'child' = parent-managed (<16), 'individual' = self-managed (16+)
  name: string;
  age: number;
  dob?: string; // YYYY-MM-DD
  height: number;
  fitnessLevel: string;
  favoriteActivities: string[];
  goals: string[];
  avatarColor: string;
  createdAt: string;
}

export interface OutcomeScores {
  stronger: number;
  fitter: number;
  faster: number;
  champs: number;
}

export interface ChallengeDef {
  id: string;
  name: string;
  category: Category;
  difficulty: string;
  duration: string;
  description: string;
  unit: string;
}

/** Raw performance payloads per challenge */
export interface RopeRaw { jumps: number; durationSec: number; consistency?: number }
export interface ReactionRaw { avgMs: number; accuracy: number; hits: number; misses: number; rounds: number }
export interface AgilityRaw { seconds: number; accuracy: number; errors: number; roundsCompleted: number }
export type RawPerformance = RopeRaw | ReactionRaw | AgilityRaw | Record<string, number>;

export interface Attempt {
  id: string;
  childId: string;
  challengeId: string;
  score: number;
  raw: RawPerformance;
  improvement: number;
  isPersonalBest: boolean;
  xpEarned: number;
  createdAt: string;
}

export interface Badge {
  id: string;
  childId: string;
  badgeName: string;
  earnedAt: string;
}

export interface Streak {
  childId: string;
  currentDays: number;
  longestDays: number;
  lastActiveDate: string; // YYYY-MM-DD
}

export interface PersonalBest {
  challengeId: string;
  challengeName: string;
  score: number;
  metricLabel: string;
  metricValue: string;
  previousMetricValue?: string;
  improvement?: number;
  achievedAt: string;
}

export interface CompleteResult {
  attempt: Attempt;
  score: number;
  improvement: number;
  isPersonalBest: boolean;
  xpEarned: number;
  xpTotal: number;
  level: number;
  leveledUp: boolean;
  badgesUnlocked: Badge[];
  progress: OutcomeScores;
  streak: Streak;
  difficulty: 'up' | 'same' | 'down';
  difficultyLabel: string;
}

export interface WorkoutBlock {
  label: string;
  minutes: number;
  detail: string;
}

export interface CoachResponse {
  encouragement: string;
  strongestArea: OutcomeKey;
  weakestArea: OutcomeKey;
  recommendation: string;
  nextChallenge: string;
  difficulty: string;
  workout: WorkoutBlock[];
  reason: string; // WHY this plan — explainable recommendation
  source: 'llm' | 'deterministic';
}

export interface ChildDetail {
  child: Child;
  progress: OutcomeScores;
  baseline: OutcomeScores;
  changes: Record<OutcomeKey, number>; // current - baseline
  kivoScore: number;
  streak: Streak;
  xpTotal: number;
  level: number;
  levelProgress: number; // 0-100 toward next level
  badges: Badge[];
  personalBests: PersonalBest[];
  recentAttempts: Attempt[];
  assignedChallenge?: Assignment | null;
}

export interface Assignment {
  coachId: string;
  profileId: string;
  challengeId: string;
  note: string;
  createdAt: string;
}

export interface BadgeProgress {
  name: string;
  current: number;
  target: number;
  earned: boolean;
}
