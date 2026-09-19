import type { Role, User } from '../types';
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

export async function signup(name: string, email: string, password: string, role: Role) {
  const store = getStore();
  const existing = await store.getUserByEmail(email);
  if (existing) throw Object.assign(new Error('Email already registered'), { status: 409 });
  const user = await store.createUser({ id: uid('u'), name, email, role, password });
  return { token: issueToken(user.id), user };
}

export async function login(email: string, password: string) {
  const store = getStore();
  const found = await store.getUserByEmail(email);
  if (!found || found.password !== password) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401 });
  }
  const user: User = { id: found.id, name: found.name, email: found.email, role: found.role, createdAt: found.createdAt };
  return { token: issueToken(user.id), user };
}

/** One-click demo login: returns the demo parent + Aarav + progress. */
export async function demoLogin() {
  const store = getStore();
  const user = await store.getUserById('u_demo_parent');
  if (!user) throw Object.assign(new Error('Demo data not available'), { status: 500 });
  const child = await store.getChild('c_aarav');
  const progress = await store.getProgress('c_aarav');
  return { token: issueToken(user.id), user, child, progress };
}
