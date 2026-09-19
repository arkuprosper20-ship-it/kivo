import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AIInsightCard({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="kivo-card border-2 border-kivo-100 bg-gradient-to-br from-kivo-50 to-white"
    >
      <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-widest text-kivo-700">
        <Sparkles size={16} aria-hidden="true" /> KIVO Coach
      </p>
      <p className={`mt-2 font-medium text-slate-700 ${compact ? 'text-sm line-clamp-3' : ''}`}>{text}</p>
      {compact && <Link to="/coach" className="mt-2 inline-block text-sm font-bold text-kivo-600 hover:underline">Ask KIVO Coach →</Link>}
    </motion.div>
  );
}
