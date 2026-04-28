import { useCallback, useEffect, useMemo, useState } from 'react';
import StatCard from '../components/StatCard.jsx';
import TopTransactionsChart from '../components/charts/TopTransactionsChart.jsx';
import TopUsersChart from '../components/charts/TopUsersChart.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getBalance, getTopTransactions, getTopUsers } from '../api/wallet.js';
import { fmtCurrency, fmtSigned } from '../lib/format.js';

export default function Dashboard() {
  const { username } = useAuth();
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [b, tx, tu] = await Promise.all([
        getBalance(),
        getTopTransactions(),
        getTopUsers(),
      ]);
      setBalance(b?.balance ?? 0);
      setTransactions(tx || []);
      setTopUsers(tu || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const credits = transactions.filter((t) => Number(t.amount) > 0);
    const debits = transactions.filter((t) => Number(t.amount) < 0);
    const topCredit = credits.length
      ? Math.max(...credits.map((t) => Number(t.amount)))
      : 0;
    const topDebit = debits.length
      ? Math.min(...debits.map((t) => Number(t.amount)))
      : 0;
    return {
      txCount: transactions.length,
      topCredit,
      topDebit,
    };
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back, {username}</h1>
          <p className="text-slate-400 mt-0.5 text-sm">
            Live overview of your wallet activity.
          </p>
        </div>
        <button onClick={load} className="btn-ghost" disabled={loading}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-3-6.7" />
            <path d="M21 4v5h-5" />
          </svg>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="card p-4 border-red-500/40 text-red-300 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Current balance"
          value={balance == null ? '—' : fmtCurrency(balance)}
          hint="Available in your wallet"
          accent="brand"
        />
        <StatCard
          label="Top transactions"
          value={stats.txCount}
          hint="Returned by the API"
          accent="slate"
        />
        <StatCard
          label="Largest credit"
          value={stats.topCredit ? fmtSigned(stats.topCredit) : '—'}
          hint="Biggest incoming transfer"
          accent="green"
        />
        <StatCard
          label="Largest debit"
          value={stats.topDebit ? fmtSigned(stats.topDebit) : '—'}
          hint="Biggest outgoing transfer"
          accent="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="My top transactions"
          subtitle="Sorted by absolute value (credits in green, debits in red)"
        >
          <TopTransactionsChart data={transactions} />
        </ChartCard>
        <ChartCard
          title="Top transacting users"
          subtitle="Aggregate outbound (debit) value across all users"
        >
          <TopUsersChart data={topUsers} />
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card p-5">
      <div className="mb-4">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
      </div>
      {children}
    </div>
  );
}
