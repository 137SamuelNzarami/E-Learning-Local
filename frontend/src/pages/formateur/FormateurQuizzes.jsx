import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
import { chapterServiceExtended } from "../../services/chapterService";
import { useOwnedFormations } from "../../hooks/useOwnedFormations";
import { getErrorMessage } from "../../utils/format";
import { Icons } from "../../components/Icons";

/**
 * Gestion des quiz par CHAPITRE (backend : un seul quiz par chapitre).
 * - QCM   : cocher toutes les réponses correctes (correction auto serveur) ;
 * - LIBRE : pas d'options → correction manuelle par le formateur.
 * Écriture des réponses : champ `texte` (lecture : colonne `contenu`).
 */
export default function FormateurQuizzes() {
  const [searchParams] = useSearchParams();
  const chapitrePreselect = Number(searchParams.get("chapitre")) || null;
  const { formations } = useOwnedFormations();

  const [chapters, setChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [quizzesByChapter, setQuizzesByChapter] = useState({});
  const [questionsByQuiz, setQuestionsByQuiz] = useState({});
  const [answersByQuestion, setAnswersByQuestion] = useState({});
  const [expanded, setExpanded] = useState(chapitrePreselect);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const [quizModal, setQuizModal] = useState(null);
  const [quizForm, setQuizForm] = useState({ titre: "", score_reussite: 50 });
  const [quizError, setQuizError] = useState(null);

  const [questionModal, setQuestionModal] = useState(null);
  const [questionForm, setQuestionForm] = useState({ enonce: "", type: "QCM", points: 1 });
  const [questionError, setQuestionError] = useState(null);

  const [answerModal, setAnswerModal] = useState(null);
  const [answerForm, setAnswerForm] = useState({ texte: "", est_correcte: false });
  const [answerError, setAnswerError] = useState(null);

  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (!formations) return;
    let cancelled = false;
    (async () => {
      setLoadingChapters(true);
      try {
        const lists = await Promise.all(
          formations.map((f) => chapterServiceExtended.byFormation(f.id_formation)),
        );
        if (cancelled) return;
        const rows = [];
        formations.forEach((f, i) => {
          for (const c of lists[i].data || []) {
            rows.push({
              id_chapitre: c.id_chapitre,
              titre: c.titre,
              a_quiz: !!c.a_quiz,
              formationTitre: f.titre,
            });
          }
        });
        rows.sort((a, b) => a.formationTitre.localeCompare(b.formationTitre));
        setChapters(rows);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoadingChapters(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formations]);

  useEffect(() => {
    if (loadingChapters) return;
    (async () => {
      setLoadingQuizzes(true);
      try {
        const res = await quizService.index();
        const map = {};
        for (const q of res.data || []) map[q.id_chapitre] = q;
        setQuizzesByChapter(map);
      } catch (err) {
        setError(err);
      } finally {
        setLoadingQuizzes(false);
      }
    })();
  }, [loadingChapters]);

  const loadQuestions = async (idQuiz) => {
    const qRes = await questionServiceExtended.getByQuiz(idQuiz);
    const list = qRes.data || [];
    setQuestionsByQuiz((m) => ({ ...m, [idQuiz]: list }));
    const pairs = await Promise.all(
      list.map(async (question) => {
        const aRes = await answerServiceExtended.getByQuestion(question.id_question);
        return [question.id_question, aRes.data || []];
      }),
    );
    setAnswersByQuestion((m) => ({ ...m, ...Object.fromEntries(pairs) }));
  };

  const toggleExpand = async (chapter) => {
    const open = expanded === chapter.id_chapitre;
    setExpanded(open ? null : chapter.id_chapitre);
    if (open) return;
    const quiz = quizzesByChapter[chapter.id_chapitre];
    if (quiz && !questionsByQuiz[quiz.id_quiz]) {
      try {
        await loadQuestions(quiz.id_quiz);
      } catch (err) {
        setError(err);
      }
    }
  };

  const saveQuiz = async (e) => {
    e.preventDefault();
    setBusy(true);
    setQuizError(null);
    try {
      const payload = { titre: quizForm.titre, score_reussite: Number(quizForm.score_reussite) };
      let saved;
      if (quizModal.item) saved = await quizService.update(quizModal.item.id_quiz, payload);
      else saved = await quizService.store({ ...payload, id_chapitre: Number(quizModal.id_chapitre) });
      const idChapitre = Number(quizModal.item ? quizModal.item.id_chapitre : quizModal.id_chapitre);
      setQuizzesByChapter((m) => ({ ...m, [idChapitre]: saved.data }));
      setChapters((cs) => cs.map((c) => (c.id_chapitre === idChapitre ? { ...c, a_quiz: true } : c)));
      setNotice("Quiz enregistré.");
      setQuizModal(null);
      await loadQuestions(saved.data.id_quiz);
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
        // type immuable côté backend → jamais renvoyé en update
        await questionServiceExtended.update(questionModal.item.id_question, base);
      } else {
        await questionServiceExtended.store({
          ...base,
          type: questionForm.type,
          id_quiz: questionModal.id_quiz,
        });
      }
      setNotice("Question enregistrée.");
      const idQuiz = questionModal.id_quiz;
      setQuestionModal(null);
      await loadQuestions(idQuiz);
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
      setNotice("Réponse ajoutée.");
      const question = Object.values(questionsByQuiz)
        .flat()
        .find((q) => q.id_question === answerModal.id_question);
      setAnswerModal(null);
      if (question) await loadQuestions(question.id_quiz);
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
        setQuizzesByChapter((m) => {
          const next = { ...m };
          delete next[item.id_chapitre];
          return next;
        });
        setChapters((cs) =>
          cs.map((c) => (c.id_chapitre === item.id_chapitre ? { ...c, a_quiz: false } : c)),
        );
      } else if (type === "question") {
        await questionServiceExtended.destroy(item.id_question);
        await loadQuestions(deleting.idQuiz);
      } else if (type === "answer") {
        await answerServiceExtended.destroy(item.id_reponse);
        await loadQuestions(deleting.idQuiz);
      }
      setNotice("Supprimé.");
      setDeleting(null);
    } catch (err) {
      setError(err);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  if ((loadingChapters || loadingQuizzes) && chapters.length === 0) return <Spinner />;

  return (
    <div>
      <PageHeader title="Quiz" subtitle="Un quiz par chapitre — QCM auto-corrigés ou questions libres" />

      {notice && <Alert type="success" className="mb-4" title={notice} />}
      {error && <Alert type="error" className="mb-4" title={getErrorMessage(error)} />}
      {!error && chapters.length === 0 && (
        <Card>
          <EmptyState
            title="Aucun chapitre"
            message="Créez d'abord une formation avec des chapitres depuis « Mes formations »."
            action={
              <Link to="/formateur/formations" className="btn-primary">
                Mes formations
              </Link>
            }
          />
        </Card>
      )}

      <div className="space-y-3">
        {chapters.map((chapter) => (
          <ChapterQuizRow
            key={chapter.id_chapitre}
            chapter={chapter}
            quiz={quizzesByChapter[chapter.id_chapitre]}
            open={expanded === chapter.id_chapitre}
            questions={quizzesByChapter[chapter.id_chapitre]
              ? questionsByQuiz[quizzesByChapter[chapter.id_chapitre].id_quiz] || []
              : []}
            answersByQuestion={answersByQuestion}
            onToggle={() => toggleExpand(chapter)}
            onCreateQuiz={() => {
              setQuizForm({ titre: `Quiz — ${chapter.titre}`, score_reussite: 50 });
              setQuizError(null);
              setQuizModal({ id_chapitre: chapter.id_chapitre });
            }}
            onEditQuiz={() => {
              const q = quizzesByChapter[chapter.id_chapitre];
              setQuizForm({ titre: q.titre, score_reussite: Number(q.score_reussite) });
              setQuizError(null);
              setQuizModal({ id_chapitre: chapter.id_chapitre, item: { ...q, id_chapitre: chapter.id_chapitre } });
            }}
            onDeleteQuiz={(item) => setDeleting({ type: "quiz", item })}
            onDeleteQuestion={(item, idQuiz) => setDeleting({ type: "question", item, idQuiz })}
            onDeleteAnswer={(item, idQuiz) => setDeleting({ type: "answer", item, idQuiz })}
            onAddQuestion={() => {
              setQuestionForm({ enonce: "", type: "QCM", points: 1 });
              setQuestionError(null);
              setQuestionModal({ id_quiz: quizzesByChapter[chapter.id_chapitre].id_quiz });
            }}
            onAddAnswer={(idQuestion) => {
              setAnswerForm({ texte: "", est_correcte: false });
              setAnswerError(null);
              setAnswerModal({ id_question: idQuestion });
            }}
          />
        ))}
      </div>

      {/* MODALES */}
      <Modal
        open={Boolean(quizModal)}
        onClose={() => setQuizModal(null)}
        title={quizModal?.item ? "Paramètres du quiz" : "Nouveau quiz"}
        footer={
          <button type="submit" form="quiz-form" className="btn-primary" disabled={busy}>
            {busy ? "Enregistrement..." : "Enregistrer"}
          </button>
        }
      >
        <FormAlert error={quizError} />
        <form id="quiz-form" onSubmit={saveQuiz} className="space-y-4">
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
        </form>
      </Modal>

      <Modal
        open={Boolean(questionModal)}
        onClose={() => setQuestionModal(null)}
        title={questionModal?.item ? "Modifier la question" : "Nouvelle question"}
        footer={
          <button type="submit" form="question-form" className="btn-primary" disabled={busy}>
            {busy ? "Enregistrement..." : "Enregistrer"}
          </button>
        }
      >
        <FormAlert error={questionError} />
        <form id="question-form" onSubmit={saveQuestion} className="space-y-4">
          <div>
            <label className="label">Énoncé</label>
            <textarea className="input" rows={3} value={questionForm.enonce} onChange={(e) => setQuestionForm({ ...questionForm, enonce: e.target.value })} />
            <FieldError error={questionError} name="enonce" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select
                className="input"
                value={questionForm.type}
                disabled={Boolean(questionModal?.item)}
                onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value })}
              >
                <option value="QCM">QCM</option>
                <option value="LIBRE">Réponse libre</option>
              </select>
              {questionModal?.item && (
                <p className="mt-1 text-xs text-slate-400">Le type n'est plus modifiable.</p>
              )}
            </div>
            <div>
              <label className="label">Points</label>
              <input className="input" type="number" min={1} value={questionForm.points} onChange={(e) => setQuestionForm({ ...questionForm, points: e.target.value })} />
              <FieldError error={questionError} name="points" />
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(answerModal)}
        onClose={() => setAnswerModal(null)}
        title="Nouvelle réponse"
        footer={
          <button type="submit" form="answer-form" className="btn-primary" disabled={busy}>
            {busy ? "Enregistrement..." : "Ajouter"}
          </button>
        }
      >
        <FormAlert error={answerError} />
        <form id="answer-form" onSubmit={saveAnswer} className="space-y-4">
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
        message={
          deleting?.type === "quiz"
            ? "Les questions et réponses associées seront également supprimées."
            : undefined
        }
      />
    </div>
  );
}

function ChapterQuizRow(props) {
  const {
    chapter,
    quiz,
    open,
    questions,
    answersByQuestion,
    onToggle,
    onCreateQuiz,
    onEditQuiz,
    onDeleteQuiz,
    onDeleteQuestion,
    onDeleteAnswer,
    onAddQuestion,
    onAddAnswer,
  } = props;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Icons.quiz />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{chapter.titre}</p>
            <p className="text-xs text-slate-400">{chapter.formationTitre}</p>
          </div>
          {quiz ? (
            <Badge tone="info">{quiz.titre} · seuil {Number(quiz.score_reussite)}%</Badge>
          ) : (
            <Badge tone="neutral">Pas de quiz</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary !px-3 !py-1.5 !text-xs" onClick={onToggle}>
            {open ? "Réduire" : "Gérer"}
          </button>
          {quiz ? (
            <>
              <Link to={`/formateur/corrections?quiz=${quiz.id_quiz}`} className="btn-secondary !px-3 !py-1.5 !text-xs">
                Corrections
              </Link>
              <button type="button" className="btn-secondary !px-3 !py-1.5 !text-xs" onClick={onEditQuiz}>
                Paramètres
              </button>
              <button
                type="button"
                className="btn-ghost !px-2 !py-1 !text-xs text-red-600 hover:bg-red-50"
                onClick={() => onDeleteQuiz({ ...quiz, id_chapitre: chapter.id_chapitre })}
              >
                Supprimer
              </button>
            </>
          ) : (
            <button type="button" className="btn-primary !px-3 !py-1.5 !text-xs" onClick={onCreateQuiz}>
              + Créer le quiz
            </button>
          )}
        </div>
      </div>

      {open && quiz && (
        <div className="border-t border-slate-100 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-500">
              {questions.length} question{questions.length > 1 ? "s" : ""}
            </p>
            <button type="button" className="btn-primary !px-3 !py-1.5 !text-xs" onClick={onAddQuestion}>
              + Question
            </button>
          </div>

          {questions.length === 0 && (
            <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
              Ajoutez au moins une question pour que l'étudiant puisse valider ce chapitre.
            </p>
          )}

          <div className="space-y-3">
            {questions.map((question, idx) => {
              const answers = answersByQuestion[question.id_question] || [];
              return (
                <div key={question.id_question} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium text-slate-800">
                      <span className="mr-2 text-brand-600">Q{idx + 1}.</span>
                      {question.enonce}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={question.type === "LIBRE" ? "violet" : "sky"}>
                        {question.type === "LIBRE" ? "Libre" : "QCM"} · {Number(question.points)} pt{Number(question.points) > 1 ? "s" : ""}
                      </Badge>
                      {question.type === "QCM" && (
                        <button
                          type="button"
                          className="btn-secondary !px-2.5 !py-1 !text-xs"
                          onClick={() => onAddAnswer(question.id_question)}
                        >
                          + Réponse
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-ghost !px-2 !py-1 !text-xs text-red-600 hover:bg-red-50"
                        onClick={() => onDeleteQuestion(question, quiz.id_quiz)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                  {question.type === "LIBRE" ? (
                    <p className="mt-3 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700">
                      Question libre : l'étudiant rédige sa réponse, vous la notez manuellement dans « Corrections ».
                    </p>
                  ) : (
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
                            className="btn-ghost !px-2 !py-1 !text-xs text-red-600 hover:bg-red-50"
                            onClick={() => onDeleteAnswer(a, quiz.id_quiz)}
                          >
                            Supprimer
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
