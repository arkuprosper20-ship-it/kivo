import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../../config';
import type { Attempt, Badge, ChallengeDef, Child, OutcomeScores, Streak, User } from '../../types';
import { CHALLENGES } from './challenges';
import type { Store } from './index';

/**
 * Supabase-backed store. Activates when SUPABASE_URL + SUPABASE_SERVICE_KEY are set.
 * Tables are created by database/schema.sql. Child-scoped reads keep data isolated.
 */
export class SupabaseStore implements Store {
  kind = 'supabase' as const;
  private sb: SupabaseClient;

  constructor() {
    this.sb = createClient(config.supabaseUrl, config.supabaseServiceKey);
  }

  async createUser(u: Omit<User, 'createdAt'> & { password: string }): Promise<User> {
    const { error } = await this.sb.from('users').insert({
      id: u.id, name: u.name, email: u.email, role: u.role, password_hash: `plain:${u.password}`,
    });
    if (error) throw new Error(`supabase createUser: ${error.message}`);
    return { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: new Date().toISOString() };
  }
  async getUserByEmail(email: string) {
    const { data, error } = await this.sb.from('users').select('*').ilike('email', email).limit(1).single();
    if (error || !data) return null;
    return { id: data.id, name: data.name, email: data.email, role: data.role, createdAt: data.created_at, password: String(data.password_hash || '').replace(/^plain:/, '') };
  }
  async getUserById(id: string) {
    const { data, error } = await this.sb.from('users').select('*').eq('id', id).single();
    if (error || !data) return null;
    return { id: data.id, name: data.name, email: data.email, role: data.role, createdAt: data.created_at };
  }

  async createChild(c: Omit<Child, 'id' | 'createdAt'>): Promise<Child> {
    const id = `c_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6)}`;
    const { error } = await this.sb.from('children').insert({
      id, parent_id: c.parentId, name: c.name, age: c.age, height: c.height,
      fitness_level: c.fitnessLevel, favorite_activities: c.favoriteActivities, avatar_color: c.avatarColor,
    });
    if (error) throw new Error(`supabase createChild: ${error.message}`);
    await this.sb.from('progress').upsert({ child_id: id, stronger_score: 40, fitter_score: 40, faster_score: 40, champs_score: 40 });
    return { ...c, id, createdAt: new Date().toISOString() };
  }
  private mapChild(r: any): Child {
    return { id: r.id, parentId: r.parent_id, name: r.name, age: r.age, height: r.height, fitnessLevel: r.fitness_level, favoriteActivities: r.favorite_activities || [], avatarColor: r.avatar_color || '#2563EB', createdAt: r.created_at };
  }
  async getChild(id: string) {
    const { data, error } = await this.sb.from('children').select('*').eq('id', id).single();
    if (error || !data) return null;
    return this.mapChild(data);
  }
  async listChildrenByParent(parentId: string) {
    const { data, error } = await this.sb.from('children').select('*').eq('parent_id', parentId);
    if (error) throw new Error(`supabase listChildren: ${error.message}`);
    return (data || []).map((r: any) => this.mapChild(r));
  }
  async updateChild(id: string, patch: Partial<Child>) {
    const upd: any = {};
    if (patch.name !== undefined) upd.name = patch.name;
    if (patch.age !== undefined) upd.age = patch.age;
    if (patch.height !== undefined) upd.height = patch.height;
    if (patch.fitnessLevel !== undefined) upd.fitness_level = patch.fitnessLevel;
    if (patch.favoriteActivities !== undefined) upd.favorite_activities = patch.favoriteActivities;
    const { error } = await this.sb.from('children').update(upd).eq('id', id);
    if (error) throw new Error(`supabase updateChild: ${error.message}`);
    return this.getChild(id);
  }

  async getProgress(childId: string): Promise<OutcomeScores> {
    const { data } = await this.sb.from('progress').select('*').eq('child_id', childId).single();
    if (!data) return { stronger: 40, fitter: 40, faster: 40, champs: 40 };
    return { stronger: data.stronger_score, fitter: data.fitter_score, faster: data.faster_score, champs: data.champs_score };
  }
  async setProgress(childId: string, scores: OutcomeScores) {
    const { error } = await this.sb.from('progress').upsert({
      child_id: childId, stronger_score: scores.stronger, fitter_score: scores.fitter,
      faster_score: scores.faster, champs_score: scores.champs, updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`supabase setProgress: ${error.message}`);
    return { ...scores };
  }

  async listChallenges(): Promise<ChallengeDef[]> { return CHALLENGES; }
  async getChallenge(id: string) { return CHALLENGES.find((c) => c.id === id) || null; }

  async createAttempt(a: Omit<Attempt, 'id'> & { id?: string }): Promise<Attempt> {
    const id = a.id || `a_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6)}`;
    const { error } = await this.sb.from('performance').insert({
      id, child_id: a.childId, challenge_id: a.challengeId, score: a.score,
      raw: a.raw, improvement: a.improvement, is_personal_best: a.isPersonalBest, xp_earned: a.xpEarned,
    });
    if (error) throw new Error(`supabase createAttempt: ${error.message}`);
    return { ...a, id, createdAt: a.createdAt || new Date().toISOString() };
  }
  async listAttempts(childId: string) {
    const { data, error } = await this.sb.from('performance').select('*').eq('child_id', childId).order('created_at', { ascending: true });
    if (error) throw new Error(`supabase listAttempts: ${error.message}`);
    return (data || []).map((r: any) => ({
      id: r.id, childId: r.child_id, challengeId: r.challenge_id, score: r.score, raw: r.raw,
      improvement: r.improvement || 0, isPersonalBest: !!r.is_personal_best, xpEarned: r.xp_earned || 0, createdAt: r.created_at,
    }));
  }

  async awardBadge(childId: string, badgeName: string) {
    const existing = await this.sb.from('badges').select('*').eq('child_id', childId).eq('badge_name', badgeName).limit(1).single();
    if (existing.data) {
      const b = existing.data;
      return { badge: { id: b.id, childId, badgeName, earnedAt: b.earned_at } as Badge, isNew: false };
    }
    const id = `b_${Date.now().toString(36)}${Math.floor(Math.random() * 1e6)}`;
    await this.sb.from('badges').insert({ id, child_id: childId, badge_name: badgeName });
    return { badge: { id, childId, badgeName, earnedAt: new Date().toISOString() }, isNew: true };
  }
  async listBadges(childId: string) {
    const { data } = await this.sb.from('badges').select('*').eq('child_id', childId);
    return (data || []).map((r: any) => ({ id: r.id, childId, badgeName: r.badge_name, earnedAt: r.earned_at }));
  }

  async getStreak(childId: string): Promise<Streak> {
    const { data } = await this.sb.from('streaks').select('*').eq('child_id', childId).single();
    if (!data) return { childId, currentDays: 0, longestDays: 0, lastActiveDate: new Date().toISOString().slice(0, 10) };
    return { childId, currentDays: data.current_days, longestDays: data.longest_days, lastActiveDate: data.last_active_date };
  }
  async setStreak(childId: string, s: Streak) {
    await this.sb.from('streaks').upsert({ child_id: childId, current_days: s.currentDays, longest_days: s.longestDays, last_active_date: s.lastActiveDate });
    return { ...s };
  }

  async getXp(childId: string) {
    const { data } = await this.sb.from('xp').select('total').eq('child_id', childId).single();
    return data?.total || 0;
  }
  async addXp(childId: string, amount: number) {
    const total = (await this.getXp(childId)) + amount;
    await this.sb.from('xp').upsert({ child_id: childId, total });
    return total;
  }

  async resetDemo(): Promise<void> { /* no-op on shared DB */ }
}
