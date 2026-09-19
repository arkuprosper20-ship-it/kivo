import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import ChallengeShell, { useCountdown, type ShellPhase } from './ChallengeShell';

const ROUNDS = 10;

/**
 * REACTION RUSH (FASTER): 4 pods, random activation, tap fast.
 * Tracks reaction ms, accuracy, hits. Keyboard 1-4 supported.
 */
export default function ReactionGame({ onComplete }: { onComplete: (raw: Record<string, number>) => void }) {
  const [phase, setPhase] = useState<ShellPhase>('brief');
  const [active, setActive] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<{ i: number; ok: boolean } | null>(null);
  const t0 = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = useCountdown(phase === 'countdown', () => {
    setPhase('active');
    schedule(0);
  });

  const schedule = (r: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setActive(Math.floor(Math.random() * 4));
      t0.current = Date.now();
      void r;
    }, 600 + Math.random() * 900);
  };

  const finish = (allTimes: number[], h: number, m: number) => {
    setPhase('done');
    const avg = allTimes.length ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 1500;
    const acc = Math.round((h / Math.max(1, h + m)) * 100);
    setTimeout(() => onComplete({ avgMs: Math.round(avg), accuracy: acc, hits: h, misses: m, rounds: ROUNDS }), 1400);
  };

  const tap = (i: number) => {
    if (phase !== 'active' || active === null) return;
    if (i === active) {
      const dt = Date.now() - t0.current;
      const nt = [...times, dt];
      const nh = hits + 1;
      setTimes(nt); setHits(nh); setActive(null);
      setFeedback({ i, ok: true });
      setTimeout(() => setFeedback(null), 220);
      if (nh >= ROUNDS) finish(nt, nh, misses);
      else { setRound(nh); schedule(nh); }
    } else {
      const nm = misses + 1;
      setMisses(nm);
      setFeedback({ i, ok: false });
      setTimeout(() => setFeedback(null), 220);
    }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const n = ['1', '2', '3', '4'].indexOf(e.key);
      if (n >= 0) tap(n);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, active, times, hits, misses]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  return (
    <ChallengeShell
      title="Reaction Rush" subtitle="Tap the glowing pod as fast as you can — 10 rounds!"
      secondsLeft={0} totalSeconds={1} showTimer={false}
      phase={phase} count={count}
    >
      {phase === 'brief' && (
        <div className="kivo-card text-center">
          <p className="text-5xl" aria-hidden="true">⚡</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold">How it works</h2>
          <p className="mt-1 text-sm text-slate-600">One pod lights up at random. Tap it FAST. Wrong taps hurt accuracy — keys 1–4 work too.</p>
          <button className="kivo-btn-primary mt-5 w-full" onClick={() => { setRound(0); setTimes([]); setHits(0); setMisses(0); setPhase('countdown'); }}>
            Ready? Start →
          </button>
        </div>
      )}
      {(phase === 'active' || phase === 'countdown') && (
        <div className="kivo-card">
          <div className="flex items-center justify-around text-center">
            <div><p className="font-display text-2xl font-extrabold tabular-nums">{hits}/{ROUNDS}</p><p className="text-xs font-bold text-slate-500">HITS</p></div>
            <div><p className="font-display text-2xl font-extrabold tabular-nums">{avg}<span className="text-sm">ms</span></p><p className="text-xs font-bold text-slate-500">AVG</p></div>
            <div><p className="font-display text-2xl font-extrabold tabular-nums">{misses}</p><p className="text-xs font-bold text-slate-500">MISS</p></div>
          </div>
          <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-4" role="group" aria-label="Reaction pods">
            {[0, 1, 2, 3].map((i) => {
              const isActive = active === i;
              const fb = feedback?.i === i ? feedback.ok : null;
              return (
                <motion.button
                  key={i}
                  onPointerDown={() => tap(i)}
                  animate={isActive ? { scale: [1, 1.1, 1.05] } : fb === false ? { x: [0, -8, 8, 0] } : {}}
                  transition={isActive ? { repeat: Infinity, duration: 0.7 } : { duration: 0.25 }}
                  aria-label={`Pod ${i + 1}${isActive ? ' active, tap now' : ''}`}
                  className={`h-28 sm:h-32 rounded-full border-4 font-display text-2xl font-extrabold transition-colors ${
                    isActive
                      ? 'animate-glow border-amber-400 bg-gradient-to-br from-amber-300 to-orange-500 text-white'
                      : fb === true
                        ? 'border-green-400 bg-green-100 text-green-600'
                        : fb === false
                          ? 'border-red-400 bg-red-100 text-red-500'
                          : 'border-slate-200 bg-slate-100 text-slate-400'
                  }`}
                >
                  {fb === true ? '✓' : fb === false ? '✕' : i + 1}
                </motion.button>
              );
            })}
          </div>
          <AnimatePresence>
            {feedback?.ok && (
              <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-3 text-center font-display font-extrabold text-green-600" aria-live="polite">
                +{(times[times.length - 1] / 1000).toFixed(2)}s — nice!
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}
      {phase === 'done' && (
        <div className="kivo-card text-center">
          <p className="animate-pop font-display text-4xl font-extrabold">Round complete! 🎉</p>
          <p className="mt-2 font-display text-xl font-bold tabular-nums">
            {(times.reduce((a, b) => a + b, 0) / Math.max(1, times.length) / 1000).toFixed(2)}s avg · {Math.round((hits / Math.max(1, hits + misses)) * 100)}% accuracy
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500">Calculating your score…</p>
        </div>
      )}
    </ChallengeShell>
  );
}
