import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import type { Badge } from '../types';
import { badgeLabel } from '../config/theme';

/** Full-screen LEVEL UP + badge celebration overlay. */
export default function Celebrate({ levelUp, newLevel, badges, onDone }: {
  levelUp: boolean; newLevel: number; badges: Badge[]; onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 4200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-6"
        onClick={onDone} role="dialog" aria-label="Celebration"
      >
        <motion.div
          initial={{ scale: 0.7, y: 30 }} animate={{ scale: 1, y: 0 }}
          className="kivo-card max-w-sm text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {levelUp && (
            <>
              <p className="animate-pop text-6xl" aria-hidden="true">🎉</p>
              <h2 className="mt-2 font-display text-4xl font-extrabold text-kivo-700">LEVEL UP!</h2>
              <p className="mt-1 font-display text-xl font-bold">You reached Level {newLevel}!</p>
            </>
          )}
          {badges.map((b) => (
            <div key={b.id} className="animate-pop mt-3 rounded-2xl bg-amber-50 p-3">
              <p className="text-4xl" aria-hidden="true">{badgeLabel(b.badgeName).icon}</p>
              <p className="font-display font-extrabold">{badgeLabel(b.badgeName).label} unlocked!</p>
            </div>
          ))}
          {!levelUp && !badges.length && <p className="font-display text-2xl font-extrabold">🎉 Awesome work!</p>}
          <button className="kivo-btn-primary mt-4 w-full" onClick={onDone}>Keep going →</button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
