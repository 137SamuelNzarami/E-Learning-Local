import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import Pagination from "../../components/ui/Pagination";
import FieldError, { FormAlert } from "../../components/ui/FieldError";
import { formationService } from "../../services/formationService";
import { categoryService } from "../../services/categoryService";
import { userService } from "../../services/userService";
import { usePagination } from "../../hooks/useApi";
import { Icons } from "../../components/Icons";

export default function AdminFormations() {
  const [formations, setFormations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formateurs, setFormateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ titre: "", description: "", id_categorie: "", id_formateur: "" });
  const [formError, setFormError] = useState(null);
  const pagination = usePagination(formations.length);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [f, c, u] = await Promise.all([
        formationService.index(),
        categoryService.index(),
        userService.index(),
      ]);
      setFormations(f.data || []);
      setCategories(c.data || []);
      setFormateurs((u.data || []).filter((x) => x.role === "Formateur"));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ titre: "", description: "", id_categorie: "", id_formateur: "" });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (f) => {
    setEditing(f);
    setForm({
      titre: f.titre,
      description: f.description || "",
      id_categorie: f.id_categorie || "",
      id_formateur: f.id_formateur || "",
    });
    setFormError(null);
    setModalOpen(true);
  };

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const payload = {
        titre: form.titre,
        description: form.description,
        id_categorie: Number(form.id_categorie),
        id_formateur: Number(form.id_formateur),
      };
      if (editing) {
        await formationService.update(editing.id_formation, payload);
        setNotice("Formation modifiée.");
      } else {
        await formationService.store(payload);
        setNotice("Formation créée.");
      }
      setModalOpen(false);
      loadAll();
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
      loadAll();
    } catch (err) {
      setError(err);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const pageItems = formations.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );

  return (
    <div>
      <PageHeader
        title="Formations"
        subtitle="Toutes les formations de la plateforme"
        actions={<button type="button" className="btn-primary" onClick={openCreate}><Icons.plus className="h-4 w-4" /> Nouvelle formation</button>}
      />

      {notice && <Alert type="success" className="mb-4" title={notice} />}
      {error && <Alert type="error" className="mb-4" title={error.message} />}

      <Card>
        {loading ? (
          <Spinner />
        ) : formations.length === 0 ? (
          <EmptyState title="Aucune formation" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="th">#</th>
                    <th className="th">Titre</th>
                    <th className="th">Catégorie</th>
                    <th className="th">Formateur</th>
                    <th className="th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageItems.map((f) => (
                    <tr key={f.id_formation} className="hover:bg-slate-50">
                      <td className="td text-slate-400">#{f.id_formation}</td>
                      <td className="td">
                        <Link to={`/admin/formations/${f.id_formation}`} className="font-medium text-brand-600 hover:underline">
                          {f.titre}
                        </Link>
                      </td>
                      <td className="td">{f.nom_categorie}</td>
                      <td className="td">{f.prenom} {f.nom}</td>
                      <td className="td text-right">
                        <button type="button" className="btn-secondary !px-3 !py-1.5 !text-xs mr-2" onClick={() => openEdit(f)}>
                          Modifier
                        </button>
                        <button type="button" className="btn-ghost !px-3 !py-1.5 !text-xs text-red-600 hover:bg-red-50" onClick={() => setDeleting(f)}>
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-200">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={formations.length}
                limit={pagination.limit}
                onPageChange={pagination.setPage}
                onLimitChange={(l) => pagination.setLimit(l)}
              />
            </div>
          </>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Modifier la formation" : "Nouvelle formation"}
        footer={
          <button type="submit" form="formation-form" className="btn-primary" disabled={busy}>
            {busy ? "Enregistrement..." : "Enregistrer"}
          </button>
        }
      >
        <FormAlert error={formError} />
        <form id="formation-form" onSubmit={handleSubmit} className="space-y-4">
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
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="label">Formateur</label>
              <select className="input" value={form.id_formateur} onChange={update("id_formateur")}>
                <option value="">Choisir...</option>
                {formateurs.map((u) => (
                  <option key={u.id_utilisateur} value={u.id_utilisateur}>{u.prenom} {u.nom}</option>
                ))}
              </select>
              <FieldError error={formError} name="id_formateur" />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
        title="Supprimer cette formation ?"
        message="La formation et toutes ses données associées seront supprimées."
      />
    </div>
  );
}
