import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import OutcomeCard from '../components/OutcomeCard';
import PerformanceChart from '../components/PerformanceChart';
import { ErrorState, Spinner } from '../components/ScoreCard';
import { OUTCOMES } from '../config/theme';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { Attempt, ChallengeDef, ChildDetail, OutcomeKey } from '../types';

/** Athlete management: roster, per-athlete detail, challenge assignment. */
export default function Athletes() {
  const { user } = useApp();
  const [params, setParams] = useSearchParams();
  const [ids, setIds] = useState<string[]>([]);
  const [details, setDetails] = useState<Record<string, ChildDetail>>({});
  const [histories, setHistories] = useState<Record<string, Attempt[]>>({});
  const [challenges, setChallenges] = useState<ChallengeDef[]>([]);
  const [assignSel, setAssignSel] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const focus = params.get('focus');

  useEffect(() => {
    if (!user) return;
    api.get<{ athletes: Array<{ profile: { id: string } }> }>(`/coach/athletes?coachId=${user.id}`)
      .then(async (r) => {
        const list = r.athletes.map((a) => a.profile.id);
        setIds(list);
        if (focus && list.includes(focus)) {
          const [d, h] = await Promise.all([
            api.get<ChildDetail>(`/children/${focus}`),
            api.get<{ attempts: Attempt[] }>(`/children/${focus}/history`),
          ]);
          setDetails((m) => ({ ...m, [focus]: d }));
          setHistories((m) => ({ ...m, [focus]: h.attempts }));
        }
      })
      .catch((e) => setErr(e.message));
    api.get<{ challenges: ChallengeDef[] }>('/challenges').then((r) => setChallenges(r.challenges)).catch(() => {});
  }, [user, focus]);

  const open = async (id: string) => {
    setParams({ focus: id });
    if (!details[id]) {
      const [d, h] = await Promise.all([
        api.get<ChildDetail>(`/children/${id}`),
        api.get<{ attempts: Attempt[] }>(`/children/${id}/history`),
      ]);
      setDetails((m) => ({ ...m, [id]: d }));
      setHistories((m) => ({ ...m, [id]: h.attempts }));
    }
  };

  const assign = async (profileId: string) => {
    if (!user || !assignSel[profileId]) return;
    setMsg(null);
    try {
      await api.post('/coach/assign', { coachId: user.id, profileId, challengeId: assignSel[profileId], note });
      setMsg(`Challenge assigned ✅`);
      const d = await api.get<ChildDetail>(`/children/${profileId}`);
      setDetails((m) => ({ ...m, [profileId]: d }));
    } catch (e: any) { setMsg(e?.message || 'Assign failed'); }
  };

  const shown = useMemo(() => (focus && details[focus] ? [details[focus]] : Object.values(details)), [focus, details]);

  if (err) return <ErrorState message={err} onRetry={() => window.location.reload()} />;
  if (!user) return <Spinner label="Loading…" />;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-extrabold">Athletes 🏃</h1>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Athlete roster">
        {ids.map((id) => (
          <button key={id} onClick={() => void open(id)} aria-pressed={focus === id}
            className={`rounded-full px-4 py-2 text-sm font-bold ${focus === id ? 'bg-kivo-600 text-white' : 'bg-white text-slate-600 shadow-card'}`}>
            {details[id]?.child.name || id}
          </button>
        ))}
      </div>

      {!focus && <p className="text-sm font-semibold text-slate-500">Select an athlete to see performance, assign challenges, and track progress.</p>}

      {shown.map((d) => (
        <div key={d.child.id} className="space-y-4">
          <div className="kivo-card flex flex-wrap items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-3xl font-display text-2xl font-extrabold text-white"
              style={{ background: d.child.avatarColor }} aria-hidden="true">{d.child.name.slice(0, 1)}</span>
            <div className="mr-auto">
              <p className="font-display text-2xl font-extrabold">{d.child.name}</p>
              <p className="text-sm font-semibold text-slate-500">KIVO {d.kivoScore}/100 · Lv.{d.level} · 🔥{d.streak.currentDays}d · {d.badges.length} badges</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {(Object.keys(d.progress) as OutcomeKey[]).map((k) => (
              <OutcomeCard key={k} k={k} score={d.progress[k]} trend={d.changes[k]} />
            ))}
          </div>

          <div className="kivo-card">
            <h3 className="mb-2 font-display text-lg font-extrabold">Performance trend</h3>
            <PerformanceChart attempts={histories[d.child.id] || []} />
          </div>

          <div className="kivo-card space-y-3">
            <h3 className="font-display text-lg font-extrabold">Assign challenge</h3>
            {d.assignedChallenge && (
              <p className="rounded-2xl bg-kivo-50 p-3 text-sm font-semibold text-kivo-800">
                Current: <span className="capitalize">{d.assignedChallenge.challengeId.replace('-', ' ')}</span>
                {d.assignedChallenge.note ? ` — “${d.assignedChallenge.note}”` : ''}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <select className="kivo-input flex-1" value={assignSel[d.child.id] || ''} onChange={(e) => setAssignSel((m) => ({ ...m, [d.child.id]: e.target.value }))} aria-label="Challenge to assign">
                <option value="">Choose a challenge…</option>
                {challenges.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.category}</option>)}
              </select>
              <input className="kivo-input flex-1" placeholder="Note for the athlete (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
              <button className="kivo-btn-primary whitespace-nowrap" onClick={() => void assign(d.child.id)}>Assign</button>
            </div>
            {msg && <p className="text-sm font-bold text-kivo-700" role="status">{msg}</p>}
          </div>

          <div className="kivo-card">
            <h3 className="mb-2 font-display text-lg font-extrabold">Goals</h3>
            <p className="text-sm font-semibold text-slate-600">{(d.child.goals || []).join(' · ') || 'Overall development'}</p>
            <h3 className="mb-1 mt-3 font-display text-lg font-extrabold">Outcome bars</h3>
            {OUTCOMES.map((o) => (
              <div key={o.key} className="mb-2">
                <div className="flex justify-between text-xs font-bold"><span style={{ color: o.color }}>{o.label}</span><span>{d.progress[o.key]}/100</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${d.progress[o.key]}%`, background: o.color }} /></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
