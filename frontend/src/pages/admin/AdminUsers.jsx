import { useEffect, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import FieldError, { FormAlert } from "../../components/ui/FieldError";
import { RoleBadge } from "../../components/ui/Badge";
import { userService } from "../../services/userService";
import { Icons } from "../../components/Icons";
import { initials, fullName } from "../../utils/format";

const ROLE_OPTIONS = [
  { value: 1, label: "Administrateur" },
  { value: 2, label: "Formateur" },
  { value: 3, label: "Etudiant" },
];

const EMPTY_FORM = {
  id_role: 3,
  nom: "",
  prenom: "",
  email: "",
  mot_de_passe: "",
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);

  const load = () => {
    setLoading(true);
    userService
      .index()
      .then((res) => setUsers(res.data || []))
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      id_role: u.role === "Administrateur" ? 1 : u.role === "Formateur" ? 2 : 3,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      mot_de_passe: "",
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
      if (editing) {
        await userService.update(editing.id_utilisateur, {
          id_role: Number(form.id_role),
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
        });
        setNotice("Utilisateur modifié.");
      } else {
        await userService.store({
          id_role: Number(form.id_role),
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          mot_de_passe: form.mot_de_passe,
        });
        setNotice("Utilisateur créé.");
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
      await userService.destroy(deleting.id_utilisateur);
      setNotice("Utilisateur supprimé.");
      setDeleting(null);
      load();
    } catch (err) {
      setError(err);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const filtered = (users || []).filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [u.prenom, u.nom, u.email, u.role].some((v) => String(v || "").toLowerCase().includes(q));
  });

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        subtitle="Gérez les comptes de la plateforme"
        actions={<button type="button" className="btn-primary" onClick={openCreate}><Icons.plus className="h-4 w-4" /> Nouvel utilisateur</button>}
      />

      {notice && <Alert type="success" className="mb-4" title={notice} />}
      {error && <Alert type="error" className="mb-4" title={error.message} />}

      <Card>
        <div className="mb-4">
          <input
            className="input"
            placeholder="Rechercher par nom, prénom, e-mail ou rôle..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState title="Aucun utilisateur" message="Aucun compte ne correspond à votre recherche." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((u) => (
              <li key={u.id_utilisateur} className="flex items-center gap-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                  {initials(u.prenom, u.nom)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{fullName(u)}</p>
                  <p className="truncate text-xs text-slate-500">{u.email}</p>
                </div>
                <RoleBadge role={u.role} />
                <span className="text-xs text-slate-400">#{u.id_utilisateur}</span>
                <button type="button" className="btn-secondary !px-3 !py-1.5 !text-xs mr-2" onClick={() => openEdit(u)}>
                  Modifier
                </button>
                <button type="button" className="btn-ghost !px-3 !py-1.5 !text-xs text-red-600 hover:bg-red-50" onClick={() => setDeleting(u)}>
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
        title={editing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
        footer={
          <button type="submit" form="user-form" className="btn-primary" disabled={busy}>
            {busy ? "Enregistrement..." : "Enregistrer"}
          </button>
        }
      >
        <FormAlert error={formError} />
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Rôle</label>
            <select className="input" value={form.id_role} onChange={update("id_role")}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <FieldError error={formError} name="id_role" />
          </div>
          <div>
            <label className="label">Prénom</label>
            <input className="input" value={form.prenom} onChange={update("prenom")} placeholder="Ex : Marie" />
            <FieldError error={formError} name="prenom" />
          </div>
          <div>
            <label className="label">Nom</label>
            <input className="input" value={form.nom} onChange={update("nom")} placeholder="Ex : Dupont" />
            <FieldError error={formError} name="nom" />
          </div>
          <div>
            <label className="label">Adresse e-mail</label>
            <input className="input" type="email" value={form.email} onChange={update("email")} placeholder="Ex : marie@exemple.fr" />
            <FieldError error={formError} name="email" />
          </div>
          {!editing && (
            <div>
              <label className="label">Mot de passe</label>
              <input className="input" type="password" value={form.mot_de_passe} onChange={update("mot_de_passe")} placeholder="Au moins 8 caractères" autoComplete="new-password" />
              <FieldError error={formError} name="mot_de_passe" />
            </div>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
        title="Supprimer cet utilisateur ?"
        message={`Le compte de « ${fullName(deleting)} » sera définitivement supprimé.`}
      />
    </div>
  );
}
