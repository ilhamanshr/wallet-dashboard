import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { registerUser } from '../api/wallet';
import { useAuth } from '../context/AuthContext';
import { findCredential, hasUsername, saveCredential } from '../lib/credentials';

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError('Username and password are required.');
      return;
    }

    setSubmitting(true);
    try {
      // Returning user on this browser → verify password locally.
      if (hasUsername(trimmedUsername)) {
        const cred = await findCredential(trimmedUsername, password);
        if (!cred) {
          setError('Invalid password for this username.');
          return;
        }
        login(cred.token, trimmedUsername);
        navigate(from, { replace: true });
        return;
      }

      // New username on this browser → register against backend.
      const { token } = await registerUser(trimmedUsername);
      await saveCredential(trimmedUsername, password, token);
      login(token, trimmedUsername);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response?.status === 409) {
        setError(
          'Username already taken on the server. Pick a different username (this browser has no saved credentials for it).',
        );
      } else if (err.response?.status === 400) {
        setError('Invalid username. Try alphanumeric, 3+ characters.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full grid place-items-center p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="card p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 ring-1 ring-brand-500/40 grid place-items-center text-brand-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 1 0 0 4h16v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-4" />
              <circle cx="17" cy="14" r="1.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-tight">Wallet Admin</h1>
            <p className="text-xs text-slate-400">Crypto wallet dashboard</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm text-slate-300 mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="alice"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-slate-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in / Register'}
          </button>
        </form>

        <p className="mt-5 text-xs text-slate-500 leading-relaxed">
          New users are auto-registered on first sign-in. Your password is hashed
          locally and never sent to the wallet API (the backend uses JWT tokens).
        </p>
      </div>
    </div>
  );
}
