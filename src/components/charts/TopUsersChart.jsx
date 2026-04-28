import { Bar } from 'react-chartjs-2';
import './chartSetup';
import { fmtCurrency } from '../../lib/format';

export default function TopUsersChart({ data }) {
  if (!data?.length) {
    return <EmptyState label="No top users yet." />;
  }

  const chartData = {
    labels: data.map((d) => d.username),
    datasets: [
      {
        label: 'Total transferred (debit)',
        data: data.map((d) => Number(d.transacted_value)),
        backgroundColor: 'rgba(34, 211, 238, 0.85)',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Transferred: ${fmtCurrency(ctx.parsed.x)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(148,163,184,0.1)' },
        ticks: { callback: (val) => fmtCurrency(val) },
      },
      y: { grid: { display: false } },
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
