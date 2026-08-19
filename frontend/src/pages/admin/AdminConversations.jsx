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
import { conversationService } from "../../services/conversationService";
import { participantService } from "../../services/participantService";
import { userService } from "../../services/userService";
import { usePagination } from "../../hooks/useApi";
import { Icons } from "../../components/Icons";

export default function AdminConversations() {
  const [conversations, setConversations] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [manageFor, setManageFor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sujet, setSujet] = useState("");
  const [newParticipant, setNewParticipant] = useState("");
  const [formError, setFormError] = useState(null);
  const pagination = usePagination(conversations.length);

  const load = () => {
    setLoading(true);
    Promise.all([conversationService.index(), participantService.index(), userService.index()])
      .then(([c, p, u]) => {
        setConversations(c.data || []);
        setParticipants(p.data || []);
        setUsers(u.data || []);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await conversationService.store({ sujet: sujet });
      setNotice("Conversation créée.");
      setCreateOpen(false);
      setSujet("");
      load();
    } catch (err) {
      setFormError(err);
    } finally {
      setBusy(false);
    }
  };

  const addParticipant = async (e) => {
    e.preventDefault();
    if (!newParticipant) return;
    setBusy(true);
    setFormError(null);
    try {
      await participantService.store({
        id_conversation: manageFor.id_conversation,
        id_utilisateur: Number(newParticipant),
      });
      setNewParticipant("");
      setNotice("Participant ajouté.");
      load();
    } catch (err) {
      setFormError(err);
    } finally {
      setBusy(false);
    }
  };

  const removeParticipant = async (p) => {
    setBusy(true);
    try {
      await participantService.destroy(p.id_participant);
      setNotice("Participant retiré.");
      load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await conversationService.destroy(deleting.id_conversation);
      setNotice("Conversation supprimée.");
      setDeleting(null);
      load();
    } catch (err) {
      setError(err);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const convParticipants = (idConversation) =>
    participants.filter((p) => p.id_conversation === idConversation);

  const pageItems = conversations.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );

  return (
    <div>
      <PageHeader
        title="Conversations"
        subtitle="Messagerie privée de la plateforme"
        actions={<button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}><Icons.plus className="h-4 w-4" /> Nouvelle conversation</button>}
      />

      {notice && <Alert type="success" className="mb-4" title={notice} />}
      {error && <Alert type="error" className="mb-4" title={error.message} />}

      <Card>
        {loading ? (
          <Spinner />
        ) : conversations.length === 0 ? (
          <EmptyState title="Aucune conversation" />
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {pageItems.map((c) => {
                const parts = convParticipants(c.id_conversation);
                return (
                  <li key={c.id_conversation} className="flex items-center gap-4 py-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icons.messages />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link to={`/messagerie/conversation/${c.id_conversation}`} className="font-medium text-slate-900 hover:text-brand-600">
                        {c.sujet || `Conversation #${c.id_conversation}`}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {parts.length} participant{parts.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <button type="button" className="btn-secondary !px-3 !py-1.5 !text-xs mr-2" onClick={() => setManageFor(c)}>
                      Participants
                    </button>
                    <button type="button" className="btn-ghost !px-3 !py-1.5 !text-xs text-red-600 hover:bg-red-50" onClick={() => setDeleting(c)}>
                      Supprimer
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-slate-200">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={conversations.length}
                limit={pagination.limit}
                onPageChange={pagination.setPage}
                onLimitChange={(l) => pagination.setLimit(l)}
              />
            </div>
          </>
        )}
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nouvelle conversation"
        footer={
          <button type="submit" form="conversation-form" className="btn-primary" disabled={busy}>
            {busy ? "Création..." : "Créer"}
          </button>
        }
      >
        <FormAlert error={formError} />
        <form id="conversation-form" onSubmit={create} className="space-y-4">
          <div>
            <label className="label">Sujet</label>
            <input className="input" value={sujet} onChange={(e) => setSujet(e.target.value)} placeholder="Ex : Aide au projet tutoré" />
            <FieldError error={formError} name="sujet" />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(manageFor)}
        onClose={() => setManageFor(null)}
        title={`Participants — ${manageFor?.sujet || ""}`}
        footer={
          <button type="button" className="btn-secondary" onClick={() => setManageFor(null)}>Fermer</button>
        }
      >
        {manageFor && (
          <div className="space-y-4">
            <form onSubmit={addParticipant} className="flex gap-2">
              <select className="input flex-1" value={newParticipant} onChange={(e) => setNewParticipant(e.target.value)}>
                <option value="">Ajouter un utilisateur...</option>
                {users
                  .filter((u) => !convParticipants(manageFor.id_conversation).some((p) => p.id_utilisateur === u.id_utilisateur))
                  .map((u) => (
                    <option key={u.id_utilisateur} value={u.id_utilisateur}>
                      {u.prenom} {u.nom} ({u.role})
                    </option>
                  ))}
              </select>
              <button type="submit" className="btn-primary shrink-0" disabled={busy || !newParticipant}>
                Ajouter
              </button>
            </form>
            <ul className="divide-y divide-slate-100">
              {convParticipants(manageFor.id_conversation).length === 0 ? (
                <li className="py-2 text-sm text-slate-400">Aucun participant.</li>
              ) : (
                convParticipants(manageFor.id_conversation).map((p) => (
                  <li key={p.id_participant} className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-700">{p.prenom} {p.nom}</span>
                    <button type="button" className="btn-ghost !px-2 !py-1 !text-xs text-red-600 hover:bg-red-50" onClick={() => removeParticipant(p)}>
                      Retirer
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
        title="Supprimer cette conversation ?"
        message="Les messages associés seront également supprimés."
      />
    </div>
  );
}
