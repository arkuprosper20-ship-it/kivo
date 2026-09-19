import { ArrowRight, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import GoalSelect from '../components/GoalSelect';
import { ErrorState, Spinner } from '../components/ScoreCard';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { Child } from '../types';
import { ageFromDob, ageOfProfile } from '../utils/age';

/** Parent's children manager: view, switch, and add child profiles. */
export default function Children() {
  const { user, children, child, selectChild, refreshChildren } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState('Beginner');
  const [goals, setGoals] = useState<string[]>(['overall']);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { void refreshChildren(); }, []);

  const age = dob ? ageFromDob(dob, -1) : null;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true); setError(null);
    try {
      const r = await api.post<{ child: Child }>('/children', {
        parentId: user.id, name, dob, fitnessLevel, goals, kind: 'child',
      });
      await refreshChildren();
      await selectChild(r.child.id);
      setShowAdd(false);
      setName(''); setDob(''); setGoals(['overall']);
    } catch (err: any) { setError(err?.message || 'Could not add child'); }
    finally { setBusy(false); }
  };

  if (!user) return <Spinner label="Loading…" />;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold">My children 👨‍👩‍👧</h1>
          <p className="mt-1 font-semibold text-slate-500">Each child has separate scores, XP, badges and coaching.</p>
        </div>
        <button className="kivo-btn-primary !px-4 !py-2.5 text-sm" onClick={() => setShowAdd((s) => !s)} aria-expanded={showAdd}>
          <Plus size={16} aria-hidden="true" /> Add
        </button>
      </div>

      {error && <div className="kivo-card"><ErrorState message={error} onRetry={() => setError(null)} /></div>}

      {showAdd && (
        <form onSubmit={add} className="kivo-card space-y-4">
          <h2 className="font-display text-xl font-extrabold">New child profile</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="kivo-label" htmlFor="nc-name">First name</label>
              <input id="nc-name" className="kivo-input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={40} />
            </div>
            <div>
              <label className="kivo-label" htmlFor="nc-dob">Date of birth</label>
              <input id="nc-dob" className="kivo-input" type="date" value={dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDob(e.target.value)} required />
            </div>
          </div>
          {age !== null && age >= 0 && <p className="text-sm font-semibold text-slate-500">Age {age}.</p>}
          <div>
            <label className="kivo-label" htmlFor="nc-level">Fitness experience</label>
            <select id="nc-level" className="kivo-input" value={fitnessLevel} onChange={(e) => setFitnessLevel(e.target.value)}>
              <option>Beginner</option><option>Active</option><option>Sporty</option>
            </select>
          </div>
          <GoalSelect value={goals} onChange={setGoals} />
          <button className="kivo-btn-primary w-full" disabled={busy}>{busy ? 'Adding…' : 'Add child →'}</button>
        </form>
      )}

      <div className="space-y-3">
        {children.map((c) => (
          <div key={c.id} className="kivo-card flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl font-display text-2xl font-extrabold text-white"
              style={{ background: c.avatarColor }} aria-hidden="true">
              {c.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl font-extrabold">{c.name}</p>
              <p className="text-sm font-semibold text-slate-500">
                Age {ageOfProfile(c)} · {c.fitnessLevel}{(c.goals || []).length > 0 && ` · Goals: ${c.goals.join(', ')}`}
              </p>
            </div>
            {child?.id === c.id
              ? <span className="rounded-full bg-kivo-100 px-3 py-1 text-xs font-extrabold text-kivo-700">Active</span>
              : <button className="rounded-xl bg-mist px-4 py-2 text-sm font-bold hover:bg-kivo-100" onClick={() => void selectChild(c.id)}>Switch</button>}
          </div>
        ))}
        {children.length === 0 && (
          <div className="kivo-card text-center">
            <p className="text-4xl" aria-hidden="true">🌱</p>
            <p className="mt-2 font-display text-xl font-extrabold">No children yet</p>
            <p className="text-sm text-slate-500">Add your first child profile to begin.</p>
          </div>
        )}
      </div>

      <Link to="/assessment" className="inline-flex items-center gap-1 text-sm font-bold text-kivo-600 hover:underline">
        Run baseline assessment for {child?.name || 'active child'} <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}
