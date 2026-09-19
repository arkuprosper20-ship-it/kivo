import { motion } from 'framer-motion';
import { badgeLabel } from '../config/theme';

export default function BadgeCard({ name, earned, earnedAt }: { name: string; earned: boolean; earnedAt?: string }) {
  const { label, icon } = badgeLabel(name);
  return (
    <motion.div
      whileHover={earned ? { y: -3 } : undefined}
      className={`rounded-3xl p-4 text-center shadow-card ${earned ? 'bg-white' : 'bg-slate-100/70'}`}
      aria-label={`${label}: ${earned ? 'earned' : 'locked'}`}
    >
      <p className={`text-4xl ${earned ? '' : 'opacity-30 grayscale'}`} aria-hidden="true">{icon}</p>
      <p className={`mt-2 font-display text-sm font-extrabold ${earned ? '' : 'text-slate-400'}`}>{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-slate-400">
        {earned ? (earnedAt ? new Date(earnedAt).toLocaleDateString() : 'Earned') : '🔒 Locked'}
      </p>
    </motion.div>
  );
}
