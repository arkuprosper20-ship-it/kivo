import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import KivoLogo from '../components/KivoLogo';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login, loginDemo } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState('demo@kivo.app');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await login(email, password);
      nav('/dashboard');
    } catch (err: any) {
      if (err?.message?.includes?.('Cannot reach')) { setError(err.message); }
      else setError(err?.message || 'Login failed');
    } finally { setBusy(false); }
  };

  const demo = async () => {
    setBusy(true); setError(null);
    try { await loginDemo(); nav('/dashboard'); }
    catch (err: any) { setError(err?.message || 'Demo login failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="text-center"><KivoLogo /></div>
      <h1 className="mt-6 text-center font-display text-3xl font-extrabold">Welcome back!</h1>
      <form onSubmit={submit} className="kivo-card mt-6 space-y-4">
        <div>
          <label className="kivo-label" htmlFor="email">Email</label>
          <input id="email" className="kivo-input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="kivo-label" htmlFor="password">Password</label>
          <input id="password" className="kivo-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600" role="alert">{error}</p>}
        <button className="kivo-btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <button type="button" className="kivo-btn-ghost w-full" onClick={demo} disabled={busy}>Continue as Demo</button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        New here? <Link to="/signup" className="font-bold text-kivo-600 hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
