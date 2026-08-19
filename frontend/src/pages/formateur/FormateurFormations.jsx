import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import FieldError, { FormAlert } from "../../components/ui/FieldError";
import { formationService } from "../../services/formationService";
import { categoryService } from "../../services/categoryService";
import { useOwnedFormations } from "../../hooks/useOwnedFormations";
import { Icons } from "../../components/Icons";

export default function FormateurFormations() {
  const { formations, loading, error } = useOwnedFormations();
  const [categories, setCategories] = useState([]);
  const [notice, setNotice] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ titre: "", description: "", id_categorie: "" });
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    categoryService.index().then((res) => setCategories(res.data || [])).catch(() => {});
  }, []);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await formationService.store({
        titre: form.titre,
        description: form.description,
        id_categorie: Number(form.id_categorie),
      });
      setNotice("Formation créée. Vous en êtes le formateur.");
      setModalOpen(false);
      setForm({ titre: "", description: "", id_categorie: "" });
      window.location.reload();
    } catch (err) {
      setFormError(err);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await formationService.destroy(deleting.id_formation);
      setNotice("Formation supprimée.");
      setDeleting(null);
      window.location.reload();
    } catch (err) {
      setNotice(null);
      setFormError(err);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Mes formations"
        subtitle="Formations dont vous êtes le formateur"
        actions={
          <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
            <Icons.plus className="h-4 w-4" /> Nouvelle formation
          </button>
        }
      />

      {notice && <Alert type="success" className="mb-4" title={notice} />}
      {error && <Alert type="error" className="mb-4" title={error.message} />}
      {formError && <Alert type="error" className="mb-4" title={formError.message} />}

      {loading ? (
        <Spinner />
      ) : formations.length === 0 ? (
        <Card>
          <EmptyState
            title="Aucune formation"
            message="Créez votre première formation pour commencer à publier du contenu."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {formations.map((f) => (
            <Card key={f.id_formation} className="flex flex-col p-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icons.formations />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{f.titre}</h3>
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{f.description || "Aucune description."}</p>
              <p className="mt-2 text-xs text-slate-400">{f.nom_categorie}</p>
              <div className="mt-4 flex items-center gap-2">
                <Link to={`/formateur/formations/${f.id_formation}`} className="btn-primary flex-1 !py-2 text-center text-sm">
                  Gérer le contenu
                </Link>
                <button
                  type="button"
                  className="btn-ghost !px-3 !py-2 !text-xs text-red-600 hover:bg-red-50"
                  onClick={() => setDeleting(f)}
                >
                  Supprimer
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nouvelle formation"
        footer={
          <button type="submit" form="formation-form" className="btn-primary" disabled={busy}>
            {busy ? "Création..." : "Créer"}
          </button>
        }
      >
        <FormAlert error={formError} />
        <form id="formation-form" onSubmit={create} className="space-y-4">
          <div>
            <label className="label">Titre</label>
            <input className="input" value={form.titre} onChange={update("titre")} />
            <FieldError error={formError} name="titre" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={update("description")} />
            <FieldError error={formError} name="description" />
          </div>
          <div>
            <label className="label">Catégorie</label>
            <select className="input" value={form.id_categorie} onChange={update("id_categorie")}>
              <option value="">Choisir...</option>
              {categories.map((c) => (
                <option key={c.id_categorie} value={c.id_categorie}>{c.nom_categorie}</option>
              ))}
            </select>
            <FieldError error={formError} name="id_categorie" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
        title="Supprimer cette formation ?"
        message="Tout le contenu associé (modules, chapitres, leçons) sera supprimé."
      />
    </div>
  );
}
