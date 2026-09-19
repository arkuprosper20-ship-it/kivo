import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import ChallengeShell, { useCountdown, type ShellPhase } from './ChallengeShell';

/**
 * ROPE RUSH (FITTER): tap for every jump. Spacebar works too.
 * Tracks jumps, per-10s consistency, pause/resume.
 */
export default function RopeChallenge({ onComplete }: { onComplete: (raw: Record<string, number>) => void }) {
  const [duration, setDuration] = useState(60);
  const [phase, setPhase] = useState<ShellPhase>('brief');
  const [left, setLeft] = useState(60);
  const [jumps, setJumps] = useState(0);
  const [buckets, setBuckets] = useState<number[]>([]);
  const [flash, setFlash] = useState(false);
  const jumpsRef = useRef(0);
  const startRef = useRef(0);
  const elapsedRef = useRef(0);

  const count = useCountdown(phase === 'countdown', () => {
    startRef.current = Date.now();
    setPhase('active');
  });

  // main timer
  useEffect(() => {
    if (phase !== 'active') return;
    if (left <= 0) { finish(); return; }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, left]);

  // 10s consistency buckets
  useEffect(() => {
    if (phase !== 'active') return;
    const t = setInterval(() => {
      setBuckets((b) => [...b, jumpsRef.current]);
    }, 10000);
    return () => clearInterval(t);
  }, [phase]);

  const tap = () => {
    if (phase !== 'active') return;
    jumpsRef.current += 1;
    setJumps(jumpsRef.current);
    setFlash(true);
    setTimeout(() => setFlash(false), 90);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); tap(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const consistency = (): number => {
    const marks = [...buckets, jumpsRef.current];
    if (marks.length < 2) return 90;
    const rates: number[] = [];
    for (let i = 1; i < marks.length; i++) rates.push(Math.max(0, marks[i] - marks[i - 1]));
    if (!rates.length || Math.max(...rates) === 0) return 50;
    return Math.round((Math.min(...rates) / Math.max(...rates)) * 100);
  };

  const finish = () => {
    elapsedRef.current = duration - left;
    setPhase('done');
    const total = jumpsRef.current;
    const marks = [...buckets, total];
    const rates: number[] = [];
    for (let i = 1; i < marks.length; i++) rates.push(Math.max(0, marks[i] - marks[i - 1]));
    const cons = rates.length && Math.max(...rates) > 0
      ? Math.round((Math.min(...rates) / Math.max(...rates)) * 100)
      : 90;
    setTimeout(() => onComplete({ jumps: total, durationSec: duration, consistency: cons }), 900);
  };

  const begin = () => {
    jumpsRef.current = 0; setJumps(0); setBuckets([]); setLeft(duration);
    setPhase('countdown');
  };

  return (
    <ChallengeShell
      title="Rope Rush" subtitle="Complete as many jumps as possible — tap for every jump!"
      secondsLeft={left} totalSeconds={duration} showTimer={phase !== 'brief'}
      phase={phase} count={count}
      onPause={() => setPhase('paused')}
      onResume={() => { startRef.current = Date.now(); setPhase('active'); }}
    >
      {phase === 'brief' && (
        <div className="kivo-card text-center">
          <p className="text-5xl" aria-hidden="true">🌀</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold">How long is your round?</h2>
          <div className="mt-4 flex justify-center gap-2" role="radiogroup" aria-label="Round length">
            {[20, 30, 60].map((d) => (
              <button key={d} onClick={() => { setDuration(d); setLeft(d); }} aria-pressed={duration === d}
                className={`rounded-2xl px-5 py-3 font-display font-extrabold ${duration === d ? 'bg-kivo-600 text-white' : 'bg-mist text-slate-600'}`}>
                {d}s
              </button>
            ))}
          </div>
          <button className="kivo-btn-primary mt-5 w-full" onClick={begin}>Start jumping →</button>
          <p className="mt-2 text-xs text-slate-500">Tip: spacebar works on desktop. Levels: 20 / 30 / 40 / 50 / 50+ jumps.</p>
        </div>
      )}
      {(phase === 'active' || phase === 'paused' || phase === 'countdown') && (
        <div className="kivo-card text-center">
          <p className="font-display text-7xl font-extrabold tabular-nums" aria-live="polite">{jumps}</p>
          <p className="text-sm font-bold uppercase tracking-widest text-slate-500">jumps</p>
          <motion.button
            animate={flash ? { scale: [1, 1.12, 1] } : {}}
            onPointerDown={tap}
            className="mx-auto mt-4 flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 font-display text-3xl font-extrabold text-white shadow-pop active:scale-95"
            aria-label="Tap for each jump"
          >
            JUMP!
          </motion.button>
          <button className="mt-4 text-sm font-bold text-slate-500 hover:text-red-500" onClick={finish}>Finish early</button>
        </div>
      )}
      {phase === 'done' && (
        <div className="kivo-card text-center">
          <p className="animate-pop font-display text-4xl font-extrabold">{jumps} jumps! 🎉</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">Consistency {consistency()}% · Calculating your score…</p>
        </div>
      )}
    </ChallengeShell>
  );
}
