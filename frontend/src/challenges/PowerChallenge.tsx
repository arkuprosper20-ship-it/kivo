import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import ChallengeShell, { useCountdown, type ShellPhase } from './ChallengeShell';

const DUR = 30;

/** POWER PULSE (STRONGER): maximum power taps in 30 seconds. */
export default function PowerChallenge({ onComplete }: { onComplete: (raw: Record<string, number>) => void }) {
  const [phase, setPhase] = useState<ShellPhase>('brief');
  const [left, setLeft] = useState(DUR);
  const [reps, setReps] = useState(0);
  const [flash, setFlash] = useState(false);
  const repsRef = useRef(0);

  const count = useCountdown(phase === 'countdown', () => setPhase('active'));

  useEffect(() => {
    if (phase !== 'active') return;
    if (left <= 0) { finish(); return; }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, left]);

  const tap = () => {
    if (phase !== 'active') return;
    repsRef.current += 1;
    setReps(repsRef.current);
    setFlash(true);
    setTimeout(() => setFlash(false), 80);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); tap(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const finish = () => {
    setPhase('done');
    const total = repsRef.current;
    setTimeout(() => onComplete({ reps: total, durationSec: DUR }), 900);
  };

  return (
    <ChallengeShell
      title="Power Pulse" subtitle="Unleash maximum power — tap as fast as you can for 30 seconds!"
      secondsLeft={left} totalSeconds={DUR} showTimer={phase !== 'brief'}
      phase={phase} count={count}
      onPause={() => setPhase('paused')}
      onResume={() => setPhase('active')}
    >
      {phase === 'brief' && (
        <div className="kivo-card text-center">
          <p className="text-5xl" aria-hidden="true">💪</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold">How it works</h2>
          <p className="mt-1 text-sm text-slate-600">Hammer the power button — every tap is a power rep. Spacebar works too.</p>
          <button className="kivo-btn-primary mt-5 w-full" onClick={() => { repsRef.current = 0; setReps(0); setLeft(DUR); setPhase('countdown'); }}>
            Start pulsing →
          </button>
        </div>
      )}
      {(phase === 'active' || phase === 'paused' || phase === 'countdown') && (
        <div className="kivo-card text-center">
          <p className="font-display text-7xl font-extrabold tabular-nums" aria-live="polite">{reps}</p>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">power reps</p>
          <motion.button
            animate={flash ? { scale: [1, 1.1, 1] } : {}}
            onPointerDown={tap}
            className="mx-auto mt-4 flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 font-display text-3xl font-extrabold text-white shadow-pop active:scale-95"
            aria-label="Tap for each power rep"
          >
            POWER!
          </motion.button>
          <button className="mt-4 text-sm font-bold text-slate-500 hover:text-red-500" onClick={finish}>Finish early</button>
        </div>
      )}
      {phase === 'done' && (
        <div className="kivo-card text-center">
          <p className="animate-pop font-display text-4xl font-extrabold">{reps} reps! 💪</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">Calculating your score…</p>
        </div>
      )}
    </ChallengeShell>
  );
}
