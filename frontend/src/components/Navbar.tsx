import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import KivoLogo from './KivoLogo';

export default function Navbar() {
  const { user, child, logout } = useApp();
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to={user ? '/dashboard' : '/'} aria-label="KIVO home"><KivoLogo size={34} /></Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {child && (
            <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-mist px-4 py-2 text-sm font-semibold">
              <span className="inline-block h-6 w-6 rounded-full text-center text-xs font-bold leading-6 text-white" style={{ background: child.avatarColor }}>
                {child.name.slice(0, 1).toUpperCase()}
              </span>
              {child.name}
            </span>
          )}
          {user ? (
            <button
              className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-mist"
              onClick={() => { logout(); nav('/'); }}
            >
              Log out
            </button>
          ) : (
            <>
              <Link to="/login" className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-mist">Log in</Link>
              <Link to="/signup" className="rounded-xl bg-kivo-600 px-4 py-2 text-sm font-bold text-white hover:bg-kivo-700">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
