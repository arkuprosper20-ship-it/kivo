import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Swords, Trophy } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import KivoLogo from '../components/KivoLogo';
import { Spinner } from '../components/ScoreCard';
import { useApp } from '../context/AppContext';

export default function Landing() {
  const { user, loginDemo, authError, loading } = useApp();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="mx-auto max-w-6xl p-10"><Spinner label="Loading KIVO…" /></div>;
  if (user) { nav('/dashboard'); return null; }

  const demo = async () => {
    setBusy(true);
    try { await loginDemo(); nav('/dashboard'); } catch { /* error shown below */ }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-kivo-900 via-kivo-700 to-kivo-600 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 flex items-center justify-between">
        <span className="[&_span:last-child]:text-white"><KivoLogo /></span>
        <div className="flex gap-2">
          <Link to="/login" className="rounded-xl px-4 py-2 text-sm font-bold text-white/90 hover:bg-white/10">Log in</Link>
          <Link to="/signup" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-kivo-700 hover:bg-kivo-50">Sign up</Link>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-14 pb-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
            <Sparkles size={14} aria-hidden="true" /> AI-powered athletic development · ages 5–16
          </p>
          <h1 className="mt-6 font-display text-6xl sm:text-8xl font-extrabold tracking-tight">KIVO</h1>
          <p className="mt-3 font-display text-2xl sm:text-3xl font-bold text-kivo-100">Train. Progress. Become.</p>
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-white/85">
            KIVO doesn't just give kids something to play with. It gives them a way to
            <strong> see themselves getting better</strong> — measurable challenges, personal bests, and an AI coach.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mx-auto mt-9 flex max-w-md flex-col gap-3"
        >
          <button onClick={demo} className="kivo-btn-ghost !bg-amber-400 !text-ink hover:!bg-amber-300 text-lg" disabled={busy}>
            Continue as Demo <ArrowRight size={20} aria-hidden="true" />
          </button>
          <div className="flex gap-3">
            <Link to="/login" className="kivo-btn-ghost flex-1 !bg-white/15 !text-white !shadow-none hover:!bg-white/25">Log in</Link>
            <Link to="/signup" className="kivo-btn-ghost flex-1 !bg-white/15 !text-white !shadow-none hover:!bg-white/25">Sign up</Link>
          </div>
          {authError && <p className="rounded-2xl bg-red-500/20 p-3 text-sm font-semibold" role="alert">{authError}</p>}
          <p className="text-xs text-white/60">Demo loads Aarav (10) with a full week of progress — no account needed.</p>
        </motion.div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-4 text-left sm:grid-cols-4">
          {[
            { t: 'STRONGER', d: 'Grip, power, body control', c: 'bg-blue-500' },
            { t: 'FITTER', d: 'Stamina & coordination', c: 'bg-green-500' },
            { t: 'FASTER', d: 'Speed, agility, reaction', c: 'bg-amber-500' },
            { t: 'CHAMPS', d: 'Goals & progression', c: 'bg-violet-500' },
          ].map((o, i) => (
            <motion.div key={o.t} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.08 }} className="rounded-3xl bg-white/10 p-4 backdrop-blur">
              <span className={`inline-block h-2.5 w-10 rounded-full ${o.c}`} aria-hidden="true" />
              <p className="mt-2 font-display font-extrabold">{o.t}</p>
              <p className="text-sm text-white/75">{o.d}</p>
            </motion.div>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-white/70">
          <span className="inline-flex items-center gap-2"><Swords size={16} aria-hidden="true" /> 3 interactive challenges</span>
          <span className="inline-flex items-center gap-2"><Trophy size={16} aria-hidden="true" /> Personal bests & badges</span>
          <span className="inline-flex items-center gap-2"><Sparkles size={16} aria-hidden="true" /> AI coaching</span>
        </div>
      </main>
    </div>
  );
}
