import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useApp } from './context/AppContext';
import Achievements from './pages/Achievements';
import Analytics from './pages/Analytics';
import Assessment from './pages/Assessment';
import Athletes from './pages/Athletes';
import ChallengeDetail from './pages/ChallengeDetail';
import Challenges from './pages/Challenges';
import Children from './pages/Children';
import Coach from './pages/Coach';
import CoachDash from './pages/CoachDash';
import Dashboard from './pages/Dashboard';
import Insights from './pages/Insights';
import Landing from './pages/Landing';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Onboarding, { OnboardingCoach } from './pages/Onboarding';
import Parent from './pages/Parent';
import Progress from './pages/Progress';
import Results from './pages/Results';
import RoleSelection from './pages/RoleSelection';
import Settings from './pages/Settings';
import Signup, { GuardianRequired, ParentSignup } from './pages/Signup';
import type { ViewRole } from './types';

function NeedAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useApp();
  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Loading KIVO…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function NeedProfile({ children }: { children: JSX.Element }) {
  const { child, loading, viewRole } = useApp();
  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Loading KIVO…</div>;
  if (!child) {
    if (viewRole === 'coach') return <Navigate to="/coach-dash" replace />;
    if (viewRole === 'parent') return <Navigate to="/parent" replace />;
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function NeedRoles({ roles, children }: { roles: ViewRole[]; children: JSX.Element }) {
  const { viewRole, user, loading } = useApp();
  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Loading KIVO…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(viewRole)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/guardian-required" element={<GuardianRequired />} />
        <Route path="/parent-signup" element={<ParentSignup />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/onboarding" element={<NeedAuth><Onboarding /></NeedAuth>} />
        <Route path="/onboarding-coach" element={<NeedAuth><OnboardingCoach /></NeedAuth>} />
        <Route path="/assessment" element={<NeedAuth><Assessment /></NeedAuth>} />
        <Route element={<NeedAuth><Layout /></NeedAuth>}>
          {/* athlete (child + individual) */}
          <Route path="/dashboard" element={<NeedProfile><Dashboard /></NeedProfile>} />
          <Route path="/challenges" element={<NeedProfile><Challenges /></NeedProfile>} />
          <Route path="/challenge/:id" element={<NeedProfile><ChallengeDetail /></NeedProfile>} />
          <Route path="/results" element={<NeedProfile><Results /></NeedProfile>} />
          <Route path="/coach" element={<NeedProfile><Coach /></NeedProfile>} />
          <Route path="/progress" element={<NeedProfile><Progress /></NeedProfile>} />
          <Route path="/achievements" element={<NeedProfile><Achievements /></NeedProfile>} />
          {/* parent */}
          <Route path="/parent" element={<NeedRoles roles={['parent', 'child']}><Parent /></NeedRoles>} />
          <Route path="/children" element={<NeedRoles roles={['parent']}><Children /></NeedRoles>} />
          <Route path="/insights" element={<NeedRoles roles={['parent']}><Insights /></NeedRoles>} />
          {/* coach */}
          <Route path="/coach-dash" element={<NeedRoles roles={['coach']}><CoachDash /></NeedRoles>} />
          <Route path="/athletes" element={<NeedRoles roles={['coach']}><Athletes /></NeedRoles>} />
          <Route path="/analytics" element={<NeedRoles roles={['coach']}><Analytics /></NeedRoles>} />
          {/* shared */}
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
