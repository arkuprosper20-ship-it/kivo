import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ErrorState, Spinner } from '../components/ScoreCard';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

/** Coach analytics: aggregate view across authorized athletes. */
export default function Analytics() {
  const { user } = useApp();
  const [rows, setRows] = useState<Array<{ name: string; kivo: number; sessions: number; streak: number }>>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api.get<{ athletes: any[] }>(`/coach/athletes?coachId=${user.id}`)
      .then((r) => setRows(r.athletes.map((a: any) => ({
        name: a.profile.name, kivo: a.kivoScore, sessions: a.totalAttempts, streak: a.streakDays,
      }))))
      .catch((e) => setErr(e.message));
  }, [user]);

  if (err) return <ErrorState message={err} onRetry={() => window.location.reload()} />;
  if (!user) return <Spinner label="Loading…" />;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-extrabold">Analytics 📊</h1>

      <div className="kivo-card">
        <h2 className="mb-2 font-display text-xl font-extrabold">KIVO Score by athlete</h2>
        <div className="h-64" role="img" aria-label="KIVO score by athlete">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="kivo" name="KIVO Score" fill="#1B4FD6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="kivo-card">
        <h2 className="mb-2 font-display text-xl font-extrabold">Sessions & streaks</h2>
        <div className="h-64" role="img" aria-label="Sessions and streaks">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="sessions" name="Sessions" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="streak" name="Streak (days)" fill="#F59E0B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="text-xs text-slate-400">Aggregates only — personal improvement matters more than ranking.</p>
    </div>
  );
}
