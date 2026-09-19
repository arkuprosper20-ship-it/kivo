import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import KivoLogo from '../components/KivoLogo';
import { useApp } from '../context/AppContext';
import type { User } from '../types';

const ROLES: Array<{ id: User['role']; icon: string; label: string; hint: string }> = [
  { id: 'parent', label: 'Parent', icon: '👨‍👩‍👧', hint: 'Track my child’s progress' },
  { id: 'child', label: 'Child', icon: '🧒', hint: 'I want to train & play' },
  { id: 'coach', label: 'Coach / Teacher', icon: '📋', hint: 'Guide young athletes' },
];

export default function Signup() {
  const { signup, loginDemo } = useApp();
  const nav = useNavigate();
  const [role, setRole] = useState<User['role']>('parent');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await signup(name, email, password, role);
      nav('/role-selection');
    } catch (err: any) { setError(err?.message || 'Signup failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="text-center"><KivoLogo /></div>
      <h1 className="mt-6 text-center font-display text-3xl font-extrabold">Who are you?</h1>
      <div className="mt-5 grid grid-cols-3 gap-3" role="radiogroup" aria-label="Choose your role">
        {ROLES.map((r) => (
          <button
            key={r.id} type="button" role="radio" aria-checked={role === r.id}
            onClick={() => setRole(r.id)}
            className={`rounded-3xl border-2 p-3 text-center transition-all ${role === r.id ? 'border-kivo-600 bg-kivo-50 shadow-pop' : 'border-slate-200 bg-white'}`}
          >
            <p className="text-3xl" aria-hidden="true">{r.icon}</p>
            <p className="mt-1 font-display text-sm font-extrabold">{r.label}</p>
            <p className="text-[11px] text-slate-500">{r.hint}</p>
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="kivo-card mt-4 space-y-4">
        <div>
          <label className="kivo-label" htmlFor="name">Your name</label>
          <input id="name" className="kivo-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="kivo-label" htmlFor="email">Email</label>
          <input id="email" className="kivo-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="kivo-label" htmlFor="password">Password</label>
          <input id="password" className="kivo-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4} />
        </div>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600" role="alert">{error}</p>}
        <button className="kivo-btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <button type="button" className="w-full text-center text-sm font-bold text-kivo-600 hover:underline" disabled={busy}
          onClick={async () => { try { await loginDemo(); nav('/dashboard'); } catch (err: any) { setError(err?.message); } }}>
          or skip — continue as Demo
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Have an account? <Link to="/login" className="font-bold text-kivo-600 hover:underline">Log in</Link>
      </p>
    </div>
  );
}
