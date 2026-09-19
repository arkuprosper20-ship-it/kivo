import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ChallengeShell, { useCountdown, type ShellPhase } from './ChallengeShell';

const ROUNDS_SEQ = [
  [1, 3, 5, 2],
  [4, 1, 6, 3, 5],
  [2, 5, 1, 4, 6, 3],
];

/**
 * AGILITY COMMAND (CHAMPS): tap numbered stations in the shown sequence.
 * 3 rounds, sequences grow. Tracks time, accuracy, errors.
 */
export default function AgilityGame({ onComplete }: { onComplete: (raw: Record<string, number>) => void }) {
  const [phase, setPhase] = useState<ShellPhase>('brief');
  const [round, setRound] = useState(0);
  const [pos, setPos] = useState(0);
  const [errors, setErrors] = useState(0);
  const [taps, setTaps] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const t0 = useRef(0);

  const count = useCountdown(phase === 'countdown', () => {
    setPhase('active');
    t0.current = Date.now();
  });

  const seq = ROUNDS_SEQ[round];

  const tap = (n: number) => {
    if (phase !== 'active') return;
    setTaps((t) => t + 1);
    if (n === seq[pos]) {
      const np = pos + 1;
      setPos(np);
      if (np >= seq.length) {
        if (round + 1 >= ROUNDS_SEQ.length) {
          const sec = (Date.now() - t0.current) / 1000;
          const totalTaps = taps + 1;
          const correctNeeded = ROUNDS_SEQ.reduce((a, s) => a + s.length, 0);
          const acc = Math.round((correctNeeded / totalTaps) * 100);
          setPhase('done');
          setTimeout(() => onComplete({ seconds: Math.round(sec * 10) / 10, accuracy: acc, errors, roundsCompleted: 3 }), 1400);
        } else {
          setRound((r) => r + 1);
          setPos(0);
        }
      }
    } else {
      setErrors((e) => e + 1);
      setWrong(n);
      setTimeout(() => setWrong(null), 250);
    }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const n = ['1', '2', '3', '4', '5', '6'].indexOf(e.key);
      if (n >= 0) tap(n + 1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round, pos, errors, taps]);

  const elapsed = phase === 'active' ? ((Date.now() - t0.current) / 1000).toFixed(1) : '0.0';

  return (
    <ChallengeShell
      title="Agility Command" subtitle="Follow the station sequence in order — 3 rounds, growing longer!"
      secondsLeft={0} totalSeconds={1} showTimer={false}
      phase={phase} count={count}
    >
      {phase === 'brief' && (
        <div className="kivo-card text-center">
          <p className="text-5xl" aria-hidden="true">🎯</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold">How it works</h2>
          <p className="mt-1 text-sm text-slate-600">Memorize the sequence at the top, then tap the stations in order. Wrong taps count as errors — keys 1–6 work too.</p>
          <button className="kivo-btn-primary mt-5 w-full" onClick={() => { setRound(0); setPos(0); setErrors(0); setTaps(0); setPhase('countdown'); }}>
            Show me the sequence →
          </button>
        </div>
      )}
      {(phase === 'active' || phase === 'countdown') && (
        <div className="kivo-card">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500">ROUND {round + 1}/3</p>
            <p className="font-display text-xl font-extrabold tabular-nums" aria-live="polite">{elapsed}s</p>
            <p className="text-sm font-bold text-slate-500">ERRORS {errors}</p>
          </div>
          <p className="mt-2 text-center font-display text-2xl font-extrabold tracking-wide text-violet-700" aria-label={`Sequence ${seq.join(' then ')}`}>
            {seq.map((s, i) => (
              <span key={`${round}-${s}-${i}`} className={i < pos ? 'text-green-500' : ''}>
                {i > 0 ? ' → ' : ''}{s}
              </span>
            ))}
          </p>
          <div className="mx-auto mt-4 grid max-w-sm grid-cols-3 gap-3" role="group" aria-label="Stations">
            {[1, 2, 3, 4, 5, 6].map((n) => {
              const doneHere = seq.slice(0, pos).includes(n);
              const isNext = seq[pos] === n;
              return (
                <motion.button
                  key={n}
                  onPointerDown={() => tap(n)}
                  animate={wrong === n ? { x: [0, -8, 8, 0] } : {}}
                  aria-label={`Station ${n}`}
                  className={`h-20 sm:h-24 rounded-3xl font-display text-2xl font-extrabold transition-all min-h-[64px] ${
                    isNext
                      ? 'bg-violet-500 text-white shadow-pop scale-105'
                      : doneHere
                        ? 'bg-green-100 text-green-600'
                        : wrong === n
                          ? 'bg-red-100 text-red-500'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {doneHere ? <Check className="mx-auto" aria-hidden="true" /> : n}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
      {phase === 'done' && (
        <div className="kivo-card text-center">
          <p className="animate-pop font-display text-4xl font-extrabold">All sequences cleared! 🎉</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">Calculating your score…</p>
        </div>
      )}
    </ChallengeShell>
  );
}
