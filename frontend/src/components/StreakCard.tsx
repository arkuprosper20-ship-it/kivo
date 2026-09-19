import { motion } from 'framer-motion';

export default function StreakCard({ days }: { days: number }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="kivo-card flex items-center gap-4 bg-gradient-to-r from-orange-500 to-amber-500 !text-white border-0">
      <span className="text-5xl" aria-hidden="true">🔥</span>
      <div>
        <p className="font-display text-3xl font-extrabold tabular-nums">{days} day{days === 1 ? '' : 's'}</p>
        <p className="text-sm font-semibold text-white/85">Training streak — keep it burning!</p>
      </div>
    </motion.div>
  );
}
