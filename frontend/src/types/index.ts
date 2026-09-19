// Mirrors backend domain types for the KIVO frontend.

export type Role = 'parent' | 'individual' | 'coach';
export type ViewRole = 'child' | 'parent' | 'individual' | 'coach';
export type OutcomeKey = 'stronger' | 'fitter' | 'faster' | 'champs';

export interface User { id: string; name: string; email: string; role: Role; dob?: string; createdAt: string }

export interface Child {
  id: string; parentId: string; ownerUserId?: string; kind: 'child' | 'individual';
  name: string; age: number; dob?: string; height: number;
  fitnessLevel: string; favoriteActivities: string[]; goals: string[];
  avatarColor: string; createdAt: string;
}

export interface OutcomeScores { stronger: number; fitter: number; faster: number; champs: number }

export interface ChallengeDef {
  id: string; name: string; category: 'STRONGER' | 'FITTER' | 'FASTER' | 'CHAMPS';
  difficulty: string; duration: string; description: string; unit: string;
}

export interface Attempt {
  id: string; childId: string; challengeId: string; score: number;
  raw: Record<string, number>; improvement: number; isPersonalBest: boolean;
  xpEarned: number; createdAt: string;
}

export interface Badge { id: string; childId: string; badgeName: string; earnedAt: string }
export interface Streak { childId: string; currentDays: number; longestDays: number; lastActiveDate: string }

export interface PersonalBest {
  challengeId: string; challengeName: string; score: number;
  metricLabel: string; metricValue: string; previousMetricValue?: string;
  improvement?: number; achievedAt: string;
}

export interface ChildDetail {
  child: Child; progress: OutcomeScores; baseline: OutcomeScores;
  changes: Record<OutcomeKey, number>; kivoScore: number;
  streak: Streak;
  xpTotal: number; level: number; levelProgress: number;
  badges: Badge[]; personalBests: PersonalBest[]; recentAttempts: Attempt[];
  assignedChallenge?: Assignment | null;
}

export interface Assignment {
  coachId: string; profileId: string; challengeId: string; note: string; createdAt: string;
}

export interface BadgeProgress { name: string; current: number; target: number; earned: boolean }

export interface CompleteResult {
  attempt: Attempt; score: number; improvement: number; isPersonalBest: boolean;
  xpEarned: number; xpTotal: number; level: number; leveledUp: boolean;
  badgesUnlocked: Badge[]; progress: OutcomeScores; streak: Streak;
  difficulty: 'up' | 'same' | 'down'; difficultyLabel: string;
}

export interface WorkoutBlock { label: string; minutes: number; detail: string }

export interface CoachResponse {
  encouragement: string; strongestArea: OutcomeKey; weakestArea: OutcomeKey;
  recommendation: string; nextChallenge: string; difficulty: string;
  workout: WorkoutBlock[]; reason: string; source: 'llm' | 'deterministic';
}
