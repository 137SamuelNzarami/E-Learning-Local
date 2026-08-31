import { useEffect, useState } from "react";
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

  const countByRole = (role) => users.filter((u) => u.role === role).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Utilisateurs</h1>
          <p className="page-subtitle">Gérez les comptes de la plateforme</p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Icons.plus className="h-4 w-4" /> Nouvel utilisateur
        </button>
      </div>

      {notice && (
        <div className="animate-slide-up rounded-xl border border-success-200 bg-success-50 p-3 text-sm font-medium text-success-700">
          {notice}
        </div>
      )}
      {error && <Alert type="error" title={error.message} />}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card">
          <p className="stat-label">Total</p>
          <p className="stat-value text-lg">{users.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Formateurs</p>
          <p className="stat-value text-lg">{countByRole("Formateur")}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Étudiants</p>
          <p className="stat-value text-lg">{countByRole("Etudiant")}</p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <div className="relative">
            <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input !pl-10"
              placeholder="Rechercher par nom, prénom, e-mail ou rôle..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8"><EmptyState title="Aucun utilisateur" message="Aucun compte ne correspond à votre recherche." /></div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((u) => (
              <li key={u.id_utilisateur} className="flex items-center gap-4 px-5 py-3 transition-base hover:bg-slate-50/50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800 ring-2 ring-brand-200/50">
                  {initials(u.prenom, u.nom)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{fullName(u)}</p>
                  <p className="truncate text-xs text-slate-400">{u.email}</p>
                </div>
                <RoleBadge role={u.role} />
                <div className="flex items-center gap-1.5">
                  <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit(u)}>
                    <Icons.edit className="h-3 w-3" /> Modifier
                  </button>
                  <button type="button" className="btn-ghost btn-sm !text-danger-500 hover:!bg-danger-50" onClick={() => setDeleting(u)}>
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
            <select className="select" value={form.id_role} onChange={update("id_role")}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <FieldError error={formError} name="id_role" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prénom</label>
              <input className="input" value={form.prenom} onChange={update("prenom")} placeholder="Marie" />
              <FieldError error={formError} name="prenom" />
            </div>
            <div>
              <label className="label">Nom</label>
              <input className="input" value={form.nom} onChange={update("nom")} placeholder="Dupont" />
              <FieldError error={formError} name="nom" />
            </div>
          </div>
          <div>
            <label className="label">Adresse e-mail</label>
            <input className="input" type="email" value={form.email} onChange={update("email")} placeholder="marie@exemple.fr" />
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
