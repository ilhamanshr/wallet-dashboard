import { useState } from 'react';
import { topup } from '../../api/wallet';
import { useGroupedNumberInput } from '../../hooks/useGroupedNumberInput';

const MAX_TOPUP = 10_000_000;

export default function TopupForm({ onSuccess, onCancel }) {
  const { value: amount, inputProps } = useGroupedNumberInput('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Amount must be a positive number.');
      return;
    }
    if (value >= MAX_TOPUP) {
      setError(`Amount must be less than ${MAX_TOPUP.toLocaleString()}.`);
      return;
    }

    setSubmitting(true);
    try {
      await topup(value);
      onSuccess?.(value);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.response?.status === 400
            ? 'Invalid topup amount.'
            : 'Topup failed. Please try again.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="topup-amount" className="block text-sm text-slate-300 mb-1.5">
          Amount
        </label>
        <input
          id="topup-amount"
          className="input"
          placeholder="0.00"
          autoFocus
          {...inputProps}
        />
        <p className="text-xs text-slate-500 mt-1.5">
          Positive values only, must be less than {MAX_TOPUP.toLocaleString()}.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Processing…' : 'Top up'}
        </button>
      </div>
    </form>
  );
}
