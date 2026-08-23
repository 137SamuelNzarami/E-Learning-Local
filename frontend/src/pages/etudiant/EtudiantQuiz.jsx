import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { attemptServiceExtended } from "../../services/attemptService";
import { getErrorMessage } from "../../utils/format";
import { Icons } from "../../components/Icons";

/**
 * Passage de quiz (étudiant).
 * - Démarrage  : POST /attempts/quiz/:id/start   (idempotent, questions SANS corrigé)
 * - Soumission : POST /attempts/:id/submit       (note TOUJOURS calculée par le backend)
 * - Historique : GET  /attempts/quiz/:id/mine    (peut_passer / reussi)
 *
 * QCM   : multi-sélection (cases à cocher) — l'ensemble exact est comparé côté serveur.
 * LIBRE : zone de texte → tentative A_CORRIGER (correction par le formateur).
 */
export default function EtudiantQuiz() {
  const { id } = useParams();

  const [history, setHistory] = useState(null);
  const [quizTitle, setQuizTitle] = useState("Quiz");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [session, setSession] = useState(null); // { tentative, score_reussite, questions }
  const [answers, setAnswers] = useState({}); // { id_question: Set<ids> | string }
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null); // réponse du backend après submit

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await attemptServiceExtended.mine(id);
        if (!cancelled) {
          setHistory(res.data || null);
          if (res.data?.tentatives?.[0]?.quiz) setQuizTitle(res.data.tentatives[0].quiz);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const start = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await attemptServiceExtended.start(id);
      const data = res.data;
      const draft = {};
      for (const q of data.questions || []) {
        draft[q.id_question] = q.type === "QCM" ? new Set() : "";
      }
      setAnswers(draft);
      setResult(null);
      setSession(data);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleChoice = (idQuestion, idReponse) => {
    setAnswers((prev) => {
      const current = prev[idQuestion] instanceof Set ? new Set(prev[idQuestion]) : new Set();
      if (current.has(idReponse)) current.delete(idReponse);
      else current.add(idReponse);
      return { ...prev, [idQuestion]: current };
    });
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const reponses = (session.questions || []).map((q) => {
        const value = answers[q.id_question];
        return q.type === "QCM"
          ? { id_question: q.id_question, id_reponses: Array.from(value || []) }
          : { id_question: q.id_question, contenu: typeof value === "string" ? value : "" };
      });
      const res = await attemptServiceExtended.submit(session.tentative.id_tentative, {
        reponses,
      });
      setResult(res.data);
      setSession(null);
      window.scrollTo({ top: 0 });
      // Rafraîchit l'historique (peut_passer / reussi mis à jour par le backend)
      attemptServiceExtended
        .mine(id)
        .then((r) => setHistory(r.data))
        .catch(() => {});
    } catch (err) {
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (error && !history) return <Alert type="error" title={getErrorMessage(error)} />;

  const questions = session?.questions || [];
  const answeredCount = questions.filter((q) => {
    const v = answers[q.id_question];
    return q.type === "QCM" ? v instanceof Set && v.size > 0 : typeof v === "string" && v.trim().length > 0;
  }).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  const statutsHistory = history?.tentatives || [];
  const dejaReussie = Boolean(history?.reussi);

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/etudiant/parcours" className="text-sm font-medium text-brand-600 hover:underline">
        ← Mon parcours
      </Link>
      <PageHeader
        title={quizTitle}
        subtitle={session ? undefined : "Quiz de fin de chapitre"}
        actions={
          session ? undefined : dejaReussie ? (
            <Badge tone="success">Chapitre validé</Badge>
          ) : (
            <Badge tone="info">Seuil : {Number(history?.score_reussite ?? 50)}%</Badge>
          )
        }
      />

      {(submitError || error) && (
        <Alert type="error" className="mb-4" title={getErrorMessage(submitError || error)} />
      )}

      {/* RÉSULTAT APRÈS SOUMISSION — uniquement les données renvoyées par le backend */}
      {result && !session && (
        <Card className="mb-4 p-6 text-center">
          <div
            className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
              result.a_corriger
                ? "bg-amber-100 text-amber-600"
                : result.statut === "REUSSIE"
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
            }`}
          >
            {result.a_corriger ? (
              <Icons.clock />
            ) : result.statut === "REUSSIE" ? (
              <Icons.checkCircle className="h-9 w-9" />
            ) : (
              <Icons.xCircle className="h-9 w-9" />
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {result.a_corriger
              ? "En attente de correction"
              : result.statut === "REUSSIE"
                ? "Félicitations !"
                : "Quiz échoué"}
          </h3>
          <p className="mt-2 text-sm text-slate-500">{result.message}</p>
          {!result.a_corriger && result.note !== null && (
            <p className="mt-3 text-sm text-slate-600">
              Note : <strong>{Math.round(Number(result.note))}/100</strong> · seuil {Number(result.score_reussite)}%
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {result.statut === "ECHOUEE" && (
              <button type="button" className="btn-primary" onClick={start} disabled={submitting}>
                Repasser le quiz
              </button>
            )}
            <Link to="/etudiant/tentatives" className="btn-secondary">
              Mes résultats
            </Link>
            <Link to="/etudiant/parcours" className={result.statut === "REUSSIE" ? "btn-primary" : "btn-secondary"}>
              Retour au parcours
            </Link>
          </div>
        </Card>
      )}

      {/* ÉCRAN DE DÉMARRAGE / HISTORIQUE */}
      {!session && !result && (
        <>
          <Card className="mb-4 p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Icons.quiz />
            </div>

            {dejaReussie ? (
              <>
                <h3 className="text-lg font-bold text-slate-900">Quiz déjà réussi</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Vous avez validé ce chapitre. Le chapitre suivant est débloqué ; ce quiz ne peut plus être repassé.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link to="/etudiant/parcours" className="btn-primary">
                    Continuer le parcours
                  </Link>
                  <Link to="/etudiant/tentatives" className="btn-secondary">
                    Voir mes résultats
                  </Link>
                </div>
              </>
            ) : history?.peut_passer ? (
              <>
                <h3 className="text-lg font-bold text-slate-900">Prêt à commencer ?</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Répondez à toutes les questions puis validez. Les QCM acceptent plusieurs réponses ;
                  les questions libres seront corrigées par le formateur.
                  Seuil de réussite : <strong>{Number(history?.score_reussite ?? 50)}%</strong>.
                </p>
                <button type="button" className="btn-primary mt-6" onClick={start} disabled={submitting}>
                  {submitting ? "Démarrage..." : "Commencer le quiz"}
                </button>
              </>
            ) : history?.tentative_en_cours ? (
              <>
                <h3 className="text-lg font-bold text-slate-900">Tentative en cours</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Une tentative est déjà ouverte. Reprenez-la où vous en étiez.
                </p>
                <button type="button" className="btn-primary mt-6" onClick={start} disabled={submitting}>
                  {submitting ? "Chargement..." : "Reprendre la tentative"}
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-500">Chargement…</p>
            )}

            {statutsHistory.length > 0 && (
              <div className="mt-8 border-t border-slate-100 pt-5 text-left">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Tentatives précédentes ({history.nb_tentatives})
                </p>
                <ul className="space-y-1.5">
                  {statutsHistory.map((t) => (
                    <li key={t.id_tentative} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span className="text-slate-600">#{t.id_tentative}</span>
                      <span className="flex items-center gap-2">
                        {t.note !== null && t.note !== undefined && (
                          <span className="text-xs text-slate-500">{Math.round(Number(t.note))}/100</span>
                        )}
                        <StatutChip statut={t.statut} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </>
      )}

      {/* PHASE DE RÉPONSE */}
      {session && (
        <>
          <Card className="sticky top-20 z-10 mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-[160px] flex-1">
              <p className="mb-1 text-xs text-slate-400">
                {answeredCount}/{questions.length} répondu{questions.length > 1 ? "es" : ""}
              </p>
              <ProgressBar value={(answeredCount / Math.max(questions.length, 1)) * 100} />
            </div>
            <button type="button" className="btn-primary" disabled={submitting || !allAnswered} onClick={submitQuiz}>
              {submitting ? "Envoi..." : "Valider mes réponses"}
            </button>
          </Card>

          <div className="space-y-4">
            {questions.map((question, idx) => {
              const value = answers[question.id_question];
              return (
                <Card key={question.id_question} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium text-slate-900">
                      <span className="mr-2 text-brand-600">Q{idx + 1}.</span>
                      {question.enonce}
                    </p>
                    <Badge tone={question.type === "LIBRE" ? "violet" : "sky"}>
                      {question.type === "LIBRE" ? "Réponse libre" : "QCM"} · {Number(question.points)} pt
                      {Number(question.points) > 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {question.type === "QCM" ? (
                    <>
                      <p className="mt-1 text-xs text-slate-400">Plusieurs réponses possibles.</p>
                      <div className="mt-3 space-y-2">
                        {(question.reponses || []).map((a) => {
                          const checked = value instanceof Set && value.has(a.id_reponse);
                          return (
                            <label
                              key={a.id_reponse}
                              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 transition ${
                                checked ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-brand-200"
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-brand-600"
                                checked={checked}
                                onChange={() => toggleChoice(question.id_question, a.id_reponse)}
                              />
                              <span className="text-sm text-slate-700">{a.contenu}</span>
                            </label>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <textarea
                      className="input mt-3"
                      rows={5}
                      placeholder="Rédigez votre réponse..."
                      value={typeof value === "string" ? value : ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [question.id_question]: e.target.value }))
                      }
                    />
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function StatutChip({ statut }) {
  if (statut === "REUSSIE") return <Badge tone="success">Réussie</Badge>;
  if (statut === "ECHOUEE") return <Badge tone="danger">Échouée</Badge>;
  if (statut === "A_CORRIGER") return <Badge tone="warning">À corriger</Badge>;
  if (statut === "EN_COURS") return <Badge tone="info">En cours</Badge>;
  return <Badge tone="neutral">{statut}</Badge>;
}
