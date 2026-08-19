import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import FieldError, { FormAlert } from "../../components/ui/FieldError";
import { moduleService } from "../../services/moduleService";
import { chapterService } from "../../services/chapterService";
import { lessonService } from "../../services/lessonService";
import { assignmentService } from "../../services/assignmentService";
import { enrollmentServiceExtended } from "../../services/enrollmentService";
import { submissionServiceExtended } from "../../services/submissionService";
import { fileUrl } from "../../utils/format";
import { Icons } from "../../components/Icons";

export default function EtudiantDevoirs() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [modules, setModules] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [enrolledFormationIds, setEnrolledFormationIds] = useState(new Set());
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const [fichier, setFichier] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [e, m, c, l, a, s] = await Promise.all([
          enrollmentServiceExtended.getByUser(user.id),
          moduleService.index(),
          chapterService.index(),
          lessonService.index(),
          assignmentService.index(),
          submissionServiceExtended.getByUser(user.id),
        ]);
        setEnrolledFormationIds(new Set((e.data || []).map((x) => x.id_formation)));
        setAssignments(a.data || []);
        setModules(m.data || []);
        setChapters(c.data || []);
        setLessons(l.data || []);
        setSubmissions(s.data || []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  const ownedAssignmentIds = useMemo(() => {
    const moduleIds = new Set(modules.filter((m) => enrolledFormationIds.has(m.id_formation)).map((m) => m.id_module));
    const chapterIds = new Set(chapters.filter((c) => moduleIds.has(c.id_module)).map((c) => c.id_chapitre));
    const lessonIds = new Set(lessons.filter((l) => chapterIds.has(l.id_chapitre)).map((l) => l.id_lecon));
    return new Set(assignments.filter((a) => lessonIds.has(a.id_lecon)).map((a) => a.id_devoir));
  }, [assignments, enrolledFormationIds, modules, chapters, lessons]);

  const ownedAssignments = assignments.filter((a) => ownedAssignmentIds.has(a.id_devoir));

  const submissionFor = (idDevoir) => submissions.find((s) => Number(s.id_devoir) === Number(idDevoir));

  const submit = async (e, assignment) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await submissionServiceExtended.store({
        id_devoir: assignment.id_devoir,
        id_utilisateur: user.id,
        fichier: fichier,
      });
      setNotice("Devoir soumis avec succès !");
      setFichier(null);
      const s = await submissionServiceExtended.getByUser(user.id);
      setSubmissions(s.data || []);
    } catch (err) {
      setFormError(err);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Mes devoirs" subtitle="Rendez vos travaux aux formateurs" />

      {notice && <Alert type="success" className="mb-4" title={notice} />}
      {error && <Alert type="error" className="mb-4" title={error.message} />}

      {ownedAssignments.length === 0 ? (
        <Card>
          <EmptyState title="Aucun devoir" message="Les devoirs des formations auxquelles vous êtes inscrit apparaîtront ici." />
        </Card>
      ) : (
        <div className="space-y-3">
          {ownedAssignments.map((a) => {
            const sub = submissionFor(a.id_devoir);
            return (
              <Card key={a.id_devoir} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icons.assignments />
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-900">{a.titre}</h3>
                      <p className="text-xs text-slate-400">{a.lecon}</p>
                    </div>
                  </div>
                {(a.instructions || a.fichier_consignes) && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    {a.instructions && (
                      <p className="whitespace-pre-line text-sm text-slate-600">{a.instructions}</p>
                    )}
                    {a.fichier_consignes && (
                      <a href={fileUrl(a.fichier_consignes)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline">
                        Consignes (fichier joint)
                      </a>
                    )}
                  </div>
                )}

                {sub ? (
                    <Badge tone={sub.note !== null && sub.note !== undefined ? "success" : "neutral"}>
                      {sub.note !== null && sub.note !== undefined ? `Noté : ${sub.note}/100` : "En attente de correction"}
                    </Badge>
                  ) : (
                    <Badge tone="warning">À rendre</Badge>
                  )}
                </div>

                {sub ? (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-600">
                      {sub.fichier ? (
                        <>
                          Fichier rendu :{" "}
                          <a href={fileUrl(sub.fichier)} target="_blank" rel="noreferrer" className="font-medium text-brand-600 hover:underline">
                            {sub.fichier}
                          </a>
                        </>
                      ) : (
                        "Rendu envoyé."
                      )}
                    </p>
                    {sub.note !== null && sub.note !== undefined && (
                      <p className="mt-1 text-sm font-semibold text-slate-800">Note : {sub.note}/100</p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={(e) => submit(e, a)} className="mt-4">
                    <FormAlert error={formError} />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        className="input flex-1"
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md"
                        onChange={(e) => setFichier(e.target.files?.[0] || null)}
                      />
                      <button type="submit" className="btn-primary shrink-0" disabled={busy || !fichier}>
                        {busy ? "Envoi..." : "Rendre le devoir"}
                      </button>
                    </div>
                    <FieldError error={formError} name="fichier" />
                  </form>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
