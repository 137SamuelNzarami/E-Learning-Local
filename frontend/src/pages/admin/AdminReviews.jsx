import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import Pagination from "../../components/ui/Pagination";
import Badge from "../../components/ui/Badge";
import { reviewService } from "../../services/reviewService";
import { usePagination } from "../../hooks/useApi";
import { Icons } from "../../components/Icons";

const NOTE_LABEL = { 1: "Très mauvais", 2: "Mauvais", 3: "Moyen", 4: "Bon", 5: "Excellent" };

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const pagination = usePagination(reviews.length);

  const load = () => {
    setLoading(true);
    reviewService
      .index()
      .then((res) => setReviews(res.data || []))
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await reviewService.destroy(deleting.id_avis);
      setNotice("Avis supprimé.");
      setDeleting(null);
      load();
    } catch (err) {
      setError(err);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const pageItems = reviews.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );

  const avgNote = reviews.length
    ? (reviews.reduce((s, r) => s + Number(r.note), 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Avis</h1>
        <p className="page-subtitle">Avis laissés par les étudiants sur les formations</p>
      </div>

      {notice && (
        <div className="animate-slide-up rounded-xl border border-success-200 bg-success-50 p-3 text-sm font-medium text-success-700">
          {notice}
        </div>
      )}
      {error && <Alert type="error" title={error.message} />}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card">
          <p className="stat-label">Total avis</p>
          <p className="stat-value text-lg">{reviews.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Note moyenne</p>
          <div className="flex items-center gap-2">
            <p className="stat-value text-lg">{avgNote}</p>
            {avgNote !== "—" && <span className="text-xs text-amber-500">/5</span>}
          </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8"><Spinner /></div>
        ) : reviews.length === 0 ? (
          <div className="p-8"><EmptyState title="Aucun avis" message="Les avis des étudiants apparaîtront ici." /></div>
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {pageItems.map((r) => (
                <li key={r.id_avis} className="flex items-start gap-4 px-5 py-4 transition-base hover:bg-slate-50/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                    {(r.prenom || "?")[0]}{(r.nom || "?")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{r.prenom} {r.nom}</p>
                      <span className="text-[11px] text-slate-400">sur</span>
                      <p className="text-sm font-medium text-brand-600">{r.formation}</p>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Icons.star key={s} className={`h-3.5 w-3.5 ${s <= Number(r.note) ? "text-amber-400" : "text-slate-200"}`} />
                        ))}
                      </div>
                      <Badge tone={r.note >= 4 ? "success" : r.note === 3 ? "warning" : "danger"}>
                        {r.note}/5
                      </Badge>
                      <span className="text-[11px] text-slate-400">{NOTE_LABEL[r.note]}</span>
                    </div>
                    {r.commentaire && (
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.commentaire}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-ghost btn-sm !text-danger-500 hover:!bg-danger-50"
                    onClick={() => setDeleting(r)}
                  >
                    <Icons.trash className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-slate-200">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={reviews.length}
                limit={pagination.limit}
                onPageChange={pagination.setPage}
                onLimitChange={(l) => pagination.setLimit(l)}
              />
            </div>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
        title="Supprimer cet avis ?"
        message="Cet avis sera définitivement supprimé."
      />
    </div>
  );
}
