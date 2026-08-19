import { useEffect, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import Pagination from "../../components/ui/Pagination";
import Badge from "../../components/ui/Badge";
import { reviewService } from "../../services/reviewService";
import { usePagination } from "../../hooks/useApi";

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

  return (
    <div>
      <PageHeader title="Avis" subtitle="Avis laissés par les étudiants sur les formations" />

      {notice && <Alert type="success" className="mb-4" title={notice} />}
      {error && <Alert type="error" className="mb-4" title={error.message} />}

      <Card>
        {loading ? (
          <Spinner />
        ) : reviews.length === 0 ? (
          <EmptyState title="Aucun avis" />
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {pageItems.map((r) => (
                <li key={r.id_avis} className="flex items-start gap-4 py-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{r.prenom} {r.nom}</p>
                      <span className="text-xs text-slate-400">sur</span>
                      <p className="font-medium text-brand-600">{r.formation}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge tone={r.note >= 4 ? "success" : r.note === 3 ? "warning" : "danger"}>
                        {r.note}/5 · {NOTE_LABEL[r.note] || ""}
                      </Badge>
                    </div>
                    {r.commentaire && <p className="mt-2 text-sm text-slate-600">{r.commentaire}</p>}
                  </div>
                  <button
                    type="button"
                    className="btn-ghost !px-3 !py-1.5 !text-xs text-red-600 hover:bg-red-50"
                    onClick={() => setDeleting(r)}
                  >
                    Supprimer
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
