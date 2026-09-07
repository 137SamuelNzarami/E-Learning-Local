import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useOwnedFormations } from "../../hooks/useOwnedFormations";
import { formationServiceExtended } from "../../services/formationService";
import { categoryService } from "../../services/categoryService";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { Icons } from "../../components/Icons";
import { formatDate, getErrorMessage } from "../../utils/format";

export default function FormateurFormations() {
  const { user } = useAuth();
  const { formations, loading, error, reload } = useOwnedFormations();
  const [categories, setCategories] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState("all"); // all, published, draft

  useEffect(() => {
    categoryService.index().then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  const filteredFormations = formations.filter((f) => {
    if (filter === "published") return f.statut === "PUBLIEE";
    if (filter === "draft") return f.statut !== "PUBLIEE";
    return true;
  });

  const publishedCount = formations.filter((f) => f.statut === "PUBLIEE").length;
  const draftCount = formations.length - publishedCount;

  const handleDelete = async (id) => {
    try {
      await formationServiceExtended.destroy(id);
      setDeleting(null);
      reload();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handlePublish = async (id, current) => {
    try {
      if (current === "PUBLIEE") {
        await formationServiceExtended.unpublish(id);
      } else {
        await formationServiceExtended.publish(id);
      }
      reload();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (loading) return <Spinner />;
  if (error) return <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">{getErrorMessage(error)}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Mes formations</h1>
          <p className="page-subtitle">Créez et gérez vos contenus pédagogiques</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowCreate(true)}>
          <Icons.plus className="h-4 w-4" />
          Nouvelle formation
        </button>
      </div>

      {/* Stats + Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-soft">
          {[
            ["all", "Toutes", formations.length],
            ["published", "Publiées", publishedCount],
            ["draft", "Brouillons", draftCount],
          ].map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                filter === key
                  ? "bg-brand-700 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                filter === key ? "bg-white/20" : "bg-slate-100"
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filteredFormations.length === 0 ? (
        <EmptyState
          title={filter === "all" ? "Aucune formation" : filter === "published" ? "Aucune publication" : "Aucun brouillon"}
          message={filter === "all" ? "Créez votre première formation pour commencer." : "Modifiez le filtre ou créez une nouvelle formation."}
          action={<button type="button" className="btn-primary" onClick={() => setShowCreate(true)}>Nouvelle formation</button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFormations.map((f) => (
            <div key={f.id_formation} className="card-interactive group relative overflow-hidden p-5">
              {/* Status indicator */}
              <div className="absolute right-4 top-4">
                <Badge color={f.statut === "PUBLIEE" ? "green" : "amber"}>
                  {f.statut === "PUBLIEE" ? "Publiée" : "Brouillon"}
                </Badge>
              </div>

              {/* Title */}
              <h3 className="pr-16 text-base font-bold text-slate-800 group-hover:text-brand-700 transition-base">
                {f.titre}
              </h3>

              {/* Description */}
              {f.description && (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                  {f.description}
                </p>
              )}

              {/* Meta */}
              <div className="mt-4 flex items-center gap-4 text-[11px] text-slate-400">
                {f.categorie && (
                  <span className="flex items-center gap-1">
                    <Icons.categories className="h-3 w-3" />
                    {f.categorie}
                  </span>
                )}
                {f.date_creation && (
                  <span className="flex items-center gap-1">
                    <Icons.calendar className="h-3 w-3" />
                    {formatDate(f.date_creation)}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                <Link
                  to={`/formateur/formations/${f.id_formation}`}
                  className="btn-secondary btn-sm flex-1"
                >
                  <Icons.edit className="h-3.5 w-3.5" />
                  Construire
                </Link>
                <button
                  type="button"
                  onClick={() => handlePublish(f.id_formation, f.statut)}
                  className={`btn-sm ${f.statut === "PUBLIEE" ? "btn-ghost" : "btn-primary"}`}
                >
                  {f.statut === "PUBLIEE" ? (
                    <><Icons.eye className="h-3.5 w-3.5" /> Dépublier</>
                  ) : (
                    <><Icons.check className="h-3.5 w-3.5" /> Publier</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(f.id_formation)}
                  className="btn-sm !bg-danger-50 !text-danger-600 hover:!bg-danger-100"
                >
                  <Icons.trash className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateFormationModal
          categories={categories}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); reload(); }}
        />
      )}

      {/* Delete Confirm */}
      {deleting && (
        <ConfirmDialog
          open={Boolean(deleting)}
          title="Supprimer cette formation ?"
          message="Cette action est irréversible. Tous les chapitres, sections et contenus associés seront supprimés."
          onConfirm={() => handleDelete(deleting)}
          onCancel={() => setDeleting(null)}
          danger
        />
      )}
    </div>
  );
}

function CreateFormationModal({ categories, onClose, onCreated }) {
  const [form, setForm] = useState({ titre: "", description: "", id_categorie: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titre.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await formationServiceExtended.store({
        titre: form.titre.trim(),
        description: form.description.trim(),
        id_categorie: form.id_categorie || undefined,
      });
      onCreated();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg animate-scale-in rounded-2xl bg-white shadow-lift">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">Nouvelle formation</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-base">
            <Icons.close className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-xs text-danger-700">{error}</div>}
          <div>
            <label className="label">Titre *</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: Introduction à la programmation"
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Décrivez brièvement cette formation..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Catégorie</label>
            <select
              className="select"
              value={form.id_categorie}
              onChange={(e) => setForm({ ...form, id_categorie: e.target.value })}
            >
              <option value="">Sans catégorie</option>
              {categories.map((c) => (
                <option key={c.id_categorie} value={c.id_categorie}>{c.nom_categorie ?? c.nom}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={loading || !form.titre.trim()} className="btn-primary">
              {loading ? "Création..." : "Créer la formation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
