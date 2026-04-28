import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/transactions',
    label: 'Transactions',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h13l-3-3" />
        <path d="M21 17H8l3 3" />
      </svg>
    ),
  },
];

export default function Layout() {
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-full flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-slate-900/60 border-r border-slate-800">
        <div className="px-5 py-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-500/15 ring-1 ring-brand-500/40 grid place-items-center text-brand-400">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 1 0 0 4h16v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-4" />
              <circle cx="17" cy="14" r="1.5" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Wallet Admin</div>
            <div className="text-[11px] text-slate-500">v0.1.0</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
                  isActive
                    ? 'bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/30'
                    : 'text-slate-300 hover:bg-slate-800/70',
                ].join(' ')
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 grid place-items-center text-xs font-semibold uppercase">
              {(username || '?').slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{username}</div>
              <div className="text-xs text-slate-500">Signed in</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost w-full mt-2 text-sm">
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60">
          <div className="font-semibold">Wallet Admin</div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">{username}</span>
            <button onClick={handleLogout} className="btn-ghost text-xs px-2 py-1">
              Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
