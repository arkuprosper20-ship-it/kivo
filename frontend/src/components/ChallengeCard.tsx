import { motion } from 'framer-motion';
import { ArrowRight, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ChallengeDef } from '../types';

const ACCENT: Record<string, string> = {
  'rope-rush': 'from-green-500 to-emerald-600',
  'reaction-rush': 'from-amber-400 to-orange-500',
  'agility-command': 'from-violet-500 to-purple-700',
  'power-pulse': 'from-blue-500 to-indigo-700',
  'endurance-quest': 'from-teal-400 to-cyan-600',
  'balance-master': 'from-fuchsia-500 to-purple-700',
};

export default function ChallengeCard({ c, best }: { c: ChallengeDef; best?: number }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="kivo-card flex flex-col">
      <div className={`-mx-5 -mt-5 sm:-mx-6 sm:-mt-6 mb-4 bg-gradient-to-r ${ACCENT[c.id] || 'from-kivo-500 to-kivo-700'} px-5 sm:px-6 py-5 rounded-t-3xl`}>
        <p className="text-xs font-extrabold uppercase tracking-widest text-white/80">{c.category}</p>
        <h3 className="font-display text-2xl font-extrabold text-white">{c.name}</h3>
      </div>
      <p className="text-sm text-slate-600 flex-1">{c.description}</p>
      <div className="mt-3 flex items-center gap-3 text-sm font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1"><Timer size={15} aria-hidden="true" /> {c.duration}</span>
        <span>• {c.difficulty}</span>
        {typeof best === 'number' && <span className="ml-auto rounded-full bg-mist px-3 py-1 text-xs font-bold">Best {best}</span>}
      </div>
      <Link to={`/challenge/${c.id}`} className="kivo-btn-primary mt-4 w-full" aria-label={`Start ${c.name}`}>
        Start <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </motion.div>
  );
}
