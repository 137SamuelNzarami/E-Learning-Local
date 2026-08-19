import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Alert from "../../components/ui/Alert";
import FieldError, { FormAlert } from "../../components/ui/FieldError";
import { conversationService } from "../../services/conversationService";
import { messageServiceExtended } from "../../services/messageService";
import { participantServiceExtended } from "../../services/participantService";
import { formatDateTime, initials } from "../../utils/format";

export default function ConversationPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState(null);
  const bottomRef = useRef(null);

  const load = async () => {
    try {
      const [c, m, p] = await Promise.all([
        conversationService.show(id),
        messageServiceExtended.getByConversation(id),
        participantServiceExtended.getByConversation(id),
      ]);
      setConversation(c.data);
      setMessages(m.data || []);
      setParticipants(p.data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 8000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    setFormError(null);
    try {
      await messageServiceExtended.store({
        id_conversation: Number(id),
        id_expediteur: user.id,
        contenu: content.trim(),
      });
      setContent("");
      await load();
    } catch (err) {
      setFormError(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <Alert type="error" title="Conversation inaccessible">{error.message}</Alert>
        <Link to="/messagerie" className="btn-secondary mt-4">Retour à la messagerie</Link>
      </div>
    );
  }

  const getConversationTitle = () => {
    const sujet = conversation?.sujet || "";
    const other = participants.find((p) => p.id_utilisateur !== user.id);
    const otherName = other ? `${other.prenom} ${other.nom}` : "";

    if (sujet.startsWith("Formation : ")) {
      const formationTitre = sujet.replace("Formation : ", "").trim();
      return otherName ? `${formationTitre} — ${otherName}` : formationTitre;
    }

    return sujet || `Conversation #${id}`;
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link to="/messagerie" className="text-sm font-medium text-brand-600 hover:underline">
            ← Retour
          </Link>
          <h1 className="text-xl font-bold text-slate-900">
            {getConversationTitle()}
          </h1>
        </div>
        <div className="hidden items-center gap-1.5 sm:flex">
          {participants.map((p) => (
            <span
              key={p.id_participant}
              title={`${p.prenom} ${p.nom}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600"
            >
              {initials(p.prenom, p.nom)}
            </span>
          ))}
        </div>
      </div>

      <Card className="flex h-[60vh] flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-slate-400">Aucun message. Lancez la discussion !</p>
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.id_expediteur === user.id;
              return (
                <div key={m.id_message} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      mine ? "bg-brand-600 text-white" : "bg-white text-slate-800"
                    }`}
                  >
                    {!mine && (
                      <p className="mb-0.5 text-xs font-semibold text-brand-600">{m.prenom} {m.nom}</p>
                    )}
                    <p className="text-sm">{m.contenu}</p>
                    <p className={`mt-1 text-right text-[10px] ${mine ? "text-brand-200" : "text-slate-400"}`}>
                      {formatDateTime(m.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200 p-4">
          <FormAlert error={formError} />
          <form onSubmit={send} className="flex gap-3">
            <input
              className="input flex-1"
              placeholder="Écrire un message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <button type="submit" className="btn-primary shrink-0" disabled={sending || !content.trim()}>
              {sending ? "Envoi..." : "Envoyer"}
            </button>
          </form>
          <FieldError error={formError} name="contenu" />
        </div>
      </Card>
    </div>
  );
}
