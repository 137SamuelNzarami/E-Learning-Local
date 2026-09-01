import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import { quizService } from "../../services/quizService";
import { chapterServiceExtended } from "../../services/chapterService";
import { useOwnedFormations } from "../../hooks/useOwnedFormations";
import { getErrorMessage } from "../../utils/format";
import { Icons } from "../../components/Icons";

/**
 * Vue récapitulative du quiz par chapitre.
 *
 * Le lieu principal de construction du quiz est le FormationBuilder
 * (rubrique « Quiz du chapitre » sous chaque chapitre). Cette page se
 * contente d'afficher un récapitulatif : pour chaque formation, chaque
 * chapitre avec son état (quiz configuré ou non), et un lien qui
 * redirige vers le Builder sur le chapitre concerné.
 */
export default function FormateurQuizzes() {
  const { formations } = useOwnedFormations();

  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [quizzesByChapter, setQuizzesByChapter] = useState({});
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!formations) return;
    let cancelled = false;
    (async () => {
      setLoadingRows(true);
      try {
        const lists = await Promise.all(
          formations.map((f) => chapterServiceExtended.byFormation(f.id_formation)),
        );
        if (cancelled) return;
        const rows = [];
        formations.forEach((f, i) => {
          for (const c of lists[i].data || []) {
            rows.push({
              id_formation: f.id_formation,
              formationTitre: f.titre,
              id_chapitre: c.id_chapitre,
              titre: c.titre,
            });
          }
        });
        rows.sort(
          (a, b) =>
            a.formationTitre.localeCompare(b.formationTitre) ||
            a.titre.localeCompare(b.titre),
        );
        setRows(rows);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoadingRows(false);
      }
    })();
    return () => { cancelled = true; };
  }, [formations]);

  useEffect(() => {
    if (loadingRows) return;
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
  }, [loadingRows]);

  if (loadingRows && rows.length === 0) return <div className="p-8"><Spinner /></div>;

  const quizCount = Object.keys(quizzesByChapter).length;
  const grouped = [];
  for (const row of rows) {
    const last = grouped[grouped.length - 1];
    if (last && last.id_formation === row.id_formation) last.chapters.push(row);
    else grouped.push({ id_formation: row.id_formation, formationTitre: row.formationTitre, chapters: [row] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Vue récapitulative du quiz</h1>
        <p className="page-subtitle">
          Configurez vos quiz depuis le builder de formation, chapitre par chapitre.
        </p>
      </div>

      {error && <Alert type="error" title={getErrorMessage(error)} />}

      <div className="flex flex-wrap gap-2 text-sm">
        <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 font-medium text-slate-600">
          <Icons.book className="h-4 w-4" /> {rows.length} chapitre{rows.length > 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2 font-medium text-brand-700">
          <Icons.quiz className="h-4 w-4" /> {quizCount} quiz configuré{quizCount > 1 ? "s" : ""}
        </div>
      </div>

      {!error && rows.length === 0 && (
        <Card>
          <EmptyState
            title="Aucun chapitre"
            message="Créez d'abord une formation avec des chapitres depuis « Mes formations »."
            action={<Link to="/formateur/formations" className="btn-primary">Mes formations</Link>}
          />
        </Card>
      )}

      {rows.length > 0 && (
        <div className="space-y-5">
          {grouped.map((group) => (
            <Card key={group.id_formation} padding={false} className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Icons.formations className="h-4 w-4 text-brand-600" />
                  {group.formationTitre}
                </p>
                <Link
                  to={`/formateur/formations/${group.id_formation}`}
                  className="btn-secondary btn-sm"
                >
                  <Icons.edit className="h-3 w-3" /> Ouvrir le builder
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {group.chapters.map((chapter) => {
                  const quiz = quizzesByChapter[chapter.id_chapitre];
                  return (
                    <div
                      key={chapter.id_chapitre}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50/40 transition-base"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-500">
                          <Icons.book className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{chapter.titre}</p>
                          {quiz ? (
                            <p className="truncate text-[11px] text-slate-400">
                              {quiz.titre} · seuil {Number(quiz.score_reussite)} %
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400">Aucun quiz configuré</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {quiz ? (
                          <Badge tone="success"><Icons.check className="h-3 w-3" /> Quiz configuré</Badge>
                        ) : (
                          <Badge tone="neutral">Aucun quiz</Badge>
                        )}
                        <Link
                          to={`/formateur/formations/${group.id_formation}?chapitre=${chapter.id_chapitre}`}
                          className="btn-secondary btn-sm"
                        >
                          {quiz ? "Modifier" : "Configurer"}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {loadingQuizzes && rows.length > 0 && (
        <div className="flex items-center gap-2 px-1 text-xs text-slate-400">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
          Chargement de l'état des quiz…
        </div>
      )}
    </div>
  );
}