import { ArrowRight, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState, Spinner } from '../components/ScoreCard';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

interface AthleteRow {
  profile: { id: string; name: string; age: number; fitnessLevel: string; avatarColor: string };
  age: number; kivoScore: number; level: number; streakDays: number; totalAttempts: number; badges: number;
}

/** Coach dashboard: roster at a glance. */
export default function CoachDash() {
  const { user } = useApp();
  const [athletes, setAthletes] = useState<AthleteRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api.get<{ athletes: AthleteRow[] }>(`/coach/athletes?coachId=${user.id}`)
      .then((r) => setAthletes(r.athletes))
      .catch((e) => setErr(e.message));
  }, [user]);

  if (err) return <ErrorState message={err} onRetry={() => window.location.reload()} />;
  if (!user) return <Spinner label="Loading…" />;

  const spec = (() => { try { return localStorage.getItem('kivo_coach_spec') || 'Youth athletics'; } catch { return 'Youth athletics'; } })();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Coach dashboard 📋</h1>
        <p className="mt-1 font-semibold text-slate-500">{user.name} · {spec} · {athletes.length} authorized athlete{athletes.length === 1 ? '' : 's'}</p>
      </div>

      {!athletes.length && <Spinner label="Loading athletes…" />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {athletes.map((a) => (
          <div key={a.profile.id} className="kivo-card">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl font-display text-xl font-extrabold text-white"
                style={{ background: a.profile.avatarColor }} aria-hidden="true">
                {a.profile.name.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="font-display text-xl font-extrabold">{a.profile.name}</p>
                <p className="text-xs font-semibold text-slate-500">Age {a.age} · Lv.{a.level} · 🔥{a.streakDays}d</p>
              </div>
              <span className="ml-auto font-display text-2xl font-extrabold text-kivo-600 tabular-nums">{a.kivoScore}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-500">
              <span>{a.totalAttempts} recent sessions · {a.badges} badges</span>
              <Link to={`/athletes?focus=${a.profile.id}`} className="inline-flex items-center gap-1 font-bold text-kivo-600 hover:underline">
                Open <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <Link to="/athletes" className="kivo-btn-ghost w-full sm:w-auto">
        <Users size={18} aria-hidden="true" /> Manage athletes
      </Link>
      <p className="text-xs text-slate-400">You only see athletes who explicitly granted you access. No private data is exposed beyond training metrics.</p>
    </div>
  );
}
