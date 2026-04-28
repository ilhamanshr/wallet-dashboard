import { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '../components/Modal.jsx';
import StatCard from '../components/StatCard.jsx';
import TopTransactionsChart from '../components/charts/TopTransactionsChart.jsx';
import TopUsersChart from '../components/charts/TopUsersChart.jsx';
import TopupForm from '../components/forms/TopupForm.jsx';
import TransferForm from '../components/forms/TransferForm.jsx';
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

  const [openModal, setOpenModal] = useState(null); // 'topup' | 'transfer' | null
  const [toast, setToast] = useState(null); // { kind: 'success' | 'error', message }

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

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

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

  const handleTopupSuccess = (amount) => {
    setOpenModal(null);
    setToast({
      kind: 'success',
      message: `Topped up ${fmtCurrency(amount)} successfully.`,
    });
    load();
  };

  const handleTransferSuccess = ({ recipient, amount }) => {
    setOpenModal(null);
    setToast({
      kind: 'success',
      message: `Sent ${fmtCurrency(amount)} to ${recipient}.`,
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back, {username}</h1>
          <p className="text-slate-400 mt-0.5 text-sm">
            Live overview of your wallet activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpenModal('topup')} className="btn-ghost">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Top up
          </button>
          <button onClick={() => setOpenModal('transfer')} className="btn-primary">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
            Transfer
          </button>
          <button onClick={load} className="btn-ghost" disabled={loading}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-3-6.7" />
              <path d="M21 4v5h-5" />
            </svg>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
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

      <Modal
        open={openModal === 'topup'}
        onClose={() => setOpenModal(null)}
        title="Top up balance"
        subtitle="Add funds to your wallet."
      >
        <TopupForm onSuccess={handleTopupSuccess} onCancel={() => setOpenModal(null)} />
      </Modal>

      <Modal
        open={openModal === 'transfer'}
        onClose={() => setOpenModal(null)}
        title="Send transfer"
        subtitle="Move funds to another user."
      >
        <TransferForm
          currentBalance={balance}
          onSuccess={handleTransferSuccess}
          onCancel={() => setOpenModal(null)}
        />
      </Modal>

      {toast && (
        <div
          className={[
            'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg ring-1 text-sm',
            toast.kind === 'success'
              ? 'bg-emerald-500/15 text-emerald-200 ring-emerald-500/40'
              : 'bg-red-500/15 text-red-200 ring-red-500/40',
          ].join(' ')}
        >
          {toast.message}
        </div>
      )}
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