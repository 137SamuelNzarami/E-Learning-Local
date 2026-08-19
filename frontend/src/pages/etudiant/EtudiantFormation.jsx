import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import { ProgressBar } from "../../components/ui/ProgressBar";
import Alert from "../../components/ui/Alert";
import FieldError, { FormAlert } from "../../components/ui/FieldError";
import { formationService } from "../../services/formationService";
import { moduleService } from "../../services/moduleService";
import { chapterService } from "../../services/chapterService";
import { lessonService } from "../../services/lessonService";
import { videoService } from "../../services/videoService";
import { documentService } from "../../services/documentService";
import { quizService } from "../../services/quizService";
import { assignmentService } from "../../services/assignmentService";
import { progressionServiceExtended } from "../../services/progressionService";
import { reviewServiceExtended } from "../../services/reviewService";
import { Icons } from "../../components/Icons";

export default function EtudiantFormation() {
  const { id } = useParams();
  const { user } = useAuth();

  const [formation, setFormation] = useState(null);
  const [modules, setModules] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [videos, setVideos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [progression, setProgression] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reviewForm, setReviewForm] = useState({ note: 5, commentaire: "" });
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [f, m, c, l, v, d, q, a, p, r, mine] = await Promise.all([
          formationService.show(id),
          moduleService.index(),
          chapterService.index(),
          lessonService.index(),
          videoService.index(),
          documentService.index(),
          quizService.index(),
          assignmentService.index(),
          progressionServiceExtended.getByUser(user.id),
          reviewServiceExtended.getByFormation(id),
          reviewServiceExtended.getByUser(user.id),
        ]);
        setFormation(f.data);
        setModules((m.data || []).filter((x) => Number(x.id_formation) === Number(id)));
        setChapters(c.data || []);
        setLessons(l.data || []);
        setVideos(v.data || []);
        setDocuments(d.data || []);
        setQuizzes(q.data || []);
        setAssignments(a.data || []);
        setProgression((p.data || []).find((x) => Number(x.id_formation) === Number(id)) || null);
        setReviews(r.data || []);
        setMyReview((mine.data || []).find((x) => Number(x.id_formation) === Number(id)) || null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user.id]);

  const moduleChapters = (idModule) => chapters.filter((c) => Number(c.id_module) === Number(idModule));
  const chapterLessons = (idChapter) => lessons.filter((l) => Number(l.id_chapitre) === Number(idChapter));
  const lessonVideos = (idLesson) => videos.filter((v) => Number(v.id_lecon) === Number(idLesson));
  const lessonDocs = (idLesson) => documents.filter((d) => Number(d.id_lecon) === Number(idLesson));
  const lessonQuiz = (idLesson) => quizzes.find((q) => Number(q.id_lecon) === Number(idLesson));
  const lessonAssignment = (idLesson) => assignments.find((a) => Number(a.id_lecon) === Number(idLesson));

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewBusy(true);
    setReviewError(null);
    try {
      await reviewServiceExtended.store({
        id_utilisateur: user.id,
        id_formation: Number(id),
        note: Number(reviewForm.note),
        commentaire: reviewForm.commentaire,
      });
      setNotice("Avis enregistré. Merci !");
      setReviewForm({ note: 5, commentaire: "" });
      const [r, mine] = await Promise.all([
        reviewServiceExtended.getByFormation(id),
        reviewServiceExtended.getByUser(user.id),
      ]);
      setReviews(r.data || []);
      setMyReview((mine.data || []).find((x) => Number(x.id_formation) === Number(id)) || null);
    } catch (err) {
      setReviewError(err);
    } finally {
      setReviewBusy(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <Alert type="error" title={error.message} />;

  const average = reviews.length
    ? (reviews.reduce((acc, r) => acc + Number(r.note), 0) / reviews.length).toFixed(1)
    : null;
  const pct = progression ? Number(progression.pourcentage) : 0;

  return (
    <div>
      <Link to="/etudiant/parcours" className="text-sm font-medium text-brand-600 hover:underline">
        ← Mon parcours
      </Link>
      <PageHeader title={formation?.titre} subtitle={formation?.description} />

      {notice && <Alert type="success" className="mb-4" title={notice} />}

      <Card className="mb-4 p-5">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-500">Votre progression</span>
          <span className="font-semibold text-brand-600">{pct}%</span>
        </div>
        <ProgressBar value={pct} />
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
          <span>Catégorie : {formation?.nom_categorie}</span>
          <span>Formateur : {formation?.prenom} {formation?.nom}</span>
          {average && <span>Note moyenne : {average}/5 ({reviews.length} avis)</span>}
        </div>
      </Card>

      <div className="space-y-3">
        {modules.length === 0 ? (
          <Card>
            <p className="py-8 text-center text-sm text-slate-400">Cette formation ne contient pas encore de contenu.</p>
          </Card>
        ) : (
          modules.map((m) => (
            <Card key={m.id_module} className="p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icons.modules />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{m.titre}</p>
                  {m.description && <p className="text-xs text-slate-500 line-clamp-2">{m.description}</p>}
                </div>
              </div>
              {moduleChapters(m.id_module).length > 0 && (
                <div className="mt-3 space-y-3 border-l-2 border-slate-100 pl-4">
                  {moduleChapters(m.id_module).map((c) => (
                    <div key={c.id_chapitre}>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{c.titre}</p>
                      {c.description && <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{c.description}</p>}
                      <ul className="mt-2 space-y-1.5">
                        {chapterLessons(c.id_chapitre).length === 0 && (
                          <li className="text-sm text-slate-400">Aucune leçon.</li>
                        )}
                        {chapterLessons(c.id_chapitre).map((l) => {
                          const nVids = lessonVideos(l.id_lecon).length;
                          const nDocs = lessonDocs(l.id_lecon).length;
                          const quiz = lessonQuiz(l.id_lecon);
                          const devoir = lessonAssignment(l.id_lecon);
                          return (
                            <li key={l.id_lecon}>
                              <Link
                                to={`/etudiant/lecon/${l.id_lecon}`}
                                className="block rounded-lg border border-slate-100 px-3 py-2 transition hover:border-brand-300 hover:bg-brand-50/40"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                                    <Icons.lessons />
                                    {l.titre}
                                  </span>
                                  <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                                    <span>🎬 {nVids}</span>
                                    <span>📄 {nDocs}</span>
                                    {quiz && <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-600">Quiz</span>}
                                    {devoir && <span className="rounded-full bg-violet-50 px-2 py-0.5 font-medium text-violet-600">Devoir</span>}
                                  </span>
                                </div>
                                {l.description && <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{l.description}</p>}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-900">Avis des étudiants</h3>
          {reviews.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">Aucun avis pour l'instant.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {reviews.map((r) => (
                <li key={r.id_avis} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800">{r.prenom} {r.nom}</p>
                    <span className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Icons.star
                          key={i}
                          className={`h-4 w-4 ${i <= r.note ? "fill-accent-500 text-accent-500" : "fill-slate-200 text-slate-200"}`}
                        />
                      ))}
                    </span>
                  </div>
                  {r.commentaire && <p className="mt-1 text-sm text-slate-600">{r.commentaire}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-base font-semibold text-slate-900">Votre avis</h3>
          {myReview ? (
            <div className="mt-3 rounded-xl bg-green-50 p-3">
              <p className="text-sm text-green-700">Vous avez déjà laissé un avis ({myReview.note}/5).</p>
              {myReview.commentaire && <p className="mt-1 text-sm text-green-700">« {myReview.commentaire} »</p>}
            </div>
          ) : (
            <form onSubmit={submitReview} className="mt-3 space-y-3">
              <FormAlert error={reviewError} />
              <div>
                <label className="label">Note</label>
                <select className="input" value={reviewForm.note} onChange={(e) => setReviewForm({ ...reviewForm, note: e.target.value })}>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n} / 5</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Commentaire</label>
                <textarea className="input" rows={3} value={reviewForm.commentaire} onChange={(e) => setReviewForm({ ...reviewForm, commentaire: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={reviewBusy}>
                {reviewBusy ? "Envoi..." : "Publier l'avis"}
              </button>
              <FieldError error={reviewError} name="note" />
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
