import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import FieldError, { FormAlert } from "../../components/ui/FieldError";
import { quizService } from "../../services/quizService";
import { questionServiceExtended } from "../../services/questionService";
import { answerServiceExtended } from "../../services/answerService";
import { useOwnedLessons } from "../../hooks/useOwnedLessons";
import { Icons } from "../../components/Icons";

export default function FormateurQuizzes() {
  const [searchParams] = useSearchParams();
  const preselected = Number(searchParams.get("lecon")) || null;
  const { lessons, loading: loadingLessons } = useOwnedLessons();

  const [quizzes, setQuizzes] = useState([]);
  const [questionsByQuiz, setQuestionsByQuiz] = useState({});
  const [answersByQuestion, setAnswersByQuestion] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [busy, setBusy] = useState(false);

  const [quizModal, setQuizModal] = useState(null);
  const [quizForm, setQuizForm] = useState({ titre: "", id_lecon: "" });
  const [quizError, setQuizError] = useState(null);

  const [questionModal, setQuestionModal] = useState(null);
  const [questionText, setQuestionText] = useState("");
  const [questionError, setQuestionError] = useState(null);

  const [answerModal, setAnswerModal] = useState(null);
  const [answerForm, setAnswerForm] = useState({ contenu: "", est_correcte: false });
  const [answerError, setAnswerError] = useState(null);

  const [deleting, setDeleting] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const q = await quizService.index();
      const allQuizzes = q.data || [];
      setQuizzes(allQuizzes);

      const qMap = {};
      const aMap = {};
      for (const quiz of allQuizzes) {
        const qRes = await questionServiceExtended.getByQuiz(quiz.id_quiz);
        qMap[quiz.id_quiz] = qRes.data || [];
        for (const question of qRes.data || []) {
          const aRes = await answerServiceExtended.getByQuestion(question.id_question);
          aMap[question.id_question] = aRes.data || [];
        }
      }
      setQuestionsByQuiz(qMap);
      setAnswersByQuestion(aMap);

      if (preselected) {
        const first = allQuizzes.find((q) => Number(q.id_lecon) === preselected);
        if (first) setExpanded(first.id_quiz);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingLessons) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingLessons]);

  const ownedQuizIds = useMemo(() => {
    const lessonIds = new Set(lessons.map((l) => l.id_lecon));
    return new Set(quizzes.filter((q) => lessonIds.has(q.id_lecon)).map((q) => q.id_quiz));
  }, [quizzes, lessons]);

  const ownedQuizzes = quizzes.filter((q) => ownedQuizIds.has(q.id_quiz));

  const saveQuiz = async (e) => {
    e.preventDefault();
    setBusy(true);
    setQuizError(null);
    try {
      const payload = { titre: quizForm.titre, id_lecon: Number(quizForm.id_lecon) };
      if (quizModal?.item) await quizService.update(quizModal.item.id_quiz, payload);
      else await quizService.store(payload);
      setNotice("Quiz enregistré.");
      setQuizModal(null);
      loadAll();
    } catch (err) {
      setQuizError(err);
    } finally {
      setBusy(false);
    }
  };

  const saveQuestion = async (e) => {
    e.preventDefault();
    setBusy(true);
    setQuestionError(null);
    try {
      await questionServiceExtended.store({ id_quiz: questionModal.id_quiz, enonce: questionText });
      setNotice("Question ajoutée.");
      setQuestionModal(null);
      loadAll();
    } catch (err) {
      setQuestionError(err);
    } finally {
      setBusy(false);
    }
  };

  const saveAnswer = async (e) => {
    e.preventDefault();
    setBusy(true);
    setAnswerError(null);
    try {
      await answerServiceExtended.store({
        id_question: answerModal.id_question,
        contenu: answerForm.contenu,
        est_correcte: answerForm.est_correcte,
      });
      setNotice("Réponse ajoutée.");
      setAnswerModal(null);
      loadAll();
    } catch (err) {
      setAnswerError(err);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      const { type, item } = deleting;
      if (type === "quiz") await quizService.destroy(item.id_quiz);
      else if (type === "question") await questionServiceExtended.destroy(item.id_question);
      else if (type === "answer") await answerServiceExtended.destroy(item.id_reponse);
      setNotice("Supprimé.");
      setDeleting(null);
      loadAll();
    } catch (err) {
      setError(err);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  if (loading || loadingLessons) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Quiz"
        subtitle="Créez vos quiz et leurs questions"
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setQuizForm({ titre: "", id_lecon: preselected || "" });
              setQuizError(null);
              setQuizModal({});
            }}
          >
            <Icons.plus className="h-4 w-4" /> Nouveau quiz
          </button>
        }
      />

      {notice && <Alert type="success" className="mb-4" title={notice} />}
      {error && <Alert type="error" className="mb-4" title={error.message} />}

      {ownedQuizzes.length === 0 ? (
        <Card>
          <EmptyState title="Aucun quiz" message="Créez un quiz rattaché à l'une de vos leçons." />
        </Card>
      ) : (
        <div className="space-y-3">
          {ownedQuizzes.map((q) => {
            const questions = questionsByQuiz[q.id_quiz] || [];
            const open = expanded === q.id_quiz;
            return (
              <Card key={q.id_quiz} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icons.quiz />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{q.titre}</p>
                      <p className="text-xs text-slate-400">{q.lecon}</p>
                    </div>
                    <Badge tone="neutral">{questions.length} question{questions.length > 1 ? "s" : ""}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn-secondary !px-3 !py-1.5 !text-xs"
                      onClick={() => setExpanded(open ? null : q.id_quiz)}
                    >
                      {open ? "Réduire" : "Gérer"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary !px-3 !py-1.5 !text-xs"
                      onClick={() => {
                        setQuizForm({ titre: q.titre, id_lecon: q.id_lecon });
                        setQuizError(null);
                        setQuizModal({ item: q });
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="btn-ghost !px-3 !py-1.5 !text-xs text-red-600 hover:bg-red-50"
                      onClick={() => setDeleting({ type: "quiz", item: q })}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="border-t border-slate-100 p-4">
                    {questions.length === 0 && (
                      <p className="mb-4 text-sm text-slate-400">Aucune question pour l'instant.</p>
                    )}
                    <div className="space-y-3">
                      {questions.map((question) => {
                        const answers = answersByQuestion[question.id_question] || [];
                        return (
                          <div key={question.id_question} className="rounded-xl border border-slate-100 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-medium text-slate-800">{question.enonce}</p>
                              <div className="flex shrink-0 items-center gap-2">
                                <button type="button" className="btn-secondary !px-2.5 !py-1 !text-xs" onClick={() => { setAnswerForm({ contenu: "", est_correcte: false }); setAnswerError(null); setAnswerModal({ id_question: question.id_question }); }}>
                                  + Réponse
                                </button>
                                <button type="button" className="btn-ghost !px-2.5 !py-1 !text-xs text-red-600 hover:bg-red-50" onClick={() => setDeleting({ type: "question", item: question })}>
                                  Supprimer
                                </button>
                              </div>
                            </div>
                            <ul className="mt-3 space-y-1.5">
                              {answers.length === 0 && <li className="text-sm text-slate-400">Aucune réponse.</li>}
                              {answers.map((a) => (
                                <li key={a.id_reponse} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    {a.est_correcte ? <Badge tone="success">Correcte</Badge> : <Badge tone="neutral">Fausse</Badge>}
                                    <p className="text-sm text-slate-700">{a.contenu}</p>
                                  </div>
                                  <button type="button" className="btn-ghost !px-2 !py-1 !text-xs text-red-600 hover:bg-red-50" onClick={() => setDeleting({ type: "answer", item: a })}>
                                    Supprimer
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      className="btn-secondary mt-4 !py-2 text-sm"
                      onClick={() => { setQuestionText(""); setQuestionError(null); setQuestionModal({ id_quiz: q.id_quiz }); }}
                    >
                      + Question
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={Boolean(quizModal)} onClose={() => setQuizModal(null)} title={quizModal?.item ? "Modifier le quiz" : "Nouveau quiz"}
        footer={<button type="submit" form="quiz-form" className="btn-primary" disabled={busy}>{busy ? "Enregistrement..." : "Enregistrer"}</button>}>
        <FormAlert error={quizError} />
        <form id="quiz-form" onSubmit={saveQuiz} className="space-y-4">
          <div>
            <label className="label">Titre</label>
            <input className="input" value={quizForm.titre} onChange={(e) => setQuizForm({ ...quizForm, titre: e.target.value })} />
            <FieldError error={quizError} name="titre" />
          </div>
          <div>
            <label className="label">Leçon</label>
            <select className="input" value={quizForm.id_lecon} onChange={(e) => setQuizForm({ ...quizForm, id_lecon: e.target.value })}>
              <option value="">Choisir...</option>
              {lessons.map((l) => (
                <option key={l.id_lecon} value={l.id_lecon}>{l.titre}</option>
              ))}
            </select>
            <FieldError error={quizError} name="id_lecon" />
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(questionModal)} onClose={() => setQuestionModal(null)} title="Nouvelle question"
        footer={<button type="submit" form="question-form" className="btn-primary" disabled={busy}>{busy ? "Enregistrement..." : "Ajouter"}</button>}>
        <FormAlert error={questionError} />
        <form id="question-form" onSubmit={saveQuestion} className="space-y-4">
          <div>
            <label className="label">Énoncé</label>
            <textarea className="input" rows={3} value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
            <FieldError error={questionError} name="enonce" />
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(answerModal)} onClose={() => setAnswerModal(null)} title="Nouvelle réponse"
        footer={<button type="submit" form="answer-form" className="btn-primary" disabled={busy}>{busy ? "Enregistrement..." : "Ajouter"}</button>}>
        <FormAlert error={answerError} />
        <form id="answer-form" onSubmit={saveAnswer} className="space-y-4">
          <div>
            <label className="label">Contenu</label>
            <input className="input" value={answerForm.contenu} onChange={(e) => setAnswerForm({ ...answerForm, contenu: e.target.value })} />
            <FieldError error={answerError} name="contenu" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" checked={answerForm.est_correcte} onChange={(e) => setAnswerForm({ ...answerForm, est_correcte: e.target.checked })} />
            Réponse correcte
          </label>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={confirmDelete} busy={busy} title="Supprimer cet élément ?" />
    </div>
  );
}
