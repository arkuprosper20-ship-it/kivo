import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../services/api';
import type { Child, ChildDetail, CompleteResult, OutcomeScores, User, ViewRole } from '../types';
import { isAdultProfile } from '../utils/age';

export type DemoPersona = 'child' | 'teen' | 'adult' | 'parent' | 'coach';

interface AppState {
  user: User | null;
  child: Child | null;
  children: Child[];
  detail: ChildDetail | null;
  scores: OutcomeScores | null;
  lastResult: CompleteResult | null;
  demoMode: boolean;
  viewRole: ViewRole;
  isAdult: boolean;
  loading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, dob: string, role?: string) => Promise<{ guardianRequired: boolean }>;
  signupParent: (name: string, email: string, password: string, dob: string) => Promise<void>;
  loginDemo: (persona?: DemoPersona) => Promise<void>;
  logout: () => void;
  selectChild: (childId: string) => Promise<void>;
  refresh: () => Promise<void>;
  refreshChildren: () => Promise<void>;
  setViewRole: (r: ViewRole) => void;
  setLastResult: (r: CompleteResult | null) => void;
  setScores: (s: OutcomeScores) => void;
}

const Ctx = createContext<AppState | null>(null);

const load = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const save = (k: string, v: string | null) => {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* noop */ }
};

export function AppProvider({ children: node }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [detail, setDetail] = useState<ChildDetail | null>(null);
  const [scores, setScores] = useState<OutcomeScores | null>(null);
  const [lastResult, setLastResult] = useState<CompleteResult | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [viewRole, setViewRoleState] = useState<ViewRole>('child');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const setViewRole = useCallback((r: ViewRole) => {
    setViewRoleState(r);
    save('kivo_view_role', r);
  }, []);

  const refresh = useCallback(async () => {
    const cid = load('kivo_child_id');
    if (!cid) return;
    const d = await api.get<ChildDetail>(`/children/${cid}`);
    setDetail(d); setChild(d.child); setScores(d.progress);
  }, []);

  const refreshChildren = useCallback(async () => {
    const u = load('kivo_user');
    if (!u) return;
    try {
      const parsed = JSON.parse(u) as User;
      const list = await api.get<{ children: Child[] }>(`/children?parentId=${parsed.id}`);
      setChildren(list.children);
    } catch { /* ignore */ }
  }, []);

  const restore = useCallback(async () => {
    const tok = load('kivo_token');
    const cid = load('kivo_child_id');
    const u = load('kivo_user');
    const dm = load('kivo_demo') === '1';
    const vr = (load('kivo_view_role') as ViewRole) || 'child';
    if (tok && u) {
      try { setUser(JSON.parse(u)); } catch { /* ignore */ }
      setDemoMode(dm);
      setViewRoleState(vr);
      if (cid) {
        try {
          const d = await api.get<ChildDetail>(`/children/${cid}`);
          setDetail(d); setChild(d.child); setScores(d.progress);
        } catch { /* backend may be down; keep session */ }
      }
      void refreshChildren();
    }
    setLoading(false);
  }, [refreshChildren]);

  useEffect(() => { void restore(); }, [restore]);

  const afterAuth = (u: User, c?: Child | null, s?: OutcomeScores | null, demo = false, vr?: ViewRole) => {
    setUser(u); save('kivo_user', JSON.stringify(u));
    setDemoMode(demo); save('kivo_demo', demo ? '1' : null);
    if (vr) { setViewRoleState(vr); save('kivo_view_role', vr); }
    if (c) { setChild(c); save('kivo_child_id', c.id); }
    if (s) setScores(s);
  };

  const applyLoginPayload = useCallback(async (r: { token: string; user: User; child?: Child | null; progress?: OutcomeScores | null; viewRole?: ViewRole; children?: Child[] }) => {
    save('kivo_token', r.token);
    afterAuth(r.user, r.child || null, r.progress || null, false, r.viewRole);
    if (r.children) setChildren(r.children);
    if (r.child) {
      const d = await api.get<ChildDetail>(`/children/${r.child.id}`);
      setDetail(d); setScores(d.progress);
    }
    void refreshChildren();
  }, [refreshChildren]);

  const login = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      const r = await api.post<{ token: string; user: User; child?: Child | null; progress?: OutcomeScores | null; viewRole?: ViewRole }>('/auth/login', { email, password });
      await applyLoginPayload(r);
    } catch (e: any) { setAuthError(e.message); throw e; }
  }, [applyLoginPayload]);

  const signup = useCallback(async (name: string, email: string, password: string, dob: string, role = 'individual') => {
    setAuthError(null);
    try {
      const r = await api.post<{ token: string; user: User }>('/auth/signup', { name, email, password, dob, role });
      save('kivo_token', r.token);
      const vr: ViewRole = r.user.role === 'coach' ? 'coach' : r.user.role === 'parent' ? 'parent' : 'individual';
      afterAuth(r.user, null, null, false, vr);
      return { guardianRequired: false };
    } catch (e: any) {
      if (e?.code === 403 || String(e?.message || '').includes('Guardian')) {
        return { guardianRequired: true };
      }
      setAuthError(e.message); throw e;
    }
  }, []);

  const signupParent = useCallback(async (name: string, email: string, password: string, dob: string) => {
    setAuthError(null);
    try {
      const r = await api.post<{ token: string; user: User }>('/auth/signup-parent', { name, email, password, dob });
      save('kivo_token', r.token);
      afterAuth(r.user, null, null, false, 'parent');
      setChildren([]);
    } catch (e: any) { setAuthError(e.message); throw e; }
  }, []);

  const loginDemo = useCallback(async (persona: DemoPersona = 'child') => {
    setAuthError(null);
    try {
      const r = await api.post<{ token: string; user: User; child: Child | null; children?: Child[]; progress: OutcomeScores | null; viewRole: ViewRole }>('/auth/demo', { persona });
      save('kivo_token', r.token);
      afterAuth(r.user, r.child, r.progress, true, r.viewRole);
      if (r.children) setChildren(r.children);
      else if (r.user.role === 'parent') void refreshChildren();
      if (r.child) {
        const d = await api.get<ChildDetail>(`/children/${r.child.id}`);
        setDetail(d); setScores(d.progress);
      } else {
        setDetail(null); setChild(null); setScores(null);
      }
    } catch (e: any) { setAuthError(e.message); throw e; }
  }, [refreshChildren]);

  const logout = useCallback(() => {
    setUser(null); setChild(null); setChildren([]); setDetail(null); setScores(null); setLastResult(null);
    setDemoMode(false); setAuthError(null);
    setViewRoleState('child');
    save('kivo_token', null); save('kivo_child_id', null); save('kivo_user', null); save('kivo_demo', null); save('kivo_view_role', null);
  }, []);

  const selectChild = useCallback(async (childId: string) => {
    const d = await api.get<ChildDetail>(`/children/${childId}`);
    setDetail(d); setChild(d.child); setScores(d.progress);
    save('kivo_child_id', childId);
  }, []);

  const isAdult = child ? isAdultProfile(child) : viewRole === 'individual' || viewRole === 'coach';

  const value = useMemo<AppState>(() => ({
    user, child, children, detail, scores, lastResult, demoMode, viewRole, isAdult,
    loading, authError, login, signup, signupParent, loginDemo, logout,
    selectChild, refresh, refreshChildren, setViewRole, setLastResult, setScores,
  }), [user, child, children, detail, scores, lastResult, demoMode, viewRole, isAdult, loading, authError, login, signup, signupParent, loginDemo, logout, selectChild, refresh, refreshChildren, setViewRole]);

  return <Ctx.Provider value={value}>{node}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}
