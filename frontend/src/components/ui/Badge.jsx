const STYLES = {
  gray: "bg-slate-100 text-slate-600",
  brand: "bg-brand-100 text-brand-800",
  green: "bg-emerald-100 text-emerald-800",
  red: "bg-red-100 text-red-700",
  amber: "bg-accent-100 text-accent-800",
  sky: "bg-sky-100 text-sky-800",
  violet: "bg-violet-100 text-violet-700",
};

const TONES = {
  success: "green",
  warning: "amber",
  danger: "red",
  info: "sky",
};

export default function Badge({ children, color = "gray", tone, className = "" }) {
  const resolved = tone ? TONES[tone] || color : color;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[resolved]} ${className}`}
    >
      {children}
    </span>
  );
}

export const ROLE_COLORS = {
  Administrateur: "brand",
  Formateur: "amber",
  Etudiant: "sky",
};

export function RoleBadge({ role }) {
  return <Badge color={ROLE_COLORS[role] || "gray"}>{role}</Badge>;
}
