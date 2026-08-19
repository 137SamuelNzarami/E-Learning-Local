import { Icons } from "../Icons";

const STYLES = {
  success: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-800",
    chip: "bg-emerald-600",
  },
  error: {
    box: "border-red-200 bg-red-50 text-red-800",
    chip: "bg-red-600",
  },
  warning: {
    box: "border-accent-200 bg-accent-50 text-accent-800",
    chip: "bg-accent-500",
  },
  info: {
    box: "border-sky-200 bg-sky-50 text-sky-800",
    chip: "bg-sky-600",
  },
};

const ICONS = {
  success: Icons.checkCircle,
  error: Icons.xCircle,
  warning: Icons.alertCircle,
  info: Icons.info,
};

export default function Alert({ type = "info", title, children, className = "" }) {
  if (!children && !title) return null;
  const style = STYLES[type];
  const Icon = ICONS[type];
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${style.box} ${className}`} role="alert">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${style.chip} text-white`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          {title && <p className="font-semibold">{title}</p>}
          {children && <div className={title ? "mt-0.5" : ""}>{children}</div>}
        </div>
      </div>
    </div>
  );
}
