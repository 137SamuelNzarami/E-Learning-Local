import { Icons } from "../Icons";

export default function StatCard({ label, value, icon, hint }) {
  const Icon = icon;
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-slate-500">{label}</p>
          <p className="tabular mt-1.5 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          {icon ? (typeof icon === "function" ? <Icon /> : icon) : <Icons.chart />}
        </div>
      </div>
    </div>
  );
}
