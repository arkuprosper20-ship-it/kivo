import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KivoLogo from '../components/KivoLogo';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { Child } from '../types';

const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];
const ACTIVITIES = ['Football', 'Cycling', 'Swimming', 'Running', 'Basketball', 'Dance', 'Gymnastics', 'Cricket'];

export default function Onboarding() {
  const { user, selectChild } = useApp();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [age, setAge] = useState(10);
  const [height, setHeight] = useState(132);
  const [fitnessLevel, setFitnessLevel] = useState('Beginner');
  const [favs, setFavs] = useState<string[]>(['Football']);
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = (a: string) => setFavs((f) => (f.includes(a) ? f.filter((x) => x !== a) : [...f, a].slice(0, 5)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { nav('/signup'); return; }
    setBusy(true); setError(null);
    try {
      const r = await api.post<{ child: Child }>('/children', {
        parentId: user.id, name, age, height, fitnessLevel, favoriteActivities: favs, avatarColor: color,
      });
      await selectChild(r.child.id);
      nav('/assessment');
    } catch (err: any) { setError(err?.message || 'Could not create profile'); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="text-center"><KivoLogo /></div>
      <h1 className="mt-4 text-center font-display text-3xl font-extrabold">Create child profile</h1>
      <form onSubmit={submit} className="kivo-card mt-6 space-y-4">
        <div>
          <label className="kivo-label" htmlFor="cname">First name</label>
          <input id="cname" className="kivo-input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} placeholder="e.g. Aarav" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="kivo-label" htmlFor="age">Age (5–16)</label>
            <input id="age" className="kivo-input" type="number" min={5} max={16} value={age} onChange={(e) => setAge(Number(e.target.value))} required />
          </div>
          <div>
            <label className="kivo-label" htmlFor="height">Height (cm)</label>
            <input id="height" className="kivo-input" type="number" min={80} max={200} value={height} onChange={(e) => setHeight(Number(e.target.value))} required />
          </div>
        </div>
        <div>
          <label className="kivo-label" htmlFor="level">Current activity level</label>
          <select id="level" className="kivo-input" value={fitnessLevel} onChange={(e) => setFitnessLevel(e.target.value)}>
            <option>Beginner</option><option>Active</option><option>Sporty</option>
          </select>
        </div>
        <div>
          <span className="kivo-label">Favorite activities</span>
          <div className="flex flex-wrap gap-2">
            {ACTIVITIES.map((a) => (
              <button key={a} type="button" onClick={() => toggle(a)} aria-pressed={favs.includes(a)}
                className={`rounded-full px-4 py-2 text-sm font-bold ${favs.includes(a) ? 'bg-kivo-600 text-white' : 'bg-mist text-slate-600'}`}>
                {a}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="kivo-label">Avatar color</span>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} aria-label={`Color ${c}`}
                className={`h-10 w-10 rounded-full ${color === c ? 'ring-4 ring-offset-2 ring-kivo-300' : ''}`} style={{ background: c }} />
            ))}
          </div>
        </div>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600" role="alert">{error}</p>}
        <button className="kivo-btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Start assessment →'}</button>
      </form>
    </div>
  );
}
