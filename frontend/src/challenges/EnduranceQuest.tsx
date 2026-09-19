import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import ChallengeShell, { useCountdown, type ShellPhase } from './ChallengeShell';

const DUR = 45;

/** ENDURANCE QUEST (FITTER): alternate LEFT / RIGHT step pads for 45s. */
export default function EnduranceQuest({ onComplete }: { onComplete: (raw: Record<string, number>) => void }) {
  const [phase, setPhase] = useState<ShellPhase>('brief');
  const [left, setLeft] = useState(DUR);
  const [steps, setSteps] = useState(0);
  const [errors, setErrors] = useState(0);
  const [expect, setExpect] = useState<'L' | 'R'>('L');
  const [wrong, setWrong] = useState<'L' | 'R' | null>(null);
  const [st, setSt] = useState({ steps: 0, errors: 0 });

  const count = useCountdown(phase === 'countdown', () => setPhase('active'));

  useEffect(() => {
    if (phase !== 'active') return;
    if (left <= 0) { finish(); return; }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, left]);

  const tap = (side: 'L' | 'R') => {
    if (phase !== 'active') return;
    if (side === expect) {
      const ns = st.steps + 1;
      setSt({ steps: ns, errors: st.errors });
      setSteps(ns);
      setExpect(expect === 'L' ? 'R' : 'L');
    } else {
      const ne = st.errors + 1;
      setSt({ steps: st.steps, errors: ne });
      setErrors(ne);
      setWrong(side);
      setTimeout(() => setWrong(null), 220);
    }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') tap('L');
      if (e.key === 'ArrowRight') tap('R');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, expect, st]);

  const finish = () => {
    setPhase('done');
    const { steps: s, errors: e } = st;
    setTimeout(() => onComplete({ steps: s, durationSec: DUR, errors: e }), 900);
  };

  const pad = (side: 'L' | 'R', label: string, keyHint: string, bg: string) => (
    <motion.button
      key={side}
      onPointerDown={() => tap(side)}
      animate={wrong === side ? { x: [0, -8, 8, 0] } : {}}
      aria-label={`${label} step pad${expect === side && phase === 'active' ? ' — your turn' : ''}`}
      className={`flex h-44 flex-col items-center justify-center rounded-3xl font-display text-3xl font-extrabold text-white shadow-pop transition-transform active:scale-95 ${bg} ${
        expect === side && phase === 'active' ? 'ring-4 ring-offset-2 ring-kivo-300 scale-[1.03]' : 'opacity-80'
      }`}
    >
      {label}
      <span className="mt-1 text-sm font-bold opacity-80">{keyHint}</span>
      <span className="mt-1 text-4xl tabular-nums">{side === 'L' ? Math.ceil(steps / 2) : Math.floor(steps / 2)}</span>
    </motion.button>
  );

  return (
    <ChallengeShell
      title="Endurance Quest" subtitle="Alternate LEFT / RIGHT pads for 45 seconds — keep the rhythm!"
      secondsLeft={left} totalSeconds={DUR} showTimer={phase !== 'brief'}
      phase={phase} count={count}
      onPause={() => setPhase('paused')}
      onResume={() => setPhase('active')}
    >
      {phase === 'brief' && (
        <div className="kivo-card text-center">
          <p className="text-5xl" aria-hidden="true">🫁</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold">How it works</h2>
          <p className="mt-1 text-sm text-slate-600">Tap LEFT then RIGHT, alternating. Wrong side = error. Arrow keys work too.</p>
          <button className="kivo-btn-primary mt-5 w-full" onClick={() => { setSt({ steps: 0, errors: 0 }); setSteps(0); setErrors(0); setExpect('L'); setLeft(DUR); setPhase('countdown'); }}>
            Start quest →
          </button>
        </div>
      )}
      {(phase === 'active' || phase === 'paused' || phase === 'countdown') && (
        <div className="kivo-card">
          <div className="flex items-center justify-around text-center">
            <div><p className="font-display text-3xl font-extrabold tabular-nums">{steps}</p><p className="text-xs font-bold text-slate-500">STEPS</p></div>
            <div><p className="font-display text-3xl font-extrabold tabular-nums">{errors}</p><p className="text-xs font-bold text-slate-500">ERRORS</p></div>
            <div><p className="font-display text-3xl font-extrabold text-kivo-600">{expect}</p><p className="text-xs font-bold text-slate-500">NEXT</p></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {pad('L', 'LEFT', '← key', 'bg-gradient-to-br from-green-400 to-emerald-600')}
            {pad('R', 'RIGHT', '→ key', 'bg-gradient-to-br from-teal-400 to-cyan-600')}
          </div>
          <button className="mx-auto mt-4 block text-sm font-bold text-slate-500 hover:text-red-500" onClick={finish}>Finish early</button>
        </div>
      )}
      {phase === 'done' && (
        <div className="kivo-card text-center">
          <p className="animate-pop font-display text-4xl font-extrabold">{steps} steps! 🫁</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">{errors} errors · Calculating your score…</p>
        </div>
      )}
    </ChallengeShell>
  );
}
