import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GoalSelect from '../components/GoalSelect';
import KivoLogo from '../components/KivoLogo';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { Child } from '../types';
import { ageFromDob } from '../utils/age';

const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];
const ACTIVITIES = ['Football', 'Cycling', 'Swimming', 'Running', 'Basketball', 'Dance', 'Gymnastics', 'Cricket'];

/**
 * Unified onboarding:
 * - parent/guardian -> create child profile(s) with DOB + goals (can add multiple)
 * - individual 16+ -> own goals + fitness level, profile auto-created
 */
export default function Onboarding() {
  const { user, selectChild, refreshChildren, children } = useApp();
  const nav = useNavigate();
  const isParent = user?.role === 'parent';

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [height, setHeight] = useState(140);
  const [fitnessLevel, setFitnessLevel] = useState('Beginner');
  const [favs, setFavs] = useState<string[]>(['Football']);
  const [goals, setGoals] = useState<string[]>(['overall']);
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const age = dob ? ageFromDob(dob, -1) : null;
  const toggle = (a: string) => setFavs((f) => (f.includes(a) ? f.filter((x) => x !== a) : [...f, a].slice(0, 5)));

  const submit = async (e: React.FormEvent, addAnother: boolean) => {
    e.preventDefault();
    if (!user) { nav('/signup'); return; }
    setBusy(true); setError(null);
    try {
      if (isParent) {
        const r = await api.post<{ child: Child }>('/children', {
          parentId: user.id, name, dob, height, fitnessLevel,
          favoriteActivities: favs, goals, avatarColor: color, kind: 'child',
        });
        await refreshChildren();
        await selectChild(r.child.id);
        if (addAnother) {
          setName(''); setDob(''); setGoals(['overall']);
        } else {
          nav('/assessment');
        }
      } else {
        // independent 16+: profile owned by self
        const r = await api.post<{ child: Child }>('/children', {
          parentId: user.id, ownerUserId: user.id, name: name || user.name, dob,
          height, fitnessLevel, favoriteActivities: favs, goals, avatarColor: color, kind: 'individual',
        });
        await refreshChildren();
        await selectChild(r.child.id);
        nav('/assessment');
      }
    } catch (err: any) { setError(err?.message || 'Could not create profile'); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="text-center"><KivoLogo /></div>
      <h1 className="mt-4 text-center font-display text-3xl font-extrabold">
        {isParent ? 'Create child profile' : 'Create your athlete profile'}
      </h1>
      <p className="mt-1 text-center text-sm text-slate-500">
        {isParent ? 'Only a name, birth date and goals — nothing sensitive.' : 'Tell KIVO your goals so coaching adapts to you.'}
      </p>
      {isParent && children.length > 0 && (
        <p className="mt-3 rounded-2xl bg-kivo-50 p-3 text-center text-sm font-bold text-kivo-700" role="status">
          My children so far: {children.map((c) => c.name).join(' · ')}
        </p>
      )}
      <form className="kivo-card mt-5 space-y-4" onSubmit={(e) => void submit(e, false)}>
        <div>
          <label className="kivo-label" htmlFor="cname">{isParent ? 'Child’s first name' : 'Display name'}</label>
          <input id="cname" className="kivo-input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} placeholder={isParent ? 'e.g. Aarav' : user?.name || 'e.g. Alex'} />
        </div>
        <div>
          <label className="kivo-label" htmlFor="cdob">Date of birth</label>
          <input id="cdob" className="kivo-input" type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDob(e.target.value)} required />
          {age !== null && age >= 0 && (
            <p className="mt-1.5 text-sm font-semibold text-slate-500" role="status">
              Age {age}{isParent && age >= 16 ? ' — note: 16+ athletes manage their own account' : ''}.
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="kivo-label" htmlFor="height">Height (cm)</label>
            <input id="height" className="kivo-input" type="number" min={80} max={220} value={height} onChange={(e) => setHeight(Number(e.target.value))} required />
          </div>
          <div>
            <label className="kivo-label" htmlFor="level">Fitness experience</label>
            <select id="level" className="kivo-input" value={fitnessLevel} onChange={(e) => setFitnessLevel(e.target.value)}>
              <option>Beginner</option><option>Active</option><option>Sporty</option>
            </select>
          </div>
        </div>
        <GoalSelect value={goals} onChange={setGoals} />
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
        {isParent && (
          <button type="button" className="w-full text-center text-sm font-bold text-kivo-600 hover:underline" disabled={busy}
            onClick={(e) => void submit(e as unknown as React.FormEvent, true)}>
            + Save and add another child
          </button>
        )}
      </form>
    </div>
  );
}

/** Coach professional profile setup. */
export function OnboardingCoach() {
  const { user, setViewRole } = useApp();
  const nav = useNavigate();
  const [spec, setSpec] = useState('Youth athletics');
  const [busy, setBusy] = useState(false);

  const go = () => {
    setBusy(true);
    try { localStorage.setItem('kivo_coach_spec', spec); } catch { /* noop */ }
    setViewRole('coach');
    nav('/coach-dash');
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="text-center"><KivoLogo /></div>
      <h1 className="mt-4 text-center font-display text-3xl font-extrabold">Coach profile</h1>
      <p className="mt-1 text-center text-sm text-slate-500">
        {user ? `Welcome, ${user.name}. ` : ''}You can only view athletes who explicitly grant you access.
      </p>
      <div className="kivo-card mt-5 space-y-4">
        <div>
          <label className="kivo-label" htmlFor="spec">Specialization</label>
          <select id="spec" className="kivo-input" value={spec} onChange={(e) => setSpec(e.target.value)}>
            <option>Youth athletics</option><option>Speed & agility</option><option>Endurance</option><option>Strength</option><option>School sports</option>
          </select>
        </div>
        <button className="kivo-btn-primary w-full" disabled={busy} onClick={go}>Open coach dashboard →</button>
      </div>
    </div>
  );
}
