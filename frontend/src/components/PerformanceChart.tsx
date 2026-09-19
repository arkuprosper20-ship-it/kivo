import { useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { OUTCOMES } from '../config/theme';
import type { Attempt } from '../types';

export default function PerformanceChart({ attempts }: { attempts: Attempt[] }) {
  const data = useMemo(() => {
    const last = attempts.slice(-14);
    return last.map((a) => ({
      name: new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: a.score,
      challenge: a.challengeId,
    }));
  }, [attempts]);
  if (!data.length) return <p className="py-6 text-center text-sm text-slate-500">No activity yet — complete a challenge to start the chart.</p>;
  return (
    <div className="h-64 w-full" role="img" aria-label="Score trend chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="score" name="Score" stroke={OUTCOMES[0].color} strokeWidth={3} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
