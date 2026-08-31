import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import { sectionServiceExtended } from "../../services/sectionService";
import { sousSectionServiceExtended } from "../../services/sousSectionService";
import { chapterServiceExtended } from "../../services/chapterService";
import { quizService } from "../../services/quizService";
import RichTextRenderer from "../../components/content/RichTextRenderer";
import ChapterQuiz from "../../components/quiz/ChapterQuiz";
import { formatDateTime, getErrorMessage } from "../../utils/format";
import { Icons } from "../../components/Icons";

function SousSectionContent({ ss, sIdx, ssIdx }) {
  return (
    <div id={`sous-section-${ss.id_sous_section}`} className="scroll-mt-24">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
          {sIdx + 1}.{ssIdx + 1}
        </span>
        <h3 className="text-base font-bold text-slate-800">{ss.titre}</h3>
      </div>
      <div className="prose-custom">
        <RichTextRenderer html={ss.contenu} emptyLabel="Ce contenu est en cours de rédaction par le formateur." />
      </div>
      {ss.updated_at && (
        <p className="mt-2 text-[11px] text-slate-400">Mis à jour le {formatDateTime(ss.updated_at)}</p>
      )}
    </div>
  );
}

export default function EtudiantChapitre() {
  const { id } = useParams();
  const [chapter, setChapter] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [sections, setSections] = useState([]);
  const [sousBySection, setSousBySection] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completion, setCompletion] = useState(null);

  const refreshChapter = useCallback(async () => {
    try {
      const chRes = await chapterServiceExtended.show(id);
      setChapter(chRes.data);
    } catch {
      /* le garde-fou backend reste maître */
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const chRes = await chapterServiceExtended.show(id);
        if (!cancelled) setChapter(chRes.data);

        const qRes = await quizService.getBy("chapter", id).catch(() => ({ data: [] }));
        if (!cancelled) setQuiz((qRes.data || [])[0] || null);

        const sRes = await sectionServiceExtended.byChapter(id);
        const list = sRes.data || [];
        if (cancelled) return;
        setSections(list);

        // Fetch each sous-section FULL record (includes contenu)
        const ssPairs = await Promise.all(
          list.map(async (s) => {
            const all = await sousSectionServiceExtended.bySection(s.id_section).catch(() => ({ data: [] }));
            const details = await Promise.all(
              (all.data || []).map(async (ss) => {
                const d = await sousSectionServiceExtended.show(ss.id_sous_section).catch(() => ({ data: ss }));
                return d.data || ss;
              }),
            );
            return [s.id_section, details];
          }),
        );
        if (!cancelled) setSousBySection(Object.fromEntries(ssPairs));
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <div className="p-8"><Spinner /></div>;

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/etudiant/parcours" className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline">
          <Icons.arrowLeft className="h-4 w-4" /> Mon parcours
        </Link>
        <Alert type="error" title={getErrorMessage(error)}>
          {error.status === 403
            ? "Ce chapitre est verrouillé. Validez d'abord le quiz du chapitre précédent."
            : null}
        </Alert>
      </div>
    );
  }

  const hasQuiz = Boolean(quiz);
  const allSousSections = Object.values(sousBySection).flat();
  const totalSousSections = allSousSections.length;

  const complete = async () => {
    setCompletion({ busy: true, done: false, pct: null, error: null });
    try {
      const res = await chapterServiceExtended.complete(id);
      setCompletion({
        busy: false, done: true,
        pct: Math.round(Number(res.data?.pourcentage ?? 0)),
        error: null,
      });
    } catch (err) {
      setCompletion({ busy: false, done: false, pct: null, error: err });
    }
  };

  return (
    <div className="space-y-8">
      {/* CHAPITRE HEADER */}
      <div>
        <Link to="/etudiant/parcours" className="mb-3 flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline">
          <Icons.arrowLeft className="h-4 w-4" /> Mon parcours
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{chapter?.titre}</h1>
            {chapter?.description && <p className="mt-1 text-sm text-slate-500">{chapter.description}</p>}
          </div>
          {chapter?.valide && <Badge tone="success">Terminé</Badge>}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Icons.folder className="h-3 w-3" />
            {sections.length} section{sections.length !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <Icons.file className="h-3 w-3" />
            {totalSousSections} sous-section{totalSousSections !== 1 ? "s" : ""}
          </span>
          {hasQuiz && (
            <span className="flex items-center gap-1">
              <Icons.quiz className="h-3 w-3" />
              Quiz de fin de chapitre
            </span>
          )}
        </div>
      </div>

      {/* SECTIONS STACKED VERTICALLY */}
      {sections.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Icons.book className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm text-slate-500">Aucun contenu dans ce chapitre pour le moment.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {sections.map((section, sIdx) => {
            const sousSections = sousBySection[section.id_section] || [];
            return (
              <section key={section.id_section} id={`section-${section.id_section}`} className="scroll-mt-24">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700">
                    {sIdx + 1}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{section.titre}</h2>
                    {section.description && <p className="text-xs text-slate-500">{section.description}</p>}
                  </div>
                </div>

                {section.contenu && (
                  <div className="prose-custom mb-5">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
                      <RichTextRenderer html={section.contenu} emptyLabel="Ce contenu est en cours de rédaction par le formateur." />
                    </div>
                  </div>
                )}

                {sousSections.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-6 text-center text-sm text-slate-400">
                    Cette section est en cours de rédaction.
                  </div>
                ) : (
                  <div className="space-y-8">
                    {sousSections.map((ss, ssIdx) => (
                      <div
                        key={ss.id_sous_section}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6"
                      >
                        <SousSectionContent ss={ss} sIdx={sIdx} ssIdx={ssIdx} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* QUIZ INTÉGRÉ EN FIN DE CHAPITRE */}
      {hasQuiz ? (
        <ChapterQuiz
          id={quiz.id_quiz}
          onResult={(res) => {
            if (res?.statut === "REUSSIE") refreshChapter();
          }}
        />
      ) : (
        <div id="chapitre-quiz" className="scroll-mt-24">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                  <Icons.check className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Fin du chapitre</h2>
                  <p className="text-xs text-slate-500">Ce chapitre ne comporte pas de quiz. Marquez-le comme terminé.</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {completion?.done ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-100 text-success-600">
                      <Icons.checkCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-success-700">Chapitre terminé !</p>
                      <p className="text-xs text-success-600">Progression : {completion.pct}%</p>
                    </div>
                  </div>
                  <Link to="/etudiant/parcours" className="btn-primary">Continuer le parcours</Link>
                </div>
              ) : (
                <>
                  {completion?.error && (
                    <Alert type="error" className="mb-3" title={getErrorMessage(completion.error)} />
                  )}
                  <button type="button" className="btn-primary w-full" disabled={completion?.busy} onClick={complete}>
                    {completion?.busy ? "Enregistrement..." : "Marquer le chapitre comme terminé"}
                  </button>
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* CHAPITRE SUIVANT / FORMATION TERMINÉE — uniquement si le chapitre est validé (état backend) */}
      {(Boolean(chapter?.valide) || Boolean(completion?.done)) && (
        <div id="chapter-next" className="scroll-mt-24">
          {chapter?.suivant ? (
            <Card className="overflow-hidden border-emerald-100">
              <div className="flex flex-col items-center justify-between gap-4 bg-gradient-to-r from-brand-600 to-emerald-600 p-6 text-white sm:flex-row sm:p-8">
                <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                    <Icons.arrowRight className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                      Chapitre suivant
                    </p>
                    <h2 className="text-lg font-bold">{chapter.suivant.titre}</h2>
                  </div>
                </div>
                <Link
                  to={`/etudiant/chapitre/${chapter.suivant.id_chapitre}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-700 shadow-sm transition-base hover:bg-brand-50"
                >
                  Chapitre suivant <Icons.arrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="overflow-hidden border-success-200">
              <div className="flex flex-col items-center justify-between gap-4 bg-gradient-to-r from-success-500 to-emerald-600 p-6 text-white sm:flex-row sm:p-8">
                <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                    <Icons.checkCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                      Félicitations
                    </p>
                    <h2 className="text-lg font-bold">Formation terminée</h2>
                  </div>
                </div>
                <Link
                  to="/etudiant/parcours"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-success-700 shadow-sm transition-base hover:bg-emerald-50"
                >
                  Revenir au parcours <Icons.arrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}