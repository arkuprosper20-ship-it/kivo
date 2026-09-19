import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChildProfileCard from '../components/ChildProfileCard';
import { useApp } from '../context/AppContext';
import { API_BASE, api } from '../services/api';

export default function Settings() {
  const { child, user, logout, refresh, demoMode } = useApp();
  const nav = useNavigate();
  const [name, setName] = useState(child?.name || '');
  const [age, setAge] = useState(child?.age || 10);
  const [height, setHeight] = useState(child?.height || 132);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!child) return;
    setBusy(true); setMsg(null);
    try {
      await api.put(`/children/${child.id}`, { name, age, height });
      await refresh();
      setMsg('Profile saved ✅');
    } catch (err: any) { setMsg(err?.message || 'Save failed'); }
    finally { setBusy(false); }
  };

  const ping = async () => {
    try { await api.get('/health'); setApiOk(true); }
    catch { setApiOk(false); }
  };

  const resetDemo = async () => {
    if (!confirm('Reset the demo back to Aarav’s starting week?')) return;
    try {
      await api.post('/demo/reset');
      await refresh();
      setMsg('Demo reset ✅');
    } catch (err: any) { setMsg(err?.message || 'Reset failed'); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-3xl font-extrabold">Settings ⚙️</h1>
      {child && <ChildProfileCard child={child} />}

      <form onSubmit={save} className="kivo-card space-y-4">
        <h2 className="font-display text-xl font-extrabold">Athlete profile</h2>
        <div>
          <label className="kivo-label" htmlFor="sname">First name</label>
          <input id="sname" className="kivo-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="kivo-label" htmlFor="sage">Age</label>
            <input id="sage" className="kivo-input" type="number" min={5} max={16} value={age} onChange={(e) => setAge(Number(e.target.value))} />
          </div>
          <div>
            <label className="kivo-label" htmlFor="sheight">Height (cm)</label>
            <input id="sheight" className="kivo-input" type="number" min={80} max={200} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
          </div>
        </div>
        {msg && <p className="text-sm font-bold text-kivo-700" role="status">{msg}</p>}
        <button className="kivo-btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
      </form>

      <div className="kivo-card space-y-3">
        <h2 className="font-display text-xl font-extrabold">Connection</h2>
        <p className="text-sm text-slate-600">Signed in as <strong>{user?.name}</strong> ({user?.role}){demoMode ? ' · Demo mode' : ''}</p>
        <p className="break-all text-xs text-slate-400">API: {API_BASE}</p>
        <div className="flex flex-wrap gap-2">
          <button className="kivo-btn-ghost !min-h-[44px] !py-2 text-sm" onClick={ping}>Check server</button>
          {demoMode && <button className="kivo-btn-ghost !min-h-[44px] !py-2 text-sm" onClick={resetDemo}>Reset demo data</button>}
          <button className="kivo-btn-ghost !min-h-[44px] !py-2 text-sm !text-red-600" onClick={() => { logout(); nav('/'); }}>Log out</button>
        </div>
        {apiOk !== null && (
          <p className={`text-sm font-bold ${apiOk ? 'text-green-600' : 'text-red-600'}`} role="status">
            {apiOk ? '✅ Server reachable' : '❌ Server unreachable — start the backend with npm run dev:backend'}
          </p>
        )}
      </div>

      <div className="kivo-card">
        <h2 className="font-display text-xl font-extrabold">Accessibility</h2>
        <p className="mt-1 text-sm text-slate-600">
          KIVO respects your OS <strong>reduced-motion</strong> setting (animations auto-minimize),
          uses large touch targets, keyboard controls (1–6, spacebar) and screen-reader labels.
        </p>
      </div>
    </div>
  );
}
