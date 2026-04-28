import { useEffect, useMemo, useState } from 'react';
import { getTopTransactions } from '../api/wallet.js';
import { fmtSigned } from '../lib/format.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'credit', label: 'Credits' },
  { id: 'debit', label: 'Debits' },
];

const PAGE_SIZE_OPTIONS = [5, 10, 25];

export default function Transactions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getTopTransactions();
        if (!cancelled) setRows(data || []);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'Failed to load transactions');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reset to page 1 whenever the filter set changes
  useEffect(() => {
    setPage(1);
  }, [search, filter, pageSize]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const amount = Number(r.amount);
      if (filter === 'credit' && amount <= 0) return false;
      if (filter === 'debit' && amount >= 0) return false;
      if (q && !String(r.username).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, search, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const startIdx = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(safePage * pageSize, filtered.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <p className="text-slate-400 mt-0.5 text-sm">
          Top 10 transactions by absolute value (credits and debits) for your account.
        </p>
      </div>

      <div className="card p-4 md:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              className="input pl-9"
              placeholder="Search by counterparty username…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={[
                    'px-3 py-1.5 text-sm rounded-md transition',
                    active
                      ? 'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30'
                      : 'text-slate-300 hover:bg-slate-800',
                  ].join(' ')}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <select
            className="input md:w-32"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/70 text-slate-400">
              <tr>
                <Th>#</Th>
                <Th>Counterparty</Th>
                <Th>Type</Th>
                <Th align="right">Amount</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <Row colSpan={4} text="Loading transactions…" />
              ) : pageRows.length === 0 ? (
                <Row colSpan={4} text={rows.length === 0 ? 'No transactions found.' : 'No matches for the current filters.'} />
              ) : (
                pageRows.map((tx, i) => {
                  const amount = Number(tx.amount);
                  const isCredit = amount >= 0;
                  return (
                    <tr key={`${tx.username}-${i}`} className="hover:bg-slate-900/40">
                      <Td className="text-slate-500">
                        {(safePage - 1) * pageSize + i + 1}
                      </Td>
                      <Td className="font-medium">{tx.username}</Td>
                      <Td>
                        <span
                          className={[
                            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ring-1',
                            isCredit
                              ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30'
                              : 'bg-red-500/10 text-red-300 ring-red-500/30',
                          ].join(' ')}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isCredit ? 'bg-emerald-400' : 'bg-red-400'}`}
                          />
                          {isCredit ? 'Credit' : 'Debit'}
                        </span>
                      </Td>
                      <Td
                        align="right"
                        className={`font-mono ${isCredit ? 'text-emerald-300' : 'text-red-300'}`}
                      >
                        {fmtSigned(amount)}
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-slate-400">
          <div>
            Showing <span className="text-slate-200">{startIdx}</span>–
            <span className="text-slate-200">{endIdx}</span> of{' '}
            <span className="text-slate-200">{filtered.length}</span>
            {filtered.length !== rows.length && (
              <span className="text-slate-500"> (filtered from {rows.length})</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              Prev
            </button>
            <span className="px-3 text-slate-300">
              Page {safePage} of {totalPages}
            </span>
            <button
              className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Th({ children, align = 'left' }) {
  return (
    <th
      className={`px-4 py-2.5 text-xs font-medium uppercase tracking-wider ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  );
}

function Td({ children, align = 'left', className = '' }) {
  return (
    <td className={`px-4 py-3 ${align === 'right' ? 'text-right' : ''} ${className}`}>
      {children}
    </td>
  );
}

function Row({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-500">
        {text}
      </td>
    </tr>
  );
}
