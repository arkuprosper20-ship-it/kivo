import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function LevelProgress({ level, xp, progress }: { level: number; xp: number; progress: number }) {
  return (
    <div className="kivo-card bg-gradient-to-br from-kivo-700 to-kivo-900 !text-white border-0" aria-label={`Level ${level}, ${xp} XP`}>
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-extrabold uppercase tracking-widest text-kivo-200">Level {level}</p>
        <p className="inline-flex items-center gap-1 text-sm font-bold text-amber-300"><Zap size={15} aria-hidden="true" /> {xp} XP</p>
      </div>
      <p className="mt-1 font-display text-3xl font-extrabold">Athlete Lv.{level}</p>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next level">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }} />
      </div>
      <p className="mt-1.5 text-xs font-semibold text-white/70">{Math.round(progress)}% to Level {level + 1}</p>
    </div>
  );
}
