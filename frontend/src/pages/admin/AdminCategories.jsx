import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import FieldError, { FormAlert } from "../../components/ui/FieldError";
import { categoryService } from "../../services/categoryService";
import { Icons } from "../../components/Icons";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [nom, setNom] = useState("");
  const [formError, setFormError] = useState(null);

  const load = () => {
    setLoading(true);
    categoryService
      .index()
      .then((res) => setCategories(res.data || []))
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setNom("");
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setNom(cat.nom_categorie);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      if (editing) {
        await categoryService.update(editing.id_categorie, { nom_categorie: nom });
        setNotice("Catégorie modifiée.");
      } else {
        await categoryService.store({ nom_categorie: nom });
        setNotice("Catégorie créée.");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await categoryService.destroy(deleting.id_categorie);
      setNotice("Catégorie supprimée.");
      setDeleting(null);
      load();
    } catch (err) {
      setError(err);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Catégories</h1>
          <p className="page-subtitle">Organisez les formations par thème</p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Icons.plus className="h-4 w-4" /> Nouvelle catégorie
        </button>
      </div>

      {notice && (
        <div className="animate-slide-up rounded-xl border border-success-200 bg-success-50 p-3 text-sm font-medium text-success-700">
          {notice}
        </div>
      )}
      {error && <Alert type="error" title={error.message} />}

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-8"><Spinner /></div>
        ) : categories.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Aucune catégorie"
              message="Créez votre première catégorie pour organiser vos formations."
              action={<button type="button" className="btn-primary" onClick={openCreate}>Nouvelle catégorie</button>}
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {categories.map((cat, idx) => (
              <li key={cat.id_categorie} className="flex items-center gap-4 px-5 py-3 transition-base hover:bg-slate-50/50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icons.categories className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{cat.nom_categorie}</p>
                  <p className="text-[11px] text-slate-400">ID: {cat.id_categorie}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit(cat)}>
                    <Icons.edit className="h-3 w-3" /> Modifier
                  </button>
                  <button type="button" className="btn-ghost btn-sm !text-danger-500 hover:!bg-danger-50" onClick={() => setDeleting(cat)}>
                    <Icons.trash className="h-3 w-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Modifier la catégorie" : "Nouvelle catégorie"}
        footer={
          <button type="submit" form="category-form" className="btn-primary" disabled={busy}>
            {busy ? "Enregistrement..." : "Enregistrer"}
          </button>
        }
      >
        <FormAlert error={formError} />
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nom de la catégorie</label>
            <input className="input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : Développement web" />
            <FieldError error={formError} name="nom_categorie" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
        title="Supprimer cette catégorie ?"
        message={`La catégorie « ${deleting?.nom_categorie} » sera définitivement supprimée.`}
      />
    </div>
  );
}
