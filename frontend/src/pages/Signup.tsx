import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import KivoLogo from '../components/KivoLogo';
import { useApp } from '../context/AppContext';
import { ageFromDob } from '../utils/age';

export default function Signup() {
  const { signup, loginDemo } = useApp();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCoach, setIsCoach] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const age = dob ? ageFromDob(dob, -1) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const r = await signup(name, email, password, dob, isCoach ? 'coach' : 'individual');
      if (r.guardianRequired) {
        nav('/guardian-required', { state: { name, dob } });
        return;
      }
      nav(isCoach ? '/onboarding-coach' : '/onboarding');
    } catch (err: any) { setError(err?.message || 'Signup failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="text-center"><KivoLogo /></div>
      <h1 className="mt-6 text-center font-display text-3xl font-extrabold">Create your KIVO account</h1>
      <p className="mt-1 text-center text-sm text-slate-500">Your age determines your account type — automatically.</p>

      <form onSubmit={submit} className="kivo-card mt-5 space-y-4">
        <div>
          <label className="kivo-label" htmlFor="name">Full name</label>
          <input id="name" className="kivo-input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} />
        </div>
        <div>
          <label className="kivo-label" htmlFor="dob">Date of birth</label>
          <input id="dob" className="kivo-input" type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDob(e.target.value)} required />
          {age !== null && age >= 0 && (
            <p className={`mt-1.5 rounded-xl p-2.5 text-sm font-semibold ${age < 16 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`} role="status">
              {age < 16
                ? `Age ${age}: a parent or guardian needs to create and manage your KIVO profile.`
                : `Age ${age}: you can create your own KIVO profile.`}
            </p>
          )}
        </div>
        <div>
          <label className="kivo-label" htmlFor="email">Email</label>
          <input id="email" className="kivo-input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="kivo-label" htmlFor="password">Password</label>
          <input id="password" className="kivo-input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4} />
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-mist p-3 text-sm font-semibold">
          <input type="checkbox" checked={isCoach} onChange={(e) => setIsCoach(e.target.checked)} className="h-5 w-5 accent-kivo-600" />
          Are you a Coach or Trainer? (professional account)
        </label>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600" role="alert">{error}</p>}
        <button className="kivo-btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Continue →'}</button>
        <button type="button" className="w-full text-center text-sm font-bold text-kivo-600 hover:underline" disabled={busy}
          onClick={async () => { try { await loginDemo('child'); nav('/dashboard'); } catch (err: any) { setError(err?.message); } }}>
          or skip — explore a demo persona
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Have an account? <Link to="/login" className="font-bold text-kivo-600 hover:underline">Log in</Link>
      </p>
    </div>
  );
}

/** Shown when DOB classifies the user as under 16. */
export function GuardianRequired() {
  const nav = useNavigate();
  return (
    <div className="mx-auto max-w-md px-4 py-14 text-center">
      <p className="text-6xl" aria-hidden="true">👨‍👩‍👧</p>
      <h1 className="mt-4 font-display text-3xl font-extrabold">You're under 16</h1>
      <p className="mt-2 text-slate-600">
        A parent or guardian needs to create and manage your KIVO profile.
        This keeps your training safe and private.
      </p>
      <button className="kivo-btn-primary mt-6 w-full" onClick={() => nav('/parent-signup')}>
        Continue with parent / guardian →
      </button>
      <button className="mt-3 w-full text-center text-sm font-bold text-kivo-600 hover:underline" onClick={() => nav('/signup')}>
        ← Back
      </button>
    </div>
  );
}

/** Parent/guardian account creation for the under-16 flow. */
export function ParentSignup() {
  const { signupParent, loginDemo } = useApp();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await signupParent(name, email, password, dob);
      nav('/onboarding');
    } catch (err: any) { setError(err?.message || 'Signup failed'); }
    finally { setBusy(false); }
  };

  const demoParent = async () => {
    try { await loginDemo('parent'); nav('/parent'); } catch (err: any) { setError(err?.message); }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="text-center"><KivoLogo /></div>
      <h1 className="mt-6 text-center font-display text-3xl font-extrabold">Parent / Guardian setup</h1>
      <p className="mt-1 text-center text-sm text-slate-500">Create your account first — then add your children's profiles.</p>
      <form onSubmit={submit} className="kivo-card mt-5 space-y-4">
        <div>
          <label className="kivo-label" htmlFor="pname">Your name</label>
          <input id="pname" className="kivo-input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="kivo-label" htmlFor="pdob">Your date of birth</label>
          <input id="pdob" className="kivo-input" type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDob(e.target.value)} required />
        </div>
        <div>
          <label className="kivo-label" htmlFor="pemail">Email</label>
          <input id="pemail" className="kivo-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="kivo-label" htmlFor="ppass">Password</label>
          <input id="ppass" className="kivo-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={4} />
        </div>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600" role="alert">{error}</p>}
        <button className="kivo-btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Create parent account →'}</button>
        <button type="button" className="w-full text-center text-sm font-bold text-kivo-600 hover:underline" onClick={demoParent}>
          or preview as Demo Parent
        </button>
      </form>
    </div>
  );
}
