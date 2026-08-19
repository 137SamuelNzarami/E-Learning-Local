import { Icons } from "../Icons";

export default function EmptyState({ icon, title, message, action }) {
  const Icon = icon;
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        {icon ? (typeof icon === "function" ? <Icon /> : icon) : <Icons.inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {message && <p className="max-w-sm text-sm leading-relaxed text-slate-500">{message}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
