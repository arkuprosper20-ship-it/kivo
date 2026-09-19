import { useEffect, useState } from 'react';
import ChallengeCard from '../components/ChallengeCard';
import { ErrorState, Spinner } from '../components/ScoreCard';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { ChallengeDef } from '../types';

export default function Challenges() {
  const { detail } = useApp();
  const [list, setList] = useState<ChallengeDef[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ challenges: ChallengeDef[] }>('/challenges')
      .then((r) => setList(r.challenges))
      .catch((e) => setErr(e.message));
  }, []);

  if (err) return <ErrorState message={err} onRetry={() => window.location.reload()} />;
  if (!list.length) return <Spinner label="Loading challenges…" />;

  const bestFor = (id: string) => detail?.personalBests.find((p) => p.challengeId === id)?.score;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Challenges ⚡</h1>
        <p className="mt-1 font-semibold text-slate-500">Pick a challenge. Beat your own best — that's the game.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => (
          <ChallengeCard key={c.id} c={c} best={bestFor(c.id)} />
        ))}
      </div>
    </div>
  );
}
