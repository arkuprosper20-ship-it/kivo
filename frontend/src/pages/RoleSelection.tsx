import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/** Post-signup router: sends each role to the right onboarding. */
export default function RoleSelection() {
  const { user } = useApp();
  const nav = useNavigate();
  useEffect(() => {
    if (user?.role === 'coach') nav('/onboarding-coach', { replace: true });
    else nav('/onboarding', { replace: true });
  }, [user, nav]);
  return <div className="p-10 text-center font-bold text-slate-500">Setting up your KIVO…</div>;
}
