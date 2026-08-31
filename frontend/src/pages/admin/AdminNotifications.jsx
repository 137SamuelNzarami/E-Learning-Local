import { useEffect, useState } from "react";
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
import { formatDateTime } from "../../utils/format";

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Envoyez des notifications aux utilisateurs</p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Icons.plus className="h-4 w-4" /> Nouvelle notification
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
        ) : notifications.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Aucune notification"
              message="Les notifications envoyées apparaîtront ici."
              action={<button type="button" className="btn-primary" onClick={openCreate}>Nouvelle notification</button>}
            />
          </div>
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {pageItems.map((n) => (
                <li key={n.id_notification} className="flex items-start gap-4 px-5 py-4 transition-base hover:bg-slate-50/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icons.notifications className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{n.titre}</p>
                      {n.lu === 0 ? <Badge tone="warning">Non lue</Badge> : <Badge tone="success">Lue</Badge>}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{n.contenu}</p>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Destinataire : <span className="font-medium text-slate-600">{n.prenom} {n.nom}</span>
                      {n.date_envoi && <span> · {formatDateTime(n.date_envoi)}</span>}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost btn-sm !text-danger-500 hover:!bg-danger-50"
                    onClick={() => setDeleting(n)}
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
            {busy ? "Envoi..." : <><Icons.send className="h-4 w-4" /> Envoyer</>}
          </button>
        }
      >
        <FormAlert error={formError} />
        <form id="notification-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Destinataire</label>
            <select className="select" value={form.id_utilisateur} onChange={update("id_utilisateur")}>
              <option value="">Choisir un utilisateur...</option>
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
            <input className="input" value={form.titre} onChange={update("titre")} placeholder="Titre de la notification" />
            <FieldError error={formError} name="titre" />
          </div>
          <div>
            <label className="label">Contenu</label>
            <textarea className="input" rows={4} value={form.contenu} onChange={update("contenu")} placeholder="Message à envoyer..." />
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
        message="Cette notification sera définitivement supprimée."
      />
    </div>
  );
}
