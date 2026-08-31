import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { formationServiceExtended } from "../../services/formationService";
import { chapterServiceExtended } from "../../services/chapterService";
import { sectionServiceExtended } from "../../services/sectionService";
import { sousSectionServiceExtended } from "../../services/sousSectionService";
import { enrollmentServiceExtended } from "../../services/enrollmentService";
import { progressionService } from "../../services/progressionService";
import Spinner from "../../components/ui/Spinner";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Icons } from "../../components/Icons";
import { formatDate, getErrorMessage } from "../../utils/format";

export default function EtudiantFormation() {
  const { user } = useAuth();
  const { id } = useParams();
  const [formation, setFormation] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [sectionsByChapter, setSectionsByChapter] = useState({});
  const [sousBySection, setSousBySection] = useState({});
  const [enrolled, setEnrolled] = useState(false);
  const [progression, setProgression] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [fRes, chRes, eRes, pRes] = await Promise.all([
          formationServiceExtended.show(id),
          chapterServiceExtended.byFormation(id),
          enrollmentServiceExtended.getByUser(user.id),
          progressionService.me(),
        ]);
        if (cancelled) return;
        setFormation(fRes.data);
        const allCh = Array.isArray(chRes.data) ? chRes.data : (chRes.data?.chapitres || []);
        setChapters(allCh);
        setEnrolled((eRes.data || []).some((e) => Number(e.id_formation) === Number(id)));
        const p = (pRes.data || []).find((x) => Number(x.id_formation) === Number(id));
        setProgression(p ? Math.round(Number(p.pourcentage)) : 0);

        // Load sections + sous-sections for programme tree
        if (enrolled || allCh.length > 0) {
          const secPairs = await Promise.all(
            allCh.map(async (ch) => {
              const res = await sectionServiceExtended.byChapter(ch.id_chapitre).catch(() => ({ data: [] }));
              return [ch.id_chapitre, res.data || []];
            }),
          );
          if (cancelled) return;
          setSectionsByChapter(Object.fromEntries(secPairs));

          const allSections = secPairs.flatMap(([, secs]) => secs);
          const ssPairs = await Promise.all(
            allSections.map(async (s) => {
              const res = await sousSectionServiceExtended.bySection(s.id_section).catch(() => ({ data: [] }));
              return [s.id_section, res.data || []];
            }),
          );
          if (cancelled) return;
          setSousBySection(Object.fromEntries(ssPairs));
        }
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, user.id]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await enrollmentServiceExtended.store({ id_formation: Number(id), id_utilisateur: user.id });
      setEnrolled(true);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setEnrolling(false);
    }
  };

  const firstAccessibleChapter = chapters.find((ch) => ch.accessible !== false);

  if (loading) return <div className="p-8"><Spinner /></div>;
  if (!formation) return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">Formation introuvable.</div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-2xl gradient-hero p-6 text-white sm:p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {formation.categorie && <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">{formation.categorie}</span>}
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">{chapters.length} chapitre{chapters.length !== 1 ? "s" : ""}</span>
            </div>
            <h1 className="text-2xl font-bold">{formation.titre}</h1>
            {formation.description && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">{formation.description}</p>
            )}
            {formation.formateur && (
              <p className="mt-3 text-xs text-white/60">Par {formation.formateur}</p>
            )}
          </div>
          <div className="hidden text-right sm:block">
            {enrolled && (
              <div>
                <span className="text-3xl font-bold">{progression}%</span>
                <p className="text-[11px] text-white/70">Progression</p>
              </div>
            )}
          </div>
        </div>
        {enrolled && (
          <div className="mt-4">
            <div className="h-2 rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${progression}%` }} />
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          {enrolled ? (
            firstAccessibleChapter && (
              <Link to={`/etudiant/chapitre/${firstAccessibleChapter.id_chapitre}`} className="btn !bg-white !text-brand-700 hover:!bg-white/90">
                <Icons.arrowRight className="h-4 w-4" />
                {progression > 0 ? "Continuer le parcours" : "Commencer"}
              </Link>
            )
          ) : (
            <button type="button" onClick={handleEnroll} disabled={enrolling} className="btn !bg-white !text-brand-700 hover:!bg-white/90">
              {enrolling ? "Inscription..." : (<><Icons.check className="h-4 w-4" /> S'inscrire gratuitement</>)}
            </button>
          )}
        </div>
      </div>

      {enrolled && (
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Progression</h3>
            <span className="text-xs font-bold text-brand-600">{progression}%</span>
          </div>
          <div className="mt-2"><ProgressBar value={progression} /></div>
        </Card>
      )}

      <div>
        <h2 className="mb-4 text-lg font-bold text-slate-800">Programme de la formation</h2>
        {chapters.length === 0 ? (
          <Card className="p-8 text-center">
            <Icons.book className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">Aucun chapitre disponible pour le moment</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {chapters.map((ch, i) => {
              const secs = sectionsByChapter[ch.id_chapitre] || [];
              const isAccessible = ch.accessible !== false;
              const isLocked = !isAccessible;

              return (
                <Card key={ch.id_chapitre} padding={false} className="overflow-hidden">
                  <Link
                    to={enrolled && isAccessible ? `/etudiant/chapitre/${ch.id_chapitre}` : "#"}
                    className={`flex items-center gap-4 p-4 transition-base ${
                      enrolled && isAccessible ? "hover:bg-slate-50/50" : "pointer-events-none opacity-60"
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                      ch.valide
                        ? "bg-success-100 text-success-600"
                        : isLocked
                          ? "bg-slate-100 text-slate-400"
                          : "bg-brand-50 text-brand-700"
                    }`}>
                      {ch.valide ? <Icons.check className="h-5 w-5" /> : isLocked ? <Icons.lock className="h-4 w-4" /> : i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{ch.titre}</p>
                        {ch.valide && <Badge tone="success">Terminé</Badge>}
                        {isLocked && <Badge tone="neutral">Verrouillé</Badge>}
                        {ch.a_quiz && <Badge tone="warning">Quiz</Badge>}
                      </div>
                      {ch.description && <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{ch.description}</p>}
                    </div>
                    {enrolled && isAccessible && <Icons.chevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
                  </Link>

                  {secs.length > 0 && (
                    <div className="border-t border-slate-100 bg-slate-50/30 px-5 py-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Sections</p>
                      <div className="space-y-1.5">
                        {secs.map((sec) => {
                          const sss = sousBySection[sec.id_section] || [];
                          return (
                            <div key={sec.id_section} className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100">
                              <p className="text-xs font-semibold text-slate-700">{sec.titre}</p>
                              {sss.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {sss.map((ss) => (
                                    <span key={ss.id_sous_section} className="text-[10px] text-slate-400">
                                      {ss.titre}{sss.indexOf(ss) < sss.length - 1 ? " · " : ""}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
