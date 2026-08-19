export function ProgressBar({ value = 0, color = "bg-brand-700" }) {
  const safe = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}
