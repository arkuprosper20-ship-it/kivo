import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorState, Spinner } from '../components/ScoreCard';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { ChallengeDef, CompleteResult } from '../types';
import AgilityGame from '../challenges/AgilityGame';
import ReactionGame from '../challenges/ReactionGame';
import RopeChallenge from '../challenges/RopeChallenge';

export default function ChallengeDetail() {
  const { id } = useParams();
  const { child, setLastResult } = useApp();
  const nav = useNavigate();
  const [def, setDef] = useState<ChallengeDef | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingRaw, setPendingRaw] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    api.get<{ challenge: ChallengeDef }>(`/challenges/${id}`)
      .then((r) => setDef(r.challenge))
      .catch((e) => setErr(e.message));
  }, [id]);

  const submit = async (raw: Record<string, number>) => {
    if (!child || !id) return;
    setPendingRaw(raw);
    setSubmitting(true);
    setErr(null);
    try {
      const r = await api.post<CompleteResult>(`/challenges/${id}/complete`, { childId: child.id, raw });
      setLastResult(r);
      nav('/results');
    } catch (e: any) {
      setErr(e?.message || 'Could not save your result');
    } finally {
      setSubmitting(false);
    }
  };

  if (err && !def) return <ErrorState message={err} onRetry={() => window.location.reload()} />;
  if (!def) return <Spinner label="Loading challenge…" />;

  return (
    <div className="py-2">
      {id === 'rope-rush' && <RopeChallenge onComplete={(raw) => void submit(raw)} />}
      {id === 'reaction-rush' && <ReactionGame onComplete={(raw) => void submit(raw)} />}
      {id === 'agility-command' && <AgilityGame onComplete={(raw) => void submit(raw)} />}
      {submitting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-6" role="status" aria-label="Saving result">
          <div className="kivo-card text-center"><Spinner label="Saving your result…" /></div>
        </div>
      )}
      {err && pendingRaw && !submitting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-6">
          <div className="kivo-card max-w-sm text-center" role="alert">
            <p className="text-4xl" aria-hidden="true">😞</p>
            <h3 className="mt-2 font-display text-xl font-extrabold">Couldn't save</h3>
            <p className="mt-1 text-sm text-slate-600">{err}</p>
            <button className="kivo-btn-primary mt-4 w-full" onClick={() => void submit(pendingRaw)}>Retry save</button>
          </div>
        </div>
      )}
    </div>
  );
}
