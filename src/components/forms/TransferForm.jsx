import { useState } from 'react';
import { transfer } from '../../api/wallet';
import { useGroupedNumberInput } from '../../hooks/useGroupedNumberInput';

export default function TransferForm({ currentBalance, onSuccess, onCancel }) {
  const [toUsername, setToUsername] = useState('');
  const { value: amount, inputProps: amountProps } = useGroupedNumberInput('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const recipient = toUsername.trim();
    const value = Number(amount);

    if (!recipient) {
      setError('Recipient username is required.');
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError('Amount must be a positive number.');
      return;
    }
    if (currentBalance != null && value > Number(currentBalance)) {
      setError('Amount exceeds your current balance.');
      return;
    }

    setSubmitting(true);
    try {
      await transfer(recipient, value);
      onSuccess?.({ recipient, amount: value });
    } catch (err) {
      const status = err.response?.status;
      if (status === 400) {
        setError(err.response?.data?.message || 'Insufficient balance or invalid amount.');
      } else if (status === 404) {
        setError(`User "${recipient}" does not exist.`);
      } else {
        setError(err.response?.data?.message || 'Transfer failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="transfer-to" className="block text-sm text-slate-300 mb-1.5">
          Recipient username
        </label>
        <input
          id="transfer-to"
          className="input"
          type="text"
          value={toUsername}
          onChange={(e) => setToUsername(e.target.value)}
          placeholder="bob"
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="transfer-amount" className="block text-sm text-slate-300 mb-1.5">
          Amount
        </label>
        <input
          id="transfer-amount"
          className="input"
          placeholder="0.00"
          {...amountProps}
        />
        {currentBalance != null && (
          <p className="text-xs text-slate-500 mt-1.5">
            Available balance: {Number(currentBalance).toLocaleString()}
          </p>
        )}
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
          {submitting ? 'Sending…' : 'Send transfer'}
        </button>
      </div>
    </form>
  );
}
