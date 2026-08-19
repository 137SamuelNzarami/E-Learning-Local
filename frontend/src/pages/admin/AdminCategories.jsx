import { useEffect, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
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
    <div>
      <PageHeader
        title="Catégories"
        subtitle="Organisez les formations par thème"
        actions={<button type="button" className="btn-primary" onClick={openCreate}><Icons.plus className="h-4 w-4" /> Nouvelle catégorie</button>}
      />

      {notice && <Alert type="success" className="mb-4" title={notice} />}
      {error && <Alert type="error" className="mb-4" title={error.message} />}

      <Card>
        {loading ? (
          <Spinner />
        ) : categories.length === 0 ? (
          <EmptyState title="Aucune catégorie" message="Créez votre première catégorie." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {categories.map((cat, idx) => (
              <li key={cat.id_categorie} className="flex items-center gap-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icons.categories />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{cat.nom_categorie}</p>
                  <p className="text-xs text-slate-400">#{cat.id_categorie}</p>
                </div>
                <span className="text-xs text-slate-400">#{idx + 1}</span>
                <button type="button" className="btn-secondary !px-3 !py-1.5 !text-xs mr-2" onClick={() => openEdit(cat)}>
                  Modifier
                </button>
                <button type="button" className="btn-ghost !px-3 !py-1.5 !text-xs text-red-600 hover:bg-red-50" onClick={() => setDeleting(cat)}>
                  Supprimer
                </button>
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
