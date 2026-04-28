export default function StatCard({ label, value, hint, accent = 'brand' }) {
  const accents = {
    brand: 'text-brand-300',
    green: 'text-emerald-300',
    red: 'text-red-300',
    slate: 'text-slate-200',
  };
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${accents[accent] || accents.brand}`}>
        {value}
      </div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}
