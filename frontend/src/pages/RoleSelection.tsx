import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function RoleSelection() {
  const { user } = useApp();
  return (
    <div className="mx-auto max-w-lg px-4 py-12 text-center">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-5xl" aria-hidden="true">🎉</p>
        <h1 className="mt-4 font-display text-3xl font-extrabold">Welcome{user ? `, ${user.name}` : ''}!</h1>
        <p className="mt-2 text-slate-600">
          {user?.role === 'parent'
            ? 'Next, create your child’s profile — then a quick 2-minute assessment sets their baseline.'
            : 'Next, set up an athlete profile — then a quick assessment sets your baseline.'}
        </p>
        <Link to="/onboarding" className="kivo-btn-primary mt-6 w-full">
          Create child profile <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <p className="mt-3 text-xs text-slate-500">We only ask for a name, age and height — nothing sensitive.</p>
      </motion.div>
    </div>
  );
}
