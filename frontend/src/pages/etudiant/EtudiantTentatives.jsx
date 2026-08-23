import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import { attemptServiceExtended } from "../../services/attemptService";
import { studentAnswerServiceExtended } from "../../services/studentAnswerService";
import { getErrorMessage, formatDateTime } from "../../utils/format";
import { Icons } from "../../components/Icons";

/**
 * Historique des tentatives de l'étudiant courant.
 * - Liste : GET /attempts/user/:id (backend force "soi-même" pour un étudiant) ;
 * - Détail : GET /student-answers/attempt/:id.
 * AUCUN score n'est recalculé côté React : on affiche statut + note du backend.
 */
export default function EtudiantTentatives() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const [answersByAttempt, setAnswersByAttempt] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await attemptServiceExtended.getByUser(user.id);
        if (!cancelled) setAttempts(res.data || []);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const openDetail = async (attempt) => {
    const isOpen = expanded === attempt.id_tentative;
    setExpanded(isOpen ? null : attempt.id_tentative);
    if (isOpen || answersByAttempt[attempt.id_tentative]) return;
    setLoadingDetail(true);
    try {
      const res = await studentAnswerServiceExtended.getByAttempt(attempt.id_tentative);
      setAnswersByAttempt((m) => ({ ...m, [attempt.id_tentative]: res.data || [] }));
    } catch (err) {
      setError(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Mes résultats" subtitle="Historique de vos tentatives de quiz" />

      {error && <Alert type="error" className="mb-4" title={getErrorMessage(error)} />}

      {attempts.length === 0 ? (
        <Card>
          <EmptyState
            title="Aucune tentative"
            message="Passez le quiz d'un chapitre depuis votre parcours pour voir vos résultats ici."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {attempts.map((a) => {
            const open = expanded === a.id_tentative;
            const records = answersByAttempt[a.id_tentative];
            return (
              <Card key={a.id_tentative} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        a.statut === "REUSSIE"
                          ? "bg-green-50 text-green-600"
                          : a.statut === "ECHOUEE"
                            ? "bg-red-50 text-red-500"
                            : a.statut === "A_CORRIGER"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-brand-50 text-brand-600"
                      }`}
                    >
                      <Icons.quiz />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{a.quiz}</p>
                      <p className="text-xs text-slate-400">
                        Tentative #{a.id_tentative}
                        {a.date_soumission ? ` · ${formatDateTime(a.date_soumission)}` : ""}
                        {a.date_correction && !a.date_soumission
                          ? ` · corrigée le ${formatDateTime(a.date_correction)}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatutBadge attempt={a} />
                    <button type="button" className="btn-secondary !px-3 !py-1.5 !text-xs" onClick={() => openDetail(a)}>
                      {open ? "Réduire" : "Détail"}
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="border-t border-slate-100 p-4">
                    {!records ? (
                      <p className="text-sm text-slate-400">
                        {loadingDetail ? "Chargement des réponses…" : "Aucun détail disponible."}
                      </p>
                    ) : records.length === 0 ? (
                      <p className="text-sm text-slate-400">Aucune réponse enregistrée.</p>
                    ) : (
                      <>
                        <p className="mb-2 text-xs text-slate-400">
                          Le corrigé et les points par question sont communiqués uniquement après correction du formateur.
                        </p>
                        <ul className="space-y-2">
                          {records.map((r) => (
                            <li key={r.id_reponse_etudiant} className="rounded-lg bg-slate-50 px-3 py-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-medium text-slate-800">{r.question}</p>
                                <NoteChip record={r} />
                              </div>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                                {r.type_question === "LIBRE"
                                  ? r.reponse_libre || "(réponse vide)"
                                  : `Votre choix : ${r.reponse_choisie ?? "—"}`}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatutBadge({ attempt }) {
  const note = attempt.note;
  switch (attempt.statut) {
    case "REUSSIE":
      return (
        <Badge tone="success">
          Réussie{note != null ? ` · ${Math.round(Number(note))}/100` : ""}
        </Badge>
      );
    case "ECHOUEE":
      return (
        <Badge tone="danger">
          Échouée{note != null ? ` · ${Math.round(Number(note))}/100` : ""} · à repasser
        </Badge>
      );
    case "A_CORRIGER":
      return <Badge tone="warning">Correction en cours</Badge>;
    case "EN_COURS":
      return <Badge tone="info">En cours</Badge>;
    default:
      return <Badge tone="neutral">{attempt.statut}</Badge>;
  }
}

/** est_correcte / note sont masqués pour l'étudiant tant que non corrigé. */
function NoteChip({ record }) {
  if (record.type_question === "LIBRE") {
    return typeof record.note === "number" ? (
      <Badge tone="success">{Number(record.note)}/{Number(record.points_question)}</Badge>
    ) : (
      <Badge tone="warning">À corriger</Badge>
    );
  }
  if (typeof record.est_correcte === "boolean" || typeof record.est_correcte === "number") {
    return record.est_correcte ? (
      <Badge tone="success">Correcte</Badge>
    ) : (
      <Badge tone="danger">Incorrecte</Badge>
    );
  }
  return <Badge tone="neutral">Soumise</Badge>;
}
