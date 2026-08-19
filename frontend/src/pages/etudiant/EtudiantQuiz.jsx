import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Alert from "../../components/ui/Alert";
import { quizService } from "../../services/quizService";
import { questionServiceExtended } from "../../services/questionService";
import { answerServiceExtended } from "../../services/answerService";
import { studentAnswerServiceExtended } from "../../services/studentAnswerService";
import { attemptServiceExtended } from "../../services/attemptService";
import { Icons } from "../../components/Icons";

export default function EtudiantQuiz() {
  const { id } = useParams();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answersByQuestion, setAnswersByQuestion] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [phase, setPhase] = useState("intro"); // intro | taking | done
  const [attemptId, setAttemptId] = useState(null);
  const [selected, setSelected] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const q = await quizService.show(id);
        setQuiz(q.data);
        const qRes = await questionServiceExtended.getByQuiz(id);
        const list = qRes.data || [];
        setQuestions(list);
        const map = {};
        for (const question of list) {
          const aRes = await answerServiceExtended.getByQuestion(question.id_question);
          map[question.id_question] = aRes.data || [];
        }
        setAnswersByQuestion(map);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const start = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await attemptServiceExtended.store({
        id_utilisateur: user.id,
        id_quiz: Number(id),
      });
      setAttemptId(res.data.id);
      setPhase("taking");
    } catch (err) {
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      for (const question of questions) {
        const answerId = selected[question.id_question];
        if (!answerId) continue;
        await studentAnswerServiceExtended.store({
          id_tentative: attemptId,
          id_question: question.id_question,
          id_reponse: answerId,
        });
      }
      const attemptRes = await attemptServiceExtended.show(attemptId);
      const note = attemptRes.data?.note;
      const score =
        note !== null && note !== undefined && note !== ""
          ? Math.round(Number(note))
          : 0;
      setResult({ total: questions.length, score });
      setPhase("done");
    } catch (err) {
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <Alert type="error" title={error.message} />;

  const answered = Object.values(selected).filter(Boolean).length;
  const allAnswered = answered === questions.length;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={quiz?.titre} subtitle={quiz?.lecon} />

      {submitError && <Alert type="error" className="mb-4" title={submitError.message} />}

      {phase === "intro" && (
        <Card className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Icons.quiz />
          </div>
          <h3 className="text-xl font-bold text-slate-900">{questions.length} question{questions.length > 1 ? "s" : ""}</h3>
          <p className="mt-2 text-sm text-slate-500">Vous allez répondre à un questionnaire à choix multiples.</p>
          <button type="button" className="btn-primary mt-6" onClick={start} disabled={submitting}>
            {submitting ? "Démarrage..." : "Commencer le quiz"}
          </button>
        </Card>
      )}

      {phase === "taking" && (
        <>
          <Card className="mb-4 flex items-center justify-between p-4">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-800">{answered}</span> / {questions.length} répondu{questions.length > 1 ? "es" : ""}
            </p>
            <button type="button" className="btn-primary" disabled={submitting || !allAnswered} onClick={submitQuiz}>
              {submitting ? "Envoi..." : "Valider mes réponses"}
            </button>
          </Card>

          <div className="space-y-4">
            {questions.map((question, idx) => {
              const options = answersByQuestion[question.id_question] || [];
              return (
                <Card key={question.id_question} className="p-5">
                  <p className="font-medium text-slate-900">
                    <span className="mr-2 text-brand-600">Q{idx + 1}.</span>
                    {question.enonce}
                  </p>
                  <div className="mt-3 space-y-2">
                    {options.map((a) => {
                      const isChecked = selected[question.id_question] === a.id_reponse;
                      return (
                        <label key={a.id_reponse} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 transition ${isChecked ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-brand-200"}`}>
                          <input
                            type="radio"
                            name={`q-${question.id_question}`}
                            className="h-4 w-4 text-brand-600"
                            checked={isChecked}
                            onChange={() => setSelected({ ...selected, [question.id_question]: a.id_reponse })}
                          />
                          <span className="text-sm text-slate-700">{a.contenu}</span>
                        </label>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {phase === "done" && result && (
        <Card className="p-6 text-center">
          <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold ${result.score >= 50 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
            {result.score}%
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {result.score >= 50 ? "Félicitations !" : "Continuez vos efforts !"}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Note : {result.score}% sur {result.total} question{result.total > 1 ? "s" : ""}.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/etudiant/tentatives" className="btn-secondary">Voir mes tentatives</Link>
            <Link to="/etudiant/parcours" className="btn-primary">Retour au parcours</Link>
          </div>
        </Card>
      )}
    </div>
  );
}
