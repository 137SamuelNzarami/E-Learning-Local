import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Alert from "../../components/ui/Alert";
import { lessonService } from "../../services/lessonService";
import { chapterService } from "../../services/chapterService";
import { moduleService } from "../../services/moduleService";
import { videoService } from "../../services/videoService";
import { documentService } from "../../services/documentService";
import { quizService } from "../../services/quizService";
import { assignmentService } from "../../services/assignmentService";
import { fileUrl } from "../../utils/format";
import { Icons } from "../../components/Icons";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useAuth } from "../../context/AuthContext";

export default function EtudiantLecon() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [module, setModule] = useState(null);
  const [videos, setVideos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [completionPct, setCompletionPct] = useState(null);
  const [completeBusy, setCompleteBusy] = useState(false);
  const [completeError, setCompleteError] = useState(null);

  const loadCompletion = (leconId) =>
    lessonService.status(leconId).then((res) => {
      const d = res?.data;
      setCompleted(Boolean(d?.completed));
      if (d?.pourcentage != null) setCompletionPct(Number(d.pourcentage));
    });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const lessonRes = await lessonService.show(id);
        const lecon = lessonRes.data;
        setLesson(lecon);

        const [chRes, v, d, q, a] = await Promise.all([
          chapterService.show(lecon.id_chapitre),
          videoService.index(),
          documentService.index(),
          quizService.index(),
          assignmentService.index(),
        ]);
        const chapitre = chRes.data;
        setChapter(chapitre);

        const modRes = await moduleService.show(chapitre.id_module);
        setModule(modRes.data);

        setVideos((v.data || []).filter((x) => Number(x.id_lecon) === Number(id)));
        setDocuments((d.data || []).filter((x) => Number(x.id_lecon) === Number(id)));
        setQuiz((q.data || []).find((x) => Number(x.id_lecon) === Number(id)) || null);
        setAssignment((a.data || []).find((x) => Number(x.id_lecon) === Number(id)) || null);

        loadCompletion(id).catch(() => {});
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const markComplete = async () => {
    setCompleteBusy(true);
    setCompleteError(null);
    try {
      const res = await lessonService.complete(id);
      setCompleted(true);
      if (res?.data?.pourcentage != null) setCompletionPct(Number(res.data.pourcentage));
    } catch (err) {
      setCompleteError(err);
    } finally {
      setCompleteBusy(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <Alert type="error" title={error.message} />;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={module ? `/etudiant/formation/${module.id_formation}` : "/etudiant/parcours"} className="text-sm font-medium text-brand-600 hover:underline">
        ← Retour à la formation
      </Link>
      <PageHeader title={lesson?.titre} subtitle={`${module?.titre} · ${chapter?.titre}`} />

      {lesson?.description && (
        <Card className="mb-4 p-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Description</h3>
          <p className="text-sm leading-relaxed text-slate-700">{lesson.description}</p>
        </Card>
      )}

      {lesson?.contenu && (
        <Card className="mb-4 p-5">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Contenu</h3>
          <div className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{lesson.contenu}</div>
        </Card>
      )}

      <Card className="mb-4 p-5">
        {completionPct != null && (
          <>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-500">Progression de la formation</span>
              <span className="font-semibold text-brand-600">{completionPct}%</span>
            </div>
            <ProgressBar value={completionPct} />
            <div className="h-3" />
          </>
        )}
        {completeError && <Alert type="error" className="mb-3" title={completeError.message} />}
        {completed ? (
          <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white">
              <Icons.check />
            </span>
            <div>
              <p className="text-sm font-semibold text-green-800">Leçon terminée</p>
              <p className="text-xs text-green-700">Cette leçon est prise en compte dans votre progression.</p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn-primary w-full !py-3"
            onClick={markComplete}
            disabled={completeBusy}
          >
            {completeBusy ? "Enregistrement..." : "Marquer comme terminée"}
          </button>
        )}
      </Card>

      {videos.length > 0 && (
        <div className="mb-4 space-y-4">
          {videos.map((v) => (
            <Card key={v.id_video} className="overflow-hidden">
              <div className="p-4">
                <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                  <Icons.lessons /> {v.titre}
                </h3>
              </div>
              <video controls className="aspect-video w-full bg-black" src={fileUrl(v.chemin_video)} />
            </Card>
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <Card className="mb-4 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Documents</h3>
          <ul className="space-y-2">
            {documents.map((d) => (
              <li key={d.id_document}>
                <a href={fileUrl(d.chemin_document)} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 transition hover:border-brand-300 hover:bg-brand-50/40">
                  <span className="text-sm font-medium text-slate-800">📄 {d.titre}</span>
                  <span className="text-xs font-medium text-brand-600">Télécharger →</span>
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quiz && (
          <Link to={`/etudiant/quiz/${quiz.id_quiz}`} className="btn-primary flex items-center justify-center gap-2 !py-3">
            <Icons.quiz /> Passer le quiz : {quiz.titre}
          </Link>
        )}
        {assignment && (
          <Link to="/etudiant/devoirs" className="btn-secondary flex items-center justify-center gap-2 !py-3">
            <Icons.assignments /> Devoir : {assignment.titre}
          </Link>
        )}
      </div>
    </div>
  );
}
