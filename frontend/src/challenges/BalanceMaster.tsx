import { useRef, useState } from 'react';
import ChallengeShell, { useCountdown, type ShellPhase } from './ChallengeShell';

const TARGETS = [4, 6, 8]; // seconds per round
const TOLERANCE_MS = 800;

/** BALANCE MASTER (CHAMPS): hold each pose for exactly the target time. */
export default function BalanceMaster({ onComplete }: { onComplete: (raw: Record<string, number>) => void }) {
  const [phase, setPhase] = useState<ShellPhase>('brief');
  const [round, setRound] = useState(0);
  const [holding, setHolding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [errs, setErrs] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<string | null>(null);
  const t0 = useRef(0);
  const raf = useRef(0);

  const count = useCountdown(phase === 'countdown', () => setPhase('active'));

  const tick = () => {
    const s = (Date.now() - t0.current) / 1000;
    setElapsed(s);
    if (s < TARGETS[round] + 5) raf.current = requestAnimationFrame(tick);
    else release(); // held way too long — count it
  };

  const press = () => {
    if (phase !== 'active' || holding) return;
    t0.current = Date.now();
    setHolding(true);
    setVerdict(null);
    raf.current = requestAnimationFrame(tick);
  };

  const release = () => {
    if (phase !== 'active' || !holding) return;
    cancelAnimationFrame(raf.current);
    setHolding(false);
    const ms = Date.now() - t0.current;
    const err = Math.abs(ms - TARGETS[round] * 1000);
    const ne = [...errs, err];
    setErrs(ne);
    setVerdict(err <= 400 ? 'Perfect! 🎯' : err <= TOLERANCE_MS ? 'Good hold! 👍' : 'Off balance — try again feel!');
    setTimeout(() => {
      if (round + 1 >= TARGETS.length) {
        setPhase('done');
        const avg = ne.reduce((a, b) => a + b, 0) / ne.length;
        const acc = Math.round((ne.filter((e) => e <= TOLERANCE_MS).length / ne.length) * 100);
        setTimeout(() => onComplete({ avgErrorMs: Math.round(avg), accuracy: acc, roundsCompleted: 3 }), 1200);
      } else {
        setRound((r) => r + 1);
        setElapsed(0);
        setVerdict(null);
      }
    }, 1100);
  };

  const target = TARGETS[round];
  const progress = Math.min(100, (elapsed / target) * 100);

  return (
    <ChallengeShell
      title="Balance Master" subtitle="Hold each pose for exactly the target time — release at the perfect moment!"
      secondsLeft={0} totalSeconds={1} showTimer={false}
      phase={phase} count={count}
    >
      {phase === 'brief' && (
        <div className="kivo-card text-center">
          <p className="text-5xl" aria-hidden="true">🧘</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold">How it works</h2>
          <p className="mt-1 text-sm text-slate-600">3 poses: hold {TARGETS.join('s, ')}s. Press and HOLD the orb, release exactly on target.</p>
          <button className="kivo-btn-primary mt-5 w-full" onClick={() => { setRound(0); setErrs([]); setElapsed(0); setPhase('countdown'); }}>
            Find your balance →
          </button>
        </div>
      )}
      {(phase === 'active' || phase === 'countdown') && (
        <div className="kivo-card text-center">
          <p className="text-sm font-bold text-slate-500">POSE {round + 1}/3 · TARGET {target}.0s</p>
          <p className="mt-1 font-display text-5xl font-extrabold tabular-nums" aria-live="polite">{elapsed.toFixed(1)}s</p>
          <div className="mx-auto mt-2 h-3 max-w-xs overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full transition-none ${elapsed > target + 0.8 ? 'bg-red-400' : 'bg-violet-500'}`} style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
          <button
            onPointerDown={press}
            onPointerUp={release}
            onPointerLeave={() => { if (holding) release(); }}
            onContextMenu={(e) => e.preventDefault()}
            className={`mx-auto mt-5 flex h-48 w-48 items-center justify-center rounded-full font-display text-2xl font-extrabold text-white shadow-pop transition-transform ${
              holding ? 'bg-violet-700 scale-95' : 'bg-gradient-to-br from-violet-400 to-purple-700 hover:scale-105'
            }`}
            aria-label="Press and hold for the target time, then release"
          >
            {holding ? 'HOLD…' : 'HOLD'}
          </button>
          {verdict && <p className="animate-pop mt-3 font-display text-2xl font-extrabold" aria-live="polite">{verdict}</p>}
          {errs.length > 0 && (
            <p className="mt-2 text-xs font-semibold text-slate-400">
              Errors so far: {errs.map((e) => `${Math.round(e)}ms`).join(' · ')}
            </p>
          )}
        </div>
      )}
      {phase === 'done' && (
        <div className="kivo-card text-center">
          <p className="animate-pop font-display text-4xl font-extrabold">Balanced! 🧘</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">Calculating your score…</p>
        </div>
      )}
    </ChallengeShell>
  );
}
