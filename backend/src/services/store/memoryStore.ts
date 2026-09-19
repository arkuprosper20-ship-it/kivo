import type { Assignment, Attempt, Badge, ChallengeDef, Child, OutcomeScores, Streak, User } from '../../types';
import { CHALLENGES } from './challenges';
import { seedDemo } from './seed';
import type { Store } from './index';

let n = 0;
const uid = (p: string) => `${p}_${Date.now().toString(36)}${(n++).toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

export class MemoryStore implements Store {
  kind = 'memory' as const;
  users = new Map<string, User & { password?: string }>();
  children = new Map<string, Child>();
  attempts = new Map<string, Attempt[]>(); // by childId
  badges = new Map<string, Badge[]>(); // by childId
  progress = new Map<string, OutcomeScores>();
  baseline = new Map<string, OutcomeScores>();
  streaks = new Map<string, Streak>();
  xp = new Map<string, number>();
  perms = new Map<string, Set<string>>(); // coachId -> profileIds
  assignments = new Map<string, Assignment>(); // profileId -> assignment (latest)

  constructor() {
    seedDemo(this);
  }

  async createUser(u: Omit<User, 'createdAt'> & { password: string }): Promise<User> {
    const user: User & { password?: string } = { ...u, createdAt: new Date().toISOString() };
    this.users.set(user.id, user);
    const { password: _p, ...safe } = user;
    return safe;
  }
  async getUserByEmail(email: string) {
    for (const u of this.users.values()) if (u.email.toLowerCase() === email.toLowerCase()) return u;
    return null;
  }
  async getUserById(id: string) {
    const u = this.users.get(id);
    if (!u) return null;
    const { password: _p, ...safe } = u;
    return safe;
  }

  async createChild(c: Omit<Child, 'id' | 'createdAt'>): Promise<Child> {
    const child: Child = { ...c, kind: c.kind || 'child', goals: c.goals || [], id: uid('c'), createdAt: new Date().toISOString() };
    this.children.set(child.id, child);
    this.progress.set(child.id, { stronger: 40, fitter: 40, faster: 40, champs: 40 });
    const today = new Date().toISOString().slice(0, 10);
    this.streaks.set(child.id, { childId: child.id, currentDays: 0, longestDays: 0, lastActiveDate: today });
    this.xp.set(child.id, 0);
    this.attempts.set(child.id, []);
    this.badges.set(child.id, []);
    return child;
  }
  async getChild(id: string) { return this.children.get(id) || null; }
  async listChildrenByParent(parentId: string) {
    return [...this.children.values()].filter((c) => c.parentId === parentId);
  }
  async updateChild(id: string, patch: Partial<Child>) {
    const c = this.children.get(id);
    if (!c) return null;
    const next = { ...c, ...patch, id: c.id };
    this.children.set(id, next);
    return next;
  }

  async getProgress(childId: string): Promise<OutcomeScores> {
    return this.progress.get(childId) || { stronger: 40, fitter: 40, faster: 40, champs: 40 };
  }
  async setProgress(childId: string, scores: OutcomeScores) {
    // First write also establishes the baseline for change indicators.
    if (!this.baseline.has(childId) && this.children.has(childId)) {
      const hasAttempts = (this.attempts.get(childId) || []).length > 0;
      if (!hasAttempts) this.baseline.set(childId, { ...scores });
    }
    this.progress.set(childId, { ...scores });
    return { ...scores };
  }
  async getBaseline(childId: string): Promise<OutcomeScores | null> {
    return this.baseline.get(childId) || null;
  }
  async setBaseline(childId: string, scores: OutcomeScores): Promise<void> {
    this.baseline.set(childId, { ...scores });
  }

  async listChallenges(): Promise<ChallengeDef[]> { return CHALLENGES; }
  async getChallenge(id: string) { return CHALLENGES.find((c) => c.id === id) || null; }

  async createAttempt(a: Omit<Attempt, 'id'> & { id?: string }): Promise<Attempt> {
    const attempt: Attempt = { ...a, id: a.id || uid('a'), createdAt: a.createdAt || new Date().toISOString() };
    const list = this.attempts.get(a.childId) || [];
    list.push(attempt);
    this.attempts.set(a.childId, list);
    return attempt;
  }
  async listAttempts(childId: string) {
    return [...(this.attempts.get(childId) || [])].sort((x, y) => x.createdAt.localeCompare(y.createdAt));
  }

  async awardBadge(childId: string, badgeName: string) {
    const list = this.badges.get(childId) || [];
    const existing = list.find((b) => b.badgeName === badgeName);
    if (existing) return { badge: existing, isNew: false };
    const badge: Badge = { id: uid('b'), childId, badgeName, earnedAt: new Date().toISOString() };
    list.push(badge);
    this.badges.set(childId, list);
    return { badge, isNew: true };
  }
  async listBadges(childId: string) { return [...(this.badges.get(childId) || [])]; }

  async getStreak(childId: string): Promise<Streak> {
    return this.streaks.get(childId) || { childId, currentDays: 0, longestDays: 0, lastActiveDate: new Date().toISOString().slice(0, 10) };
  }
  async setStreak(childId: string, s: Streak) {
    this.streaks.set(childId, { ...s });
    return { ...s };
  }

  async getXp(childId: string) { return this.xp.get(childId) || 0; }
  async addXp(childId: string, amount: number) {
    const total = (this.xp.get(childId) || 0) + amount;
    this.xp.set(childId, total);
    return total;
  }

  async resetDemo() {
    this.users.clear(); this.children.clear(); this.attempts.clear();
    this.badges.clear(); this.progress.clear(); this.baseline.clear();
    this.streaks.clear(); this.xp.clear(); this.perms.clear(); this.assignments.clear();
    seedDemo(this);
  }

  async grantCoachAccess(coachId: string, profileId: string): Promise<void> {
    const set = this.perms.get(coachId) || new Set<string>();
    set.add(profileId);
    this.perms.set(coachId, set);
  }
  async listAthleteIds(coachId: string): Promise<string[]> {
    return [...(this.perms.get(coachId) || [])];
  }
  async assignChallenge(a: Assignment): Promise<Assignment> {
    const full = { ...a, createdAt: new Date().toISOString() };
    this.assignments.set(a.profileId, full);
    return full;
  }
  async getAssignment(profileId: string): Promise<Assignment | null> {
    return this.assignments.get(profileId) || null;
  }
  async listAssignments(coachId: string): Promise<Assignment[]> {
    return [...this.assignments.values()].filter((a) => a.coachId === coachId);
  }
}
