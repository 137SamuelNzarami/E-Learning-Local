export default function Spinner({ label = "Chargement..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-700" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
