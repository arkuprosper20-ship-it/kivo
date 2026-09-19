import { Award, BarChart3, HeartHandshake, Home, LayoutDashboard, Settings, Sparkles, Swords, Users } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { ViewRole } from '../types';
import Navbar from './Navbar';

const NAVS: Record<ViewRole, Array<{ to: string; label: string; icon: any }>> = {
  child: [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/challenges', label: 'Challenges', icon: Swords },
    { to: '/coach', label: 'AI Coach', icon: Sparkles },
    { to: '/progress', label: 'Progress', icon: BarChart3 },
    { to: '/achievements', label: 'Badges', icon: Award },
  ],
  parent: [
    { to: '/parent', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/children', label: 'Children', icon: Users },
    { to: '/insights', label: 'Insights', icon: HeartHandshake },
    { to: '/progress', label: 'Progress', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ],
  individual: [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/challenges', label: 'Challenges', icon: Swords },
    { to: '/coach', label: 'AI Coach', icon: Sparkles },
    { to: '/progress', label: 'Progress', icon: BarChart3 },
    { to: '/achievements', label: 'Achievements', icon: Award },
    { to: '/settings', label: 'Settings', icon: Settings },
  ],
  coach: [
    { to: '/coach-dash', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/athletes', label: 'Athletes', icon: Users },
    { to: '/challenges', label: 'Challenges', icon: Swords },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ],
};

export default function Layout() {
  const loc = useLocation();
  const { viewRole } = useApp();
  const links = NAVS[viewRole] || NAVS.child;
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 sm:px-6 py-6 pb-28 md:pb-10">
        <aside className="sticky top-24 hidden h-fit w-52 shrink-0 md:block" aria-label="Primary">
          <nav className="kivo-card !p-3 space-y-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 font-display font-bold text-[15px] transition-colors ${
                    isActive ? 'bg-kivo-600 text-white shadow-pop' : 'text-slate-600 hover:bg-mist'
                  }`
                }
              >
                <l.icon size={20} aria-hidden="true" /> {l.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1" key={loc.pathname}>
          <Outlet />
        </main>
      </div>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-white/95 backdrop-blur md:hidden" aria-label="Primary mobile">
        <div className="mx-auto grid max-w-6xl grid-cols-5 px-2 py-2">
          {links.slice(0, 5).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              aria-label={l.label}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-bold ${
                  isActive ? 'text-kivo-600' : 'text-slate-400'
                }`
              }
            >
              <l.icon size={22} aria-hidden="true" /> {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
