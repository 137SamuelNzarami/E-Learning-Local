import { Icons } from "../Icons";

export default function Pagination({ page, totalPages, total, limit, onPageChange, onLimitChange }) {
  if (total === 0) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i += 1) {
    if (totalPages <= 7 || i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span>{total} résultat{total > 1 ? "s" : ""}</span>
        <select
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs shadow-soft"
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
        >
          <option value={5}>5 / page</option>
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
        </select>
      </div>
      <nav className="flex items-center gap-1">
        <button
          type="button"
          className="btn-secondary !px-3 !py-1.5 !text-xs"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <Icons.chevronLeft className="h-4 w-4" />
          Précédent
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="px-1 text-slate-400">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition ${
                p === page
                  ? "bg-brand-700 text-white shadow-soft"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          className="btn-secondary !px-3 !py-1.5 !text-xs"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Suivant
          <Icons.chevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
