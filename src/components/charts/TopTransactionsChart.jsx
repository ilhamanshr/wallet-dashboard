import { Bar } from 'react-chartjs-2';
import './chartSetup';
import { fmtSigned } from '../../lib/format';

const CREDIT = 'rgba(74, 222, 128, 0.85)';
const DEBIT = 'rgba(248, 113, 113, 0.85)';

export default function TopTransactionsChart({ data }) {
  if (!data?.length) {
    return <EmptyState label="No transactions yet." />;
  }

  const chartData = {
    labels: data.map((d) => d.username),
    datasets: [
      {
        label: 'Amount',
        data: data.map((d) => Number(d.amount)),
        backgroundColor: data.map((d) => (Number(d.amount) >= 0 ? CREDIT : DEBIT)),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = Number(ctx.parsed.y);
            const kind = v >= 0 ? 'Credit' : 'Debit';
            return `${kind}: ${fmtSigned(v)}`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: 'rgba(148,163,184,0.1)' },
        ticks: { callback: (val) => fmtSigned(val) },
      },
    },
  };

  return (
    <div className="h-72">
      <Bar data={chartData} options={options} />
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="h-72 grid place-items-center text-slate-500 text-sm">{label}</div>
  );
}
