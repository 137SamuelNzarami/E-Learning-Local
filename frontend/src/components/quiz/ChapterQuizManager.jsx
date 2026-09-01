import { useEffect, useState } from "react";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Badge from "../../components/ui/Badge";
import FieldError, { FormAlert } from "../../components/ui/FieldError";
import { quizService } from "../../services/quizService";
import { questionServiceExtended } from "../../services/questionService";
import { answerServiceExtended } from "../../services/answerService";
import { getErrorMessage } from "../../utils/format";
import { Icons } from "../../components/Icons";

/**
 * Gestion du quiz rattaché à un chapitre, intégrée au FormationBuilder.
 *
 * Affiché sous chaque chapitre de l'arbre pédagogique. Permet de créer /
 * modifier / supprimer le quiz du chapitre, puis de gérer ses questions
 * (QCM exclusivement) et leurs réponses (multi-sélection possible).
 *
 * Règle métier : un seul quiz par chapitre (protégé côté backend).
 */
export default function ChapterQuizManager({ chapter, onNotice }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [answersByQuestion, setAnswersByQuestion] = useState({});

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [quizModal, setQuizModal] = useState(null);
  const [quizForm, setQuizForm] = useState({ titre: "", score_reussite: 50 });
  const [quizError, setQuizError] = useState(null);

  const [questionModal, setQuestionModal] = useState(null);
  const [questionForm, setQuestionForm] = useState({ enonce: "", points: 1 });
  const [questionError, setQuestionError] = useState(null);

  const [answerModal, setAnswerModal] = useState(null);
  const [answerForm, setAnswerForm] = useState({ texte: "", est_correcte: false });
  const [answerError, setAnswerError] = useState(null);

  const [deleting, setDeleting] = useState(null);

  const loadQuiz = async () => {
    try {
      const res = await quizService.getBy("chapter", chapter.id_chapitre);
      const found = (res.data || [])[0] || null;
      setQuiz(found);
      if (found) await loadQuestions(found.id_quiz);
    } catch {
      setQuiz(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadQuiz().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter.id_chapitre]);

  const loadQuestions = async (idQuiz) => {
    const qRes = await questionServiceExtended.getByQuiz(idQuiz);
    const list = qRes.data || [];
    setQuestions(list);
    const pairs = await Promise.all(
      list.map(async (q) => {
        const aRes = await answerServiceExtended.getByQuestion(q.id_question);
        return [q.id_question, aRes.data || []];
      }),
    );
    setAnswersByQuestion(Object.fromEntries(pairs));
  };

  const saveQuiz = async (e) => {
    e.preventDefault();
    setBusy(true);
    setQuizError(null);
    try {
      const payload = { titre: quizForm.titre, score_reussite: Number(quizForm.score_reussite) };
      let saved;
      if (quizModal.item) {
        saved = await quizService.update(quizModal.item.id_quiz, payload);
      } else {
        const created = await quizService.store({ ...payload, id_chapitre: Number(chapter.id_chapitre) });
        saved = await quizService.show(created.data.id);
      }
      setQuiz(saved.data ?? saved);
      setQuizModal(null);
      onNotice("Quiz enregistré.");
      await loadQuiz();
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
      const base = { enonce: questionForm.enonce, points: Number(questionForm.points) };
      if (questionModal.item) {
        await questionServiceExtended.update(questionModal.item.id_question, base);
      } else {
        await questionServiceExtended.store({ ...base, type: "QCM", id_quiz: questionModal.id_quiz });
      }
      setQuestionModal(null);
      onNotice("Question enregistrée.");
      await loadQuestions(questionModal.id_quiz);
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
        texte: answerForm.texte,
        est_correcte: answerForm.est_correcte,
      });
      setAnswerModal(null);
      onNotice("Réponse ajoutée.");
      if (quiz) await loadQuestions(quiz.id_quiz);
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
      if (type === "quiz") {
        await quizService.destroy(item.id_quiz);
        setQuiz(null);
        setQuestions([]);
        setAnswersByQuestion({});
        setExpanded(false);
      } else if (type === "question") {
        await questionServiceExtended.destroy(item.id_question);
        if (quiz) await loadQuestions(quiz.id_quiz);
      } else if (type === "answer") {
        await answerServiceExtended.destroy(item.id_reponse);
        if (quiz) await loadQuestions(quiz.id_quiz);
      }
      onNotice("Supprimé.");
      setDeleting(null);
    } catch (err) {
      setError(err);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
        <p className="flex items-center gap-2 text-xs text-slate-400">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
          Chargement du quiz…
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/30">
      {error && (
        <div className="px-4 pt-2">
          <p className="text-xs font-semibold text-red-600">{getErrorMessage(error)}</p>
        </div>
      )}

      {/* Header de la zone */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icons.quiz className="h-4 w-4 shrink-0 text-brand-600" />
          <p className="text-[13px] font-bold text-slate-700">Quiz du chapitre</p>
          {quiz ? (
            <Badge tone="success">
              <Icons.check className="h-3 w-3" /> Quiz configuré
            </Badge>
          ) : (
            <Badge tone="neutral">Aucun quiz configuré</Badge>
          )}
        </div>
        {quiz && (
          <button
            type="button"
            className="btn-ghost !py-1 !text-[11px] text-brand-600"
            onClick={() => setExpanded((x) => !x)}
          >
            {expanded ? "Réduire" : "Gérer les questions"}
          </button>
        )}
      </div>

      {!quiz ? (
        <div className="border-t border-dashed border-brand-200/60 px-4 py-3">
          <p className="mb-3 text-xs text-slate-500">
            Ce chapitre ne possède pas encore de quiz. Ajoutez-en un pour que les étudiants puissent valider ce chapitre.
          </p>
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => {
              setQuizForm({ titre: `Quiz — ${chapter.titre}`, score_reussite: 50 });
              setQuizError(null);
              setQuizModal({});
            }}
          >
            <Icons.plus className="h-3.5 w-3.5" /> Ajouter le quiz
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-brand-200/60 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{quiz.titre}</p>
              <p className="text-[11px] text-slate-400">
                Seuil de réussite : {Number(quiz.score_reussite)} % · {questions.length} question{questions.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => {
                  setQuizForm({ titre: quiz.titre, score_reussite: Number(quiz.score_reussite) });
                  setQuizError(null);
                  setQuizModal({ item: { ...quiz, id_chapitre: chapter.id_chapitre } });
                }}
              >
                <Icons.edit className="h-3 w-3" /> Modifier
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => setExpanded((x) => !x)}
              >
                <Icons.quiz className="h-3 w-3" /> {expanded ? "Réduire" : "Gérer les questions"}
              </button>
              <button
                type="button"
                className="btn-ghost btn-sm !text-danger-500 hover:!bg-danger-50"
                onClick={() => setDeleting({ type: "quiz", item: { ...quiz, id_chapitre: chapter.id_chapitre } })}
              >
                <Icons.trash className="h-3 w-3" />
              </button>
            </div>
          </div>

          {expanded && (
            <div className="border-t border-dashed border-brand-200/60 px-4 py-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-500">
                  {questions.length} question{questions.length > 1 ? "s" : ""} — QCM à correction automatique
                </p>
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  onClick={() => {
                    setQuestionForm({ enonce: "", points: 1 });
                    setQuestionError(null);
                    setQuestionModal({ id_quiz: quiz.id_quiz });
                  }}
                >
                  <Icons.plus className="h-3 w-3" /> Question
                </button>
              </div>

              {questions.length === 0 && (
                <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                  Ajoutez au moins une question pour que l'étudiant puisse valider ce chapitre.
                </p>
              )}

              <div className="space-y-3">
                {questions.map((question, qIdx) => {
                  const answers = answersByQuestion[question.id_question] || [];
                  return (
                    <div key={question.id_question} className="rounded-xl border border-slate-100 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">
                          <span className="mr-2 text-brand-600">Q{qIdx + 1}.</span>
                          {question.enonce}
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge tone="sky">QCM · {Number(question.points)} pt{Number(question.points) > 1 ? "s" : ""}</Badge>
                          <button
                            type="button"
                            className="btn-secondary btn-sm"
                            onClick={() => {
                              setQuestionForm({ enonce: question.enonce, points: Number(question.points) });
                              setQuestionError(null);
                              setQuestionModal({ id_quiz: quiz.id_quiz, item: question });
                            }}
                          >
                            <Icons.edit className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            className="btn-secondary btn-sm"
                            onClick={() => {
                              setAnswerForm({ texte: "", est_correcte: false });
                              setAnswerError(null);
                              setAnswerModal({ id_question: question.id_question });
                            }}
                          >
                            <Icons.plus className="h-3 w-3" /> Réponse
                          </button>
                          <button
                            type="button"
                            className="btn-ghost btn-sm !text-danger-500 hover:!bg-danger-50"
                            onClick={() => setDeleting({ type: "question", item: question })}
                          >
                            <Icons.trash className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {answers.length === 0 && <li className="text-sm text-slate-400">Aucune réponse.</li>}
                        {answers.map((a) => (
                          <li key={a.id_reponse} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                            <div className="flex items-center gap-2">
                              {a.est_correcte ? (
                                <Badge tone="success">Correcte</Badge>
                              ) : (
                                <Badge tone="neutral">Fausse</Badge>
                              )}
                              <p className="text-sm text-slate-700">{a.contenu ?? a.texte}</p>
                            </div>
                            <button
                              type="button"
                              className="btn-ghost btn-sm !text-danger-500 hover:!bg-danger-50"
                              onClick={() => setDeleting({ type: "answer", item: a })}
                            >
                              <Icons.trash className="h-3 w-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modale quiz */}
      <Modal
        open={Boolean(quizModal)}
        onClose={() => setQuizModal(null)}
        title={quizModal?.item ? "Modifier le quiz" : "Nouveau quiz du chapitre"}
        footer={
          <button type="submit" form="chapter-quiz-form" className="btn-primary" disabled={busy}>
            {busy ? "Enregistrement..." : "Enregistrer"}
          </button>
        }
      >
        <FormAlert error={quizError} />
        <form id="chapter-quiz-form" onSubmit={saveQuiz} className="space-y-4">
          <div>
            <label className="label">Titre</label>
            <input className="input" value={quizForm.titre} onChange={(e) => setQuizForm({ ...quizForm, titre: e.target.value })} />
            <FieldError error={quizError} name="titre" />
          </div>
          <div>
            <label className="label">Seuil de réussite (%)</label>
            <input
              className="input"
              type="number"
              min={0}
              max={100}
              value={quizForm.score_reussite}
              onChange={(e) => setQuizForm({ ...quizForm, score_reussite: e.target.value })}
            />
            <FieldError error={quizError} name="score_reussite" />
          </div>
          <p className="text-[11px] text-slate-400">
            Un seul quiz par chapitre. Le quiz n'est validé que si le score obtenu par l'étudiant atteint ce seuil.
          </p>
        </form>
      </Modal>

      {/* Modale question */}
      <Modal
        open={Boolean(questionModal)}
        onClose={() => setQuestionModal(null)}
        title={questionModal?.item ? "Modifier la question" : "Nouvelle question QCM"}
        footer={
          <button type="submit" form="chapter-question-form" className="btn-primary" disabled={busy}>
            {busy ? "Enregistrement..." : "Enregistrer"}
          </button>
        }
      >
        <FormAlert error={questionError} />
        <form id="chapter-question-form" onSubmit={saveQuestion} className="space-y-4">
          <div>
            <label className="label">Énoncé</label>
            <textarea className="input" rows={3} value={questionForm.enonce} onChange={(e) => setQuestionForm({ ...questionForm, enonce: e.target.value })} />
            <FieldError error={questionError} name="enonce" />
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="sky">QCM</Badge>
            <p className="text-xs text-slate-400">Choix multiple — correction automatique.</p>
          </div>
          <div>
            <label className="label">Points</label>
            <input className="input" type="number" min={1} value={questionForm.points} onChange={(e) => setQuestionForm({ ...questionForm, points: e.target.value })} />
            <FieldError error={questionError} name="points" />
          </div>
        </form>
      </Modal>

      {/* Modale réponse */}
      <Modal
        open={Boolean(answerModal)}
        onClose={() => setAnswerModal(null)}
        title="Nouvelle réponse"
        footer={
          <button type="submit" form="chapter-answer-form" className="btn-primary" disabled={busy}>
            {busy ? "Enregistrement..." : "Ajouter"}
          </button>
        }
      >
        <FormAlert error={answerError} />
        <form id="chapter-answer-form" onSubmit={saveAnswer} className="space-y-4">
          <div>
            <label className="label">Texte de la réponse</label>
            <input className="input" value={answerForm.texte} onChange={(e) => setAnswerForm({ ...answerForm, texte: e.target.value })} />
            <FieldError error={answerError} name="texte" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
              checked={answerForm.est_correcte}
              onChange={(e) => setAnswerForm({ ...answerForm, est_correcte: e.target.checked })}
            />
            Réponse correcte (plusieurs cochages possibles pour un QCM multi-sélection)
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
        title="Supprimer cet élément ?"
        message={deleting?.type === "quiz" ? "Les questions et réponses associées seront également supprimées." : undefined}
      />
    </div>
  );
}
