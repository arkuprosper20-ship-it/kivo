import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { outcomeMeta } from '../config/theme';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { OutcomeKey, OutcomeScores } from '../types';

const clamp = (v: number) => Math.min(100, Math.max(5, Math.round(v)));
const ropeScore = (jumps: number, sec: number) => {
  const pm = sec > 0 ? (jumps / sec) * 60 : 0;
  return clamp(12 + pm * 1.6 - Math.max(0, pm - 50) * 0.4);
};
const reactionScore = (avgMs: number, acc: number) => clamp((132 - avgMs / 19) * 0.72 + acc * 0.28);
const agilityScore = (sec: number, acc: number, err: number) => clamp((122 - sec * 2.6) * 0.7 + acc * 0.3 - err * 1.5);
const holdScore = (sec: number) => (sec <= 3 ? clamp(30 + sec * 5) : clamp(45 + sec * 2.5));

type Step = 'intro' | 'stronger' | 'fitter' | 'faster' | 'champs' | 'results';

/** Interactive baseline assessment: 4 quick tests -> initial KIVO profile. */
export default function Assessment() {
  const { child, refresh } = useApp();
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('intro');
  const [scores, setScores] = useState<OutcomeScores>({ stronger: 0, fitter: 0, faster: 0, champs: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (s: OutcomeScores) => {
    if (!child) return;
    setSaving(true); setError(null);
    try {
      await api.put(`/children/${child.id}/progress`, s);
      await refresh();
      nav('/dashboard');
    } catch (e: any) { setError(e?.message || 'Could not save baseline'); }
    finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <StepsBar step={step} />
      <AnimatePresence mode="wait">
        {step === 'intro' && <Intro key="i" name={child?.name} next={() => setStep('stronger')} />}
        {step === 'stronger' && <HoldTest key="s" next={(v) => { setScores((p) => ({ ...p, stronger: v })); setStep('fitter'); }} />}
        {step === 'fitter' && <RopeMini key="f" next={(v) => { setScores((p) => ({ ...p, fitter: v })); setStep('faster'); }} />}
        {step === 'faster' && <ReactionMini key="fa" next={(v) => { setScores((p) => ({ ...p, faster: v })); setStep('champs'); }} />}
        {step === 'champs' && <AgilityMini key="c" next={(v) => { const s = { ...scores, champs: v }; setScores(s); setStep('results'); }} />}
        {step === 'results' && (
          <ResultsView key="r" scores={{ ...scores }} saving={saving} error={error} onSave={() => void save({ ...scores })} />
        )}
      </AnimatePresence>
    </div>
  );
}

function StepsBar({ step }: { step: Step }) {
  const order: Step[] = ['intro', 'stronger', 'fitter', 'faster', 'champs', 'results'];
  const idx = order.indexOf(step);
  return (
    <div className="mb-6 flex gap-1.5" aria-label="Assessment progress">
      {order.slice(1, 5).map((s, i) => (
        <div key={s} className={`h-2 flex-1 rounded-full ${i < idx ? 'bg-kivo-500' : 'bg-slate-200'}`} />
      ))}
    </div>
  );
}

function Intro({ name, next }: { name?: string; next: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="kivo-card text-center">
      <p className="text-5xl" aria-hidden="true">📋</p>
      <h1 className="mt-3 font-display text-3xl font-extrabold">Baseline assessment</h1>
      <p className="mt-2 text-slate-600">
        {name ? `${name}, let's` : "Let's"} discover your starting scores with 4 quick tests — about 2 minutes total.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-left text-sm font-semibold">
        <div className="rounded-2xl bg-blue-50 p-3">💪 Hang Test <span className="text-slate-500">· STRONGER</span></div>
        <div className="rounded-2xl bg-green-50 p-3">🌀 Rope Mini <span className="text-slate-500">· FITTER</span></div>
        <div className="rounded-2xl bg-amber-50 p-3">⚡ Reaction Mini <span className="text-slate-500">· FASTER</span></div>
        <div className="rounded-2xl bg-violet-50 p-3">🎯 Agility Mini <span className="text-slate-500">· CHAMPS</span></div>
      </div>
      <button className="kivo-btn-primary mt-6 w-full" onClick={next}>Let's go →</button>
    </motion.div>
  );
}

function HoldTest({ next }: { next: (score: number) => void }) {
  const [holding, setHolding] = useState(false);
  const [sec, setSec] = useState(0);
  const t0 = useRef(0);
  const raf = useRef(0);
  const done = useRef(false);

  const tick = () => {
    const s = (Date.now() - t0.current) / 1000;
    setSec(s);
    if (s < 30) raf.current = requestAnimationFrame(tick);
    else finish(30);
  };
  const start = () => { t0.current = Date.now(); setHolding(true); raf.current = requestAnimationFrame(tick); };
  const finish = (s: number) => {
    if (done.current) return;
    done.current = true;
    cancelAnimationFrame(raf.current);
    setHolding(false);
    if (s >= 1.5) next(holdScore(s));
    else { done.current = false; setSec(0); }
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="kivo-card text-center">
      <p className="font-display text-sm font-extrabold uppercase tracking-widest text-blue-600">STRONGER · Hang Test</p>
      <h2 className="mt-1 font-display text-2xl font-extrabold">Press & hold as long as you can</h2>
      <p className="mt-1 text-sm text-slate-500">Pretend you're hanging from a bar. Hold the button — release when you must!</p>
      <p className="mt-4 font-display text-6xl font-extrabold tabular-nums" aria-live="polite">{sec.toFixed(1)}s</p>
      <button
        className={`mt-4 h-40 w-40 rounded-full font-display text-xl font-extrabold text-white shadow-pop transition-transform ${holding ? 'bg-blue-700 scale-95' : 'bg-blue-500 hover:scale-105'}`}
        onPointerDown={start}
        onPointerUp={() => finish((Date.now() - t0.current) / 1000)}
        onPointerLeave={() => { if (holding) finish((Date.now() - t0.current) / 1000); }}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Hold to measure hang time"
      >
        {holding ? 'HOLDING…' : 'HOLD'}
      </button>
      <p className="mt-3 text-xs text-slate-400">Hold at least 1.5 seconds to record.</p>
    </motion.div>
  );
}

function RopeMini({ next }: { next: (score: number) => void }) {
  const DUR = 15;
  const [phase, setPhase] = useState<'ready' | 'go' | 'done'>('ready');
  const [left, setLeft] = useState(DUR);
  const [jumps, setJumps] = useState(0);

  useEffect(() => {
    if (phase !== 'go') return;
    if (left <= 0) { setPhase('done'); return; }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, left]);

  useEffect(() => {
    if (phase === 'done') {
      const t = setTimeout(() => next(ropeScore(jumps, DUR)), 1200);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="kivo-card text-center">
      <p className="font-display text-sm font-extrabold uppercase tracking-widest text-green-600">FITTER · Rope Mini (15s)</p>
      <h2 className="mt-1 font-display text-2xl font-extrabold">Tap for every jump!</h2>
      {phase === 'ready' && <button className="kivo-btn-primary mt-6 w-full" onClick={() => setPhase('go')}>Start jumping →</button>}
      {phase === 'go' && (
        <>
          <p className="mt-2 font-display text-5xl font-extrabold tabular-nums">{left}s</p>
          <button
            className="mt-4 h-44 w-44 rounded-full bg-green-500 font-display text-2xl font-extrabold text-white shadow-pop active:scale-95"
            onPointerDown={() => setJumps((j) => j + 1)}
            aria-label="Tap for each jump"
          >
            JUMP!
            <span className="block text-4xl tabular-nums">{jumps}</span>
          </button>
        </>
      )}
      {phase === 'done' && (
        <p className="animate-pop mt-6 font-display text-3xl font-extrabold">{jumps} jumps! 🎉</p>
      )}
    </motion.div>
  );
}

function ReactionMini({ next }: { next: (score: number) => void }) {
  const ROUNDS = 5;
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready');
  const [active, setActive] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [miss, setMiss] = useState(0);
  const t0 = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fire = (r: number) => {
    const idx = Math.floor(Math.random() * 4);
    setActive(idx);
    t0.current = Date.now();
    void r;
  };
  const start = () => {
    setPhase('play'); setRound(0); setTimes([]); setMiss(0);
    timer.current = setTimeout(() => fire(0), 700);
  };
  const tap = (i: number) => {
    if (phase !== 'play' || active === null) return;
    if (i === active) {
      const dt = Date.now() - t0.current;
      const nt = [...times, dt];
      setTimes(nt); setActive(null);
      if (nt.length >= ROUNDS) {
        setPhase('done');
        const avg = nt.reduce((a, b) => a + b, 0) / nt.length;
        const acc = Math.round((ROUNDS / (ROUNDS + miss)) * 100);
        setTimeout(() => next(reactionScore(avg, acc)), 1200);
      } else {
        const nr = round + 1; setRound(nr);
        timer.current = setTimeout(() => fire(nr), 500 + Math.random() * 600);
      }
    } else {
      setMiss((m) => m + 1);
    }
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="kivo-card text-center">
      <p className="font-display text-sm font-extrabold uppercase tracking-widest text-amber-600">FASTER · Reaction Mini (5 rounds)</p>
      <h2 className="mt-1 font-display text-2xl font-extrabold">Tap the glowing pod!</h2>
      {phase === 'ready' && <button className="kivo-btn-primary mt-6 w-full" onClick={start}>Ready? →</button>}
      {phase !== 'ready' && (
        <>
          <p className="mt-2 text-sm font-bold text-slate-500">Round {Math.min(round + 1, ROUNDS)}/{ROUNDS}</p>
          <div className="mx-auto mt-3 grid max-w-xs grid-cols-2 gap-4" role="group" aria-label="Reaction pods">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                onPointerDown={() => tap(i)}
                aria-label={`Pod ${i + 1}${active === i ? ' active' : ''}`}
                className={`h-24 rounded-full border-4 font-display text-xl font-extrabold transition-all ${
                  active === i ? 'animate-glow border-amber-400 bg-amber-400 text-white scale-105' : 'border-slate-200 bg-slate-100 text-slate-400'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}
      {phase === 'done' && <p className="animate-pop mt-4 font-display text-3xl font-extrabold">Done! 🎉</p>}
    </motion.div>
  );
}

function AgilityMini({ next }: { next: (score: number) => void }) {
  const SEQ = [1, 3, 5];
  const [pos, setPos] = useState(0);
  const [errors, setErrors] = useState(0);
  const [done, setDone] = useState(false);
  const t0 = useRef(Date.now());

  useEffect(() => { t0.current = Date.now(); }, []);

  const tap = (n: number) => {
    if (done) return;
    if (n === SEQ[pos]) {
      const np = pos + 1; setPos(np);
      if (np >= SEQ.length) {
        setDone(true);
        const sec = (Date.now() - t0.current) / 1000;
        const acc = Math.round((SEQ.length / (SEQ.length + errors)) * 100);
        setTimeout(() => next(agilityScore(sec, acc, errors)), 1200);
      }
    } else setErrors((e) => e + 1);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="kivo-card text-center">
      <p className="font-display text-sm font-extrabold uppercase tracking-widest text-violet-600">CHAMPS · Agility Mini</p>
      <h2 className="mt-1 font-display text-2xl font-extrabold">Tap stations in order</h2>
      <p className="mt-1 font-display text-xl font-extrabold text-violet-700" aria-live="polite">
        {SEQ.map((s, i) => (
          <span key={s} className={i < pos ? 'text-green-500' : ''}>{i > 0 ? ' → ' : ''}{s}</span>
        ))}
      </p>
      <div className="mx-auto mt-3 grid max-w-xs grid-cols-3 gap-3" role="group" aria-label="Stations">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button
            key={n} onPointerDown={() => tap(n)} aria-label={`Station ${n}`}
            className={`h-20 rounded-3xl font-display text-2xl font-extrabold transition-all ${
              pos < SEQ.length && SEQ[pos] === n ? 'bg-violet-500 text-white shadow-pop scale-105' : 'bg-slate-100 text-slate-500'
            } ${SEQ.slice(0, pos).includes(n) ? '!bg-green-100 !text-green-600' : ''}`}
          >
            {SEQ.slice(0, pos).includes(n) ? <Check className="mx-auto" aria-hidden="true" /> : n}
          </button>
        ))}
      </div>
      {done && <p className="animate-pop mt-4 font-display text-3xl font-extrabold">Sequence complete! 🎉</p>}
    </motion.div>
  );
}

function ResultsView({ scores, saving, error, onSave }: { scores: OutcomeScores; saving: boolean; error: string | null; onSave: () => void }) {
  const keys: OutcomeKey[] = ['stronger', 'fitter', 'faster', 'champs'];
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="kivo-card">
      <h2 className="text-center font-display text-3xl font-extrabold">Your KIVO baseline 🎉</h2>
      <div className="mt-5 space-y-4">
        {keys.map((k, i) => {
          const m = outcomeMeta(k);
          return (
            <div key={k}>
              <div className="flex items-center justify-between text-sm font-bold">
                <span style={{ color: m.color }}>{m.label}</span>
                <span className="font-display text-2xl font-extrabold tabular-nums">{scores[k]}/100</span>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full" style={{ background: m.color }}
                  initial={{ width: 0 }} animate={{ width: `${scores[k]}%` }}
                  transition={{ duration: 0.8, delay: i * 0.15 }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600" role="alert">{error}</p>}
      <button className="kivo-btn-primary mt-6 w-full" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : <>Create my KIVO profile <ArrowRight size={18} aria-hidden="true" /></>}
      </button>
    </motion.div>
  );
}
