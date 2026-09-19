import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import ChallengeTimer from '../components/ChallengeTimer';

export type ShellPhase = 'brief' | 'countdown' | 'active' | 'paused' | 'done';

/** Shared frame: title, timer, pause/resume, countdown overlay. Games render inside. */
export default function ChallengeShell({
  title,
  subtitle,
  secondsLeft,
  totalSeconds,
  showTimer,
  phase,
  count,
  onPause,
  onResume,
  children,
}: {
  title: string;
  subtitle: string;
  secondsLeft: number;
  totalSeconds: number;
  showTimer: boolean;
  phase: ShellPhase;
  count: string | null;
  onPause?: () => void;
  onResume?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold">{title}</h1>
        <p className="mt-1 font-semibold text-slate-500">{subtitle}</p>
      </div>

      {showTimer && (
        <div className="kivo-card mt-4">
          <ChallengeTimer seconds={secondsLeft} total={totalSeconds} />
          {(phase === 'active' || phase === 'paused') && (onPause || onResume) && (
            <div className="mt-3 flex justify-center gap-2">
              {phase === 'active' && onPause && (
                <button className="kivo-btn-ghost !min-h-[44px] !py-2 text-sm" onClick={onPause} aria-label="Pause challenge">
                  <Pause size={16} aria-hidden="true" /> Pause
                </button>
              )}
              {phase === 'paused' && onResume && (
                <button className="kivo-btn-primary !min-h-[44px] !py-2 text-sm" onClick={onResume} aria-label="Resume challenge">
                  <Play size={16} aria-hidden="true" /> Resume
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="relative mt-4">
        {children}
        <AnimatePresence>
          {(phase === 'countdown' || phase === 'paused') && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-ink/70 p-6 text-center"
            >
              {phase === 'countdown' && (
                <motion.p key={count} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="font-display text-7xl font-extrabold text-white" aria-live="assertive">
                  {count}
                </motion.p>
              )}
              {phase === 'paused' && <p className="font-display text-4xl font-extrabold text-white">Paused ⏸️</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** 3-2-1-READY countdown driver. Calls onDone when finished. */
export function useCountdown(active: boolean, onDone: () => void): string | null {
  const [count, setCount] = useState<string | null>(null);
  useEffect(() => {
    if (!active) { setCount(null); return; }
    const seq = ['3', '2', '1', 'READY?'];
    let i = 0;
    setCount(seq[0]);
    const t = setInterval(() => {
      i += 1;
      if (i >= seq.length) { clearInterval(t); setCount(null); onDone(); }
      else setCount(seq[i]);
    }, 750);
    return () => clearInterval(t);
  }, [active]);
  return count;
}
