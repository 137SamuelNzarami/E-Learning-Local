import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../ui/Card";
import Alert from "../ui/Alert";
import Badge from "../ui/Badge";
import { ProgressBar } from "../ui/ProgressBar";
import { attemptServiceExtended } from "../../services/attemptService";
import { getErrorMessage } from "../../utils/format";
import { Icons } from "../Icons";

function QuizStatutChip({ statut }) {
  if (statut === "REUSSIE") return <Badge tone="success">Réussie</Badge>;
  if (statut === "ECHOUEE") return <Badge tone="danger">Échouée</Badge>;
  if (statut === "EN_COURS") return <Badge tone="info">En cours</Badge>;
  return <Badge>{statut}</Badge>;
}

/**
 * Quiz intégré en fin de chapitre (QCM exclusivement, correction automatique).
 * - charge l'historique via /attempts/quiz/:id/mine
 * - démarre la tentative via /attempts/quiz/:id/start
 * - soumet via /attempts/:id/submit (la note est TOUJOURS calculée par le backend)
 */
export default function ChapterQuiz({ id, onResult }) {
  const [history, setHistory] = useState(null);
  const [quizTitle, setQuizTitle] = useState("Quiz");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);

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
    return () => { cancelled = true; };
  }, [id]);

  const start = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await attemptServiceExtended.start(id);
      const data = res.data;
      const draft = {};
      for (const q of data.questions || []) {
        draft[q.id_question] = new Set();
      }
      setAnswers(draft);
      setResult(null);
      setSession(data);
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
      const reponses = (session.questions || []).map((q) => ({
        id_question: q.id_question,
        id_reponses: Array.from(answers[q.id_question] || []),
      }));
      const res = await attemptServiceExtended.submit(session.tentative.id_tentative, { reponses });
      setResult(res.data);
      setSession(null);
      onResult?.(res.data);
      attemptServiceExtended.mine(id).then((r) => setHistory(r.data)).catch(() => {});
    } catch (err) {
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !history) return <div className="py-8"><p className="text-center text-sm text-slate-400">Chargement du quiz…</p></div>;
  if (error && !history) return <Alert type="error" title={getErrorMessage(error)} />;

  const questions = session?.questions || [];
  const answeredCount = questions.filter((q) => {
    const v = answers[q.id_question];
    return v instanceof Set && v.size > 0;
  }).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  const statutsHistory = history?.tentatives || [];
  const dejaReussie = Boolean(history?.reussi);
  const seuil = Number(history?.score_reussite ?? 50);

  return (
    <div id="chapitre-quiz" className="scroll-mt-24">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-warning-50 to-amber-50 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning-100 text-warning-600">
                <Icons.quiz className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-800">Quiz de fin de chapitre</h2>
                  {dejaReussie && <Badge tone="success">Chapitre validé</Badge>}
                </div>
                <p className="text-xs text-slate-500">
                  Seuil de réussite : {seuil}% · La note est corrigée automatiquement
                </p>
              </div>
            </div>
            {!session && !result && (
              <button type="button" className="btn-primary" onClick={start} disabled={submitting}>
                {submitting ? "Démarrage..." : (dejaReussie ? "Refaire le quiz" : "Commencer le quiz")}
              </button>
            )}
          </div>
          {(submitError || error) && <Alert type="error" className="mt-3" title={getErrorMessage(submitError || error)} />}
        </div>

        {/* RESULT */}
        {result && !session && (
          <div className={`p-6 text-center ${
            result.statut === "REUSSIE"
              ? "bg-gradient-to-br from-success-50 to-success-100"
              : "bg-gradient-to-br from-danger-50 to-danger-100"
          }`}>
            <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full ${
              result.statut === "REUSSIE"
                ? "bg-success-100 text-success-600"
                : "bg-danger-100 text-danger-600"
            }`}>
              {result.statut === "REUSSIE" ? (
                <Icons.checkCircle className="h-8 w-8" />
              ) : (
                <Icons.xCircle className="h-8 w-8" />
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {result.statut === "REUSSIE" ? "Félicitations !" : "Quiz échoué"}
            </h3>
            <p className="mt-1 text-sm text-slate-600">{result.message}</p>
            {result.note !== null && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm">
                Note : {Math.round(Number(result.note))}/100
                <span className="text-slate-400">·</span>
                Seuil : {seuil}%
              </div>
            )}
            {result.statut === "ECHOUEE" && (
              <div className="mt-4">
                <button type="button" className="btn-primary" onClick={start} disabled={submitting}>
                  <Icons.refresh className="h-4 w-4" /> Repasser le quiz
                </button>
              </div>
            )}
          </div>
        )}

        {/* START / HISTORY */}
        {!session && !result && (
          <div className="p-6">
            {statutsHistory.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Tentatives précédentes ({history.nb_tentatives})
                </p>
                <ul className="space-y-1.5">
                  {statutsHistory.map((t) => (
                    <li key={t.id_tentative} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                      <span className="text-sm text-slate-600">Tentative #{t.id_tentative}</span>
                      <span className="flex items-center gap-3">
                        {t.note !== null && t.note !== undefined && (
                          <span className="text-sm tabular-nums font-semibold text-slate-700">{Math.round(Number(t.note))}/100</span>
                        )}
                        <QuizStatutChip statut={t.statut} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-sm text-slate-500">
              {dejaReussie
                ? "Ce quiz est déjà validé. Vous pouvez le repasser pour vous entraîner."
                : "Répondez à toutes les questions puis validez. Les QCM acceptent plusieurs réponses."}
            </p>
            {!dejaReussie && history?.tentative_en_cours && (
              <p className="mt-2 text-sm font-medium text-amber-600">
                Une tentative est déjà en cours. Reprenez-la où vous en étiez.
              </p>
            )}
          </div>
        )}

        {/* ANSWER PHASE */}
        {session && (
          <>
            <div className="sticky top-20 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white/95 p-4 backdrop-blur">
              <div className="min-w-[160px] flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {answeredCount}/{questions.length} répondu{questions.length > 1 ? "es" : ""}
                  </span>
                  <span className="font-bold text-brand-600">
                    {Math.round((answeredCount / Math.max(questions.length, 1)) * 100)}%
                  </span>
                </div>
                <div className="mt-1">
                  <ProgressBar value={(answeredCount / Math.max(questions.length, 1)) * 100} />
                </div>
              </div>
              <button
                type="button"
                className="btn-primary"
                disabled={submitting || !allAnswered}
                onClick={submitQuiz}
              >
                {submitting ? "Envoi..." : (<><Icons.check className="h-4 w-4" /> Valider mes réponses</>)}
              </button>
            </div>

            <div className="space-y-4 p-4">
              {questions.map((question, idx) => {
                const value = answers[question.id_question];
                return (
                  <div key={question.id_question} className="rounded-xl border border-slate-200">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">
                          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-md bg-brand-100 text-[11px] font-bold text-brand-700">
                            {idx + 1}
                          </span>
                          {question.enonce}
                        </p>
                        <Badge tone="sky">QCM · {Number(question.points)} pt{Number(question.points) > 1 ? "s" : ""}</Badge>
                      </div>
                    </div>

                    <div className="p-5">
                          <p className="mb-3 text-xs text-slate-400">Plusieurs réponses possibles</p>
                          <div className="space-y-2">
                            {(question.reponses || []).map((a) => {
                              const checked = value instanceof Set && value.has(a.id_reponse);
                              return (
                                <label
                                  key={a.id_reponse}
                                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-150 ${
                                    checked
                                      ? "border-brand-400 bg-brand-50 ring-1 ring-brand-200/50"
                                      : "border-slate-200 hover:border-brand-200 hover:bg-brand-50/30"
                                  }`}
                                >
                                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-base ${
                                    checked
                                      ? "border-brand-500 bg-brand-500 text-white"
                                      : "border-slate-300 bg-white"
                                  }`}>
                                    {checked && <Icons.check className="h-3 w-3" />}
                                  </div>
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={checked}
                                    onChange={() => toggleChoice(question.id_question, a.id_reponse)}
                                  />
                                  <span className="text-sm text-slate-700">{a.contenu}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}