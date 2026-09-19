import type { Role, User, ViewRole } from '../types';
import { ageFromDob } from '../utils/age';
import { getStore } from './store/getStore';

const sessions = new Map<string, string>(); // token -> userId
let n = 0;
const uid = (p: string) => `${p}_${Date.now().toString(36)}${(n++).toString(36)}`;

export function issueToken(userId: string): string {
  const token = `kivo_${userId}_${uid('t')}`;
  sessions.set(token, userId);
  return token;
}

export function userIdForToken(token: string | undefined): string | null {
  if (!token) return null;
  return sessions.get(token) || null;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  dob?: string; // YYYY-MM-DD
  role?: Role | 'child';
}

/**
 * DOB-driven classification:
 * - age < 16 (non-coach) -> GUARDIAN_REQUIRED (parent must create the account)
 * - coach role -> professional account
 * - 16+ -> independent account
 */
export async function signup(input: SignupInput) {
  const store = getStore();
  const { name, email, password } = input;
  let role = input.role || 'individual';
  if (role === 'child') role = 'individual'; // legacy clients: re-classified by DOB below

  const existing = await store.getUserByEmail(email);
  if (existing) throw Object.assign(new Error('Email already registered'), { status: 409 });

  if (role !== 'coach') {
    const age = ageFromDob(input.dob, 16);
    if (!input.dob || age < 16) {
      throw Object.assign(new Error('Guardian required for under-16 accounts'), {
        status: 403, code: 'GUARDIAN_REQUIRED',
      });
    }
    role = role === 'parent' ? 'parent' : 'individual';
  }

  const user = await store.createUser({ id: uid('u'), name, email, role: role as Role, dob: input.dob, password });
  return { token: issueToken(user.id), user };
}

/** A parent account (always allowed) — used by the guardian flow. */
export async function signupParent(name: string, email: string, password: string, dob?: string) {
  const store = getStore();
  const existing = await store.getUserByEmail(email);
  if (existing) throw Object.assign(new Error('Email already registered'), { status: 409 });
  const user = await store.createUser({ id: uid('u'), name, email, role: 'parent', dob, password });
  return { token: issueToken(user.id), user };
}

export async function login(email: string, password: string) {
  const store = getStore();
  const found = await store.getUserByEmail(email);
  if (!found || found.password !== password) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }
  const user: User = { id: found.id, name: found.name, email: found.email, role: found.role, dob: found.dob, createdAt: found.createdAt };
  return { token: issueToken(user.id), user };
}

export type DemoPersona = 'child' | 'teen' | 'adult' | 'parent' | 'coach';

/**
 * One-click demo personas:
 * child  -> Aarav (10, parent-managed), child UI
 * teen   -> Riya (17, independent), individual UI
 * adult  -> Alex (28, independent), individual UI
 * parent -> Demo Parent + children, parent UI
 * coach  -> Demo Coach + athletes, coach UI
 */
export async function demoLogin(persona: DemoPersona = 'child') {
  const store = getStore();
  const tokenFor = (userId: string) => issueToken(userId);

  if (persona === 'teen') {
    const user = await store.getUserById('u_riya');
    if (!user) throw Object.assign(new Error('Demo data not available'), { status: 500 });
    const child = await store.getChild('c_riya');
    const progress = await store.getProgress('c_riya');
    return { token: tokenFor(user.id), user, child, progress, viewRole: 'individual' as ViewRole };
  }
  if (persona === 'adult') {
    const user = await store.getUserById('u_alex');
    if (!user) throw Object.assign(new Error('Demo data not available'), { status: 500 });
    const child = await store.getChild('c_alex');
    const progress = await store.getProgress('c_alex');
    return { token: tokenFor(user.id), user, child, progress, viewRole: 'individual' as ViewRole };
  }
  if (persona === 'coach') {
    const user = await store.getUserById('u_coach');
    if (!user) throw Object.assign(new Error('Demo data not available'), { status: 500 });
    return { token: tokenFor(user.id), user, child: null, progress: null, viewRole: 'coach' as ViewRole };
  }
  if (persona === 'parent') {
    const user = await store.getUserById('u_demo_parent');
    if (!user) throw Object.assign(new Error('Demo data not available'), { status: 500 });
    const children = await store.listChildrenByParent(user.id);
    const active = children.find((c) => c.id === 'c_aarav') || children[0];
    const progress = active ? await store.getProgress(active.id) : null;
    return { token: tokenFor(user.id), user, child: active || null, children, progress, viewRole: 'parent' as ViewRole };
  }
  // default: child persona (Aarav)
  const user = await store.getUserById('u_demo_parent');
  if (!user) throw Object.assign(new Error('Demo data not available'), { status: 500 });
  const child = await store.getChild('c_aarav');
  const progress = await store.getProgress('c_aarav');
  return { token: tokenFor(user.id), user, child, progress, viewRole: 'child' as ViewRole };
}
