import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useApp } from './context/AppContext';
import Achievements from './pages/Achievements';
import Assessment from './pages/Assessment';
import ChallengeDetail from './pages/ChallengeDetail';
import Challenges from './pages/Challenges';
import Coach from './pages/Coach';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Onboarding from './pages/Onboarding';
import Parent from './pages/Parent';
import Progress from './pages/Progress';
import Results from './pages/Results';
import RoleSelection from './pages/RoleSelection';
import Settings from './pages/Settings';
import Signup from './pages/Signup';

function NeedAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useApp();
  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Loading KIVO…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function NeedChild({ children }: { children: JSX.Element }) {
  const { child, loading } = useApp();
  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Loading KIVO…</div>;
  if (!child) return <Navigate to="/onboarding" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/onboarding" element={<NeedAuth><Onboarding /></NeedAuth>} />
        <Route path="/assessment" element={<NeedAuth><Assessment /></NeedAuth>} />
        <Route element={<NeedAuth><NeedChild><Layout /></NeedChild></NeedAuth>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/challenge/:id" element={<ChallengeDetail />} />
          <Route path="/results" element={<Results />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/parent" element={<Parent />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
