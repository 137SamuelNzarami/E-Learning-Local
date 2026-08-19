import { useEffect, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import Pagination from "../../components/ui/Pagination";
import Badge from "../../components/ui/Badge";
import FieldError, { FormAlert } from "../../components/ui/FieldError";
import { notificationService } from "../../services/notificationService";
import { userService } from "../../services/userService";
import { usePagination } from "../../hooks/useApi";
import { Icons } from "../../components/Icons";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ id_utilisateur: "", titre: "", contenu: "" });
  const [formError, setFormError] = useState(null);
  const pagination = usePagination(notifications.length);

  const load = () => {
    setLoading(true);
    Promise.all([notificationService.index(), userService.index()])
      .then(([n, u]) => {
        setNotifications(n.data || []);
        setUsers(u.data || []);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setForm({ id_utilisateur: "", titre: "", contenu: "" });
    setFormError(null);
    setModalOpen(true);
  };

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await notificationService.store({
        id_utilisateur: Number(form.id_utilisateur),
        titre: form.titre,
        contenu: form.contenu,
      });
      setNotice("Notification envoyée.");
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
      await notificationService.destroy(deleting.id_notification);
      setNotice("Notification supprimée.");
      setDeleting(null);
      load();
    } catch (err) {
      setError(err);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const pageItems = notifications.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Envoyez des notifications aux utilisateurs"
        actions={<button type="button" className="btn-primary" onClick={openCreate}><Icons.plus className="h-4 w-4" /> Nouvelle notification</button>}
      />

      {notice && <Alert type="success" className="mb-4" title={notice} />}
      {error && <Alert type="error" className="mb-4" title={error.message} />}

      <Card>
        {loading ? (
          <Spinner />
        ) : notifications.length === 0 ? (
          <EmptyState title="Aucune notification" />
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {pageItems.map((n) => (
                <li key={n.id_notification} className="flex items-start gap-4 py-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Icons.notifications />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{n.titre}</p>
                      {n.lu === 0 ? <Badge tone="warning">Non lue</Badge> : <Badge tone="success">Lue</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{n.contenu}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Destinataire : {n.prenom} {n.nom}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost !px-3 !py-1.5 !text-xs text-red-600 hover:bg-red-50"
                    onClick={() => setDeleting(n)}
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
                total={notifications.length}
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
        title="Nouvelle notification"
        footer={
          <button type="submit" form="notification-form" className="btn-primary" disabled={busy}>
            {busy ? "Envoi..." : "Envoyer"}
          </button>
        }
      >
        <FormAlert error={formError} />
        <form id="notification-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Destinataire</label>
            <select className="input" value={form.id_utilisateur} onChange={update("id_utilisateur")}>
              <option value="">Choisir...</option>
              {users.map((u) => (
                <option key={u.id_utilisateur} value={u.id_utilisateur}>
                  {u.prenom} {u.nom} ({u.role})
                </option>
              ))}
            </select>
            <FieldError error={formError} name="id_utilisateur" />
          </div>
          <div>
            <label className="label">Titre</label>
            <input className="input" value={form.titre} onChange={update("titre")} />
            <FieldError error={formError} name="titre" />
          </div>
          <div>
            <label className="label">Contenu</label>
            <textarea className="input" rows={3} value={form.contenu} onChange={update("contenu")} />
            <FieldError error={formError} name="contenu" />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
        title="Supprimer cette notification ?"
      />
    </div>
  );
}
