import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import { sectionServiceExtended } from "../../services/sectionService";
import { sousSectionServiceExtended } from "../../services/sousSectionService";
import { chapterServiceExtended } from "../../services/chapterService";
import { quizService } from "../../services/quizService";
import sanitizeHtml from "../../utils/sanitize";
import { getErrorMessage, formatDateTime } from "../../utils/format";
import { Icons } from "../../components/Icons";

/**
 * Chapitre étudiant : sections → sous-sections (rich text nettoyé) → quiz final.
 * Accès contrôlé par le backend (parcours). Le HTML des sous-sections est
 * TOUJOURS nettoyé (DOMPurify) avant rendu.
 */
export default function EtudiantChapitre() {
  const { id } = useParams(); // id_chapitre

  const [chapter, setChapter] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [sections, setSections] = useState([]);
  const [sousBySection, setSousBySection] = useState({});
  const [openSection, setOpenSection] = useState(null);
  const [detailSous, setDetailSous] = useState(null); // sous-section avec contenu
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const chRes = await chapterServiceExtended.show(id);
        if (!cancelled) setChapter(chRes.data);

        // Quiz de fin de chapitre (accès contrôlé par le backend)
        const qRes = await quizService.getBy("chapter", id).catch(() => ({ data: [] }));
        if (!cancelled) setQuiz((qRes.data || [])[0] || null);

        const sRes = await sectionServiceExtended.byChapter(id);
        const list = sRes.data || [];
        if (cancelled) return;
        setSections(list);
        setOpenSection(list[0]?.id_section ?? null);

        const pairs = await Promise.all(
          list.map(async (s) => {
            const res = await sousSectionServiceExtended.bySection(s.id_section);
            return [s.id_section, res.data || []];
          }),
        );
        if (!cancelled) setSousBySection(Object.fromEntries(pairs));
      } catch (err) {
        if (!cancelled) setError(err); // 403 si chapitre verrouillé / non inscrit
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const openSousSection = async (ss) => {
    try {
      const res = await sousSectionServiceExtended.show(ss.id_sous_section);
      setDetailSous(res.data);
    } catch (err) {
      setError(err);
    }
  };

  if (loading) return <Spinner />;
  if (error)
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link to="/etudiant/parcours" className="text-sm font-medium text-brand-600 hover:underline">
          ← Mon parcours
        </Link>
        <Alert type="error" title={getErrorMessage(error)}>
          {error.status === 403
            ? "Ce chapitre est verrouillé. Validez d'abord le quiz du chapitre précédent."
            : null}
        </Alert>
      </div>
    );

  const hasQuiz = Boolean(quiz);

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/etudiant/parcours" className="text-sm font-medium text-brand-600 hover:underline">
        ← Mon parcours
      </Link>
      <PageHeader title={chapter?.titre || "Chapitre"} subtitle={chapter?.description} />

      {notice && <Alert type="success" className="mb-4" title={notice} />}

      {/* NAVIGATION SECTIONS */}
      {sections.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {sections.map((s, i) => (
            <button
              key={s.id_section}
              type="button"
              onClick={() => setOpenSection(s.id_section)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                openSection === s.id_section
                  ? "bg-brand-700 text-white shadow-soft"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {i + 1}. {s.titre}
            </button>
          ))}
        </div>
      )}

      {sections.length === 0 && (
        <Card>
          <p className="py-8 text-center text-sm text-slate-400">Aucun contenu dans ce chapitre pour le moment.</p>
        </Card>
      )}

      {sections
        .filter((s) => s.id_section === openSection)
        .map((section) => {
          const sousSections = sousBySection[section.id_section] || [];
          return (
            <Card key={section.id_section} className="p-6">
              <h2 className="text-lg font-bold text-slate-900">{section.titre}</h2>
              {section.description && <p className="mt-1 text-sm text-slate-500">{section.description}</p>}

              <div className="mt-5 space-y-3">
                {sousSections.length === 0 && (
                  <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                    Aucune sous-section dans cette section.
                  </p>
                )}
                {sousSections.map((ss) => (
                  <button
                    key={ss.id_sous_section}
                    type="button"
                    onClick={() => openSousSection(ss)}
                    className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <Icons.book className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800">{ss.titre}</span>
                        {ss.updated_at && (
                          <span className="block text-[11px] text-slate-400">Mise à jour : {formatDateTime(ss.updated_at)}</span>
                        )}
                      </span>
                    </span>
                    <Icons.arrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-brand-500" />
                  </button>
                ))}
              </div>

              {/* QUIZ DE FIN DE CHAPITRE */}
              {hasQuiz ? (
                <Link
                  to={`/etudiant/quiz/${quiz.id_quiz}`}
                  className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 transition hover:border-amber-300 hover:bg-amber-100/60"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                      <Icons.quiz />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-amber-800">
                        Quiz de fin de chapitre
                      </span>
                      <span className="block text-xs text-amber-700">
                        Réussissez ce quiz pour débloquer le chapitre suivant.
                      </span>
                    </span>
                  </span>
                  <Badge tone="warning">Requis</Badge>
                </Link>
              ) : (
                <CompleteChapter chapterId={id} />
              )}
            </Card>
          );
        })}

      {/* LECTEUR SOUS-SECTION (rich text) */}
      {detailSous && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-6">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="pr-4 text-lg font-bold text-slate-900">{detailSous.titre}</h3>
              <button
                type="button"
                onClick={() => setDetailSous(null)}
                className="btn-ghost !p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Fermer"
              >
                <Icons.close />
              </button>
            </div>
            <div
              className="rte-content text-[15px] text-slate-700"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(detailSous.contenu) }}
            />
            <div className="mt-6 flex justify-end">
              <button type="button" className="btn-secondary" onClick={() => setDetailSous(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Chapitre SANS quiz : validation manuelle via POST /chapters/:id/complete.
 * Le pourcentage retourné vient du backend.
 */
function CompleteChapter({ chapterId }) {
  const [state, setState] = useState({ busy: false, done: false, pct: null, error: null });

  const complete = async () => {
    setState({ busy: true, done: false, pct: null, error: null });
    try {
      const res = await chapterServiceExtended.complete(chapterId);
      setState({
        busy: false,
        done: true,
        pct: Math.round(Number(res.data?.pourcentage ?? 0)),
        error: null,
      });
    } catch (err) {
      setState({ busy: false, done: false, pct: null, error: err });
    }
  };

  if (state.done)
    return (
      <div className="mt-6 rounded-xl bg-green-50 px-4 py-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
          <Icons.checkCircle className="h-5 w-5" /> Chapitre terminé — progression : {state.pct}%
        </p>
        <Link to="/etudiant/parcours" className="btn-primary mt-3 !py-2 !text-sm">
          Continuer le parcours
        </Link>
      </div>
    );

  return (
    <div className="mt-6 rounded-xl bg-slate-50 px-4 py-4">
      <p className="text-sm font-semibold text-slate-700">Terminer ce chapitre</p>
      <p className="mt-0.5 text-xs text-slate-400">
        Marquez ce chapitre comme lu pour faire avancer votre progression et continuer.
      </p>
      {state.error && (
        <Alert type="error" className="mt-2" title={getErrorMessage(state.error)} />
      )}
      <button type="button" className="btn-primary mt-3 !py-2 !text-sm" disabled={state.busy} onClick={complete}>
        {state.busy ? "Enregistrement..." : "Marquer comme terminé"}
      </button>
    </div>
  );
}
