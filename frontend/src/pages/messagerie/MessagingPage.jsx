import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import { participantServiceExtended } from "../../services/participantService";
import { Icons } from "../../components/Icons";

export default function MessagingPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    participantServiceExtended
      .getByUser(user.id)
      .then((res) => setConversations(res.data || []))
      .finally(() => setLoading(false));
  }, [user.id]);

  const getConversationTitle = (c) => {
    const sujet = c.sujet || "";
    const otherName = c.other_name || "";

    if (sujet.startsWith("Formation : ")) {
      const formationTitre = sujet.replace("Formation : ", "").trim();
      return otherName ? `${formationTitre} — ${otherName}` : formationTitre;
    }

    return sujet || `Conversation #${c.id_conversation}`;
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Messagerie" subtitle="Vos conversations" />

      {loading ? (
        <Spinner />
      ) : conversations.length === 0 ? (
        <Card>
          <EmptyState
            icon={Icons.messages}
            title="Aucune conversation"
            message="Les conversations créées pour vous par l'administrateur apparaîtront ici."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {conversations.map((c) => (
            <Link key={c.id_participant} to={`/messagerie/conversation/${c.id_conversation}`}>
              <Card className="flex items-center gap-4 p-4 transition hover:border-brand-300 hover:shadow-lift">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                  <Icons.messages />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-800">
                    {getConversationTitle(c)}
                  </p>
                  <p className="text-xs text-slate-500">Discussion privée</p>
                </div>
                <Icons.chevronRight className="h-4 w-4 text-slate-400" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
