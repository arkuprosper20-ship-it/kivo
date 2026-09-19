import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../services/api';
import type { Child, ChildDetail, CompleteResult, OutcomeScores, User } from '../types';

interface AppState {
  user: User | null;
  child: Child | null;
  detail: ChildDetail | null;
  scores: OutcomeScores | null;
  lastResult: CompleteResult | null;
  demoMode: boolean;
  loading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: User['role']) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => void;
  selectChild: (childId: string) => Promise<void>;
  refresh: () => Promise<void>;
  setLastResult: (r: CompleteResult | null) => void;
  setScores: (s: OutcomeScores) => void;
}

const Ctx = createContext<AppState | null>(null);

const load = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const save = (k: string, v: string | null) => {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* noop */ }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [detail, setDetail] = useState<ChildDetail | null>(null);
  const [scores, setScores] = useState<OutcomeScores | null>(null);
  const [lastResult, setLastResult] = useState<CompleteResult | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const cid = load('kivo_child_id');
    if (!cid) return;
    const d = await api.get<ChildDetail>(`/children/${cid}`);
    setDetail(d); setChild(d.child); setScores(d.progress);
  }, []);

  const restore = useCallback(async () => {
    const tok = load('kivo_token');
    const cid = load('kivo_child_id');
    const u = load('kivo_user');
    const dm = load('kivo_demo') === '1';
    if (tok && u) {
      try { setUser(JSON.parse(u)); } catch { /* ignore */ }
      setDemoMode(dm);
      if (cid) {
        try {
          const d = await api.get<ChildDetail>(`/children/${cid}`);
          setDetail(d); setChild(d.child); setScores(d.progress);
        } catch { /* backend may be down; keep session */ }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { void restore(); }, [restore]);

  const afterAuth = (u: User, c?: Child | null, s?: OutcomeScores | null, demo = false) => {
    setUser(u); save('kivo_user', JSON.stringify(u));
    setDemoMode(demo); save('kivo_demo', demo ? '1' : null);
    if (c) { setChild(c); save('kivo_child_id', c.id); }
    if (s) setScores(s);
  };

  const login = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      const r = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
      save('kivo_token', r.token);
      afterAuth(r.user, null, null, false);
      const list = await api.get<{ children: Child[] }>(`/children?parentId=${r.user.id}`);
      if (list.children.length) {
        const d = await api.get<ChildDetail>(`/children/${list.children[0].id}`);
        afterAuth(r.user, d.child, d.progress, false);
        setDetail(d);
      }
    } catch (e: any) { setAuthError(e.message); throw e; }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, role: User['role']) => {
    setAuthError(null);
    try {
      const r = await api.post<{ token: string; user: User }>('/auth/signup', { name, email, password, role });
      save('kivo_token', r.token);
      afterAuth(r.user, null, null, false);
    } catch (e: any) { setAuthError(e.message); throw e; }
  }, []);

  const loginDemo = useCallback(async () => {
    setAuthError(null);
    try {
      const r = await api.post<{ token: string; user: User; child: Child; progress: OutcomeScores }>('/auth/demo');
      save('kivo_token', r.token);
      afterAuth(r.user, r.child, r.progress, true);
      const d = await api.get<ChildDetail>(`/children/${r.child.id}`);
      setDetail(d); setScores(d.progress);
    } catch (e: any) { setAuthError(e.message); throw e; }
  }, []);

  const logout = useCallback(() => {
    setUser(null); setChild(null); setDetail(null); setScores(null); setLastResult(null);
    setDemoMode(false); setAuthError(null);
    save('kivo_token', null); save('kivo_child_id', null); save('kivo_user', null); save('kivo_demo', null);
  }, []);

  const selectChild = useCallback(async (childId: string) => {
    const d = await api.get<ChildDetail>(`/children/${childId}`);
    setDetail(d); setChild(d.child); setScores(d.progress);
    save('kivo_child_id', childId);
  }, []);

  const value = useMemo<AppState>(() => ({
    user, child, detail, scores, lastResult, demoMode, loading, authError,
    login, signup, loginDemo, logout, selectChild, refresh, setLastResult, setScores,
  }), [user, child, detail, scores, lastResult, demoMode, loading, authError, login, signup, loginDemo, logout, selectChild, refresh]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}
