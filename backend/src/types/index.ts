// Shared KIVO domain types (backend source of truth).

export type Role = 'parent' | 'child' | 'coach';
export type OutcomeKey = 'stronger' | 'fitter' | 'faster' | 'champs';
export type Category = 'STRONGER' | 'FITTER' | 'FASTER' | 'CHAMPS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Child {
  id: string;
  parentId: string;
  name: string;
  age: number;
  height: number;
  fitnessLevel: string;
  favoriteActivities: string[];
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
  source: 'llm' | 'deterministic';
}

export interface ChildDetail {
  child: Child;
  progress: OutcomeScores;
  streak: Streak;
  xpTotal: number;
  level: number;
  levelProgress: number; // 0-100 toward next level
  badges: Badge[];
  personalBests: PersonalBest[];
  recentAttempts: Attempt[];
}
