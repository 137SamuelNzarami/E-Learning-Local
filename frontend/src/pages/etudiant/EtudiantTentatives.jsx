import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import { attemptServiceExtended } from "../../services/attemptService";
import { studentAnswerServiceExtended } from "../../services/studentAnswerService";
import { getErrorMessage, formatDateTime } from "../../utils/format";
import { Icons } from "../../components/Icons";

function StatutBadge({ attempt }) {
  const note = attempt.note;
  switch (attempt.statut) {
    case "REUSSIE":
      return <Badge tone="success">Réussie{note != null ? ` · ${Math.round(Number(note))}/100` : ""}</Badge>;
    case "ECHOUEE":
      return <Badge tone="danger">Échouée{note != null ? ` · ${Math.round(Number(note))}/100` : ""} · à repasser</Badge>;
    case "EN_COURS":
      return <Badge tone="info">En cours</Badge>;
    default:
      return <Badge>{attempt.statut}</Badge>;
  }
}

function NoteChip({ record }) {
  if (typeof record.est_correcte === "boolean" || typeof record.est_correcte === "number") {
    return record.est_correcte ? <Badge tone="success">Correcte</Badge> : <Badge tone="danger">Incorrecte</Badge>;
  }
  return <Badge>Soumise</Badge>;
}

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
        if (!cancelled) setAttempts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
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

  const passedCount = attempts.filter((a) => a.statut === "REUSSIE").length;
  const failedCount = attempts.filter((a) => a.statut === "ECHOUEE").length;

  if (loading) return <div className="p-8"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Mes résultats</h1>
        <p className="mt-1 text-sm text-slate-500">Historique de vos tentatives de quiz</p>
      </div>

      {error && <Alert type="error" title={getErrorMessage(error)} />}

      {attempts.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm">
          <div className="flex items-center gap-2 rounded-xl bg-success-50 px-4 py-2 font-medium text-success-700">
            <Icons.check className="h-4 w-4" /> {passedCount} réussie{passedCount > 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-danger-50 px-4 py-2 font-medium text-danger-700">
            <Icons.xCircle className="h-4 w-4" /> {failedCount} échouée{failedCount > 1 ? "s" : ""}
          </div>
        </div>
      )}

      {attempts.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Icons.quiz className="h-6 w-6" />}
            title="Aucune tentative"
            message="Passez le quiz d'un chapitre depuis votre parcours pour voir vos résultats ici."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {attempts.map((a) => {
            const isOpen = expanded === a.id_tentative;
            const records = answersByAttempt[a.id_tentative];
            return (
              <Card key={a.id_tentative} className="overflow-hidden !p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      a.statut === "REUSSIE" ? "bg-success-50 text-success-600"
                        : a.statut === "ECHOUEE" ? "bg-danger-50 text-danger-500"
                          : "bg-brand-50 text-brand-600"
                    }`}>
                      <Icons.quiz className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      {a.chapitre && (
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                          <Icons.folder className="h-3 w-3" /> {a.chapitre}
                        </p>
                      )}
                      <p className="truncate text-sm font-semibold text-slate-800">{a.quiz || "Quiz"}</p>
                      <p className="text-[11px] text-slate-400">
                        {a.formation && <span className="font-medium text-slate-500">{a.formation} · </span>}
                        Tentative #{a.id_tentative}
                        {a.date_soumission && <span> · {formatDateTime(a.date_soumission)}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatutBadge attempt={a} />
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-base hover:bg-slate-50"
                      onClick={() => openDetail(a)}
                    >
                      {isOpen ? "Réduire" : "Détail"}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-slate-100 p-4">
                    {!records ? (
                      <p className="text-sm text-slate-400">{loadingDetail ? "Chargement des réponses…" : "Aucun détail disponible."}</p>
                    ) : records.length === 0 ? (
                      <p className="text-sm text-slate-400">Aucune réponse enregistrée.</p>
                    ) : (
                      <ul className="space-y-2">
                        {records.map((r) => (
                          <li key={r.id_reponse_etudiant} className="rounded-xl bg-slate-50 px-4 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium text-slate-800">{r.question}</p>
                              <NoteChip record={r} />
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                              {r.reponse_choisie ? `Votre choix : ${r.reponse_choisie}` : "Réponse soumise"}
                            </p>
                          </li>
                        ))}
                      </ul>
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
