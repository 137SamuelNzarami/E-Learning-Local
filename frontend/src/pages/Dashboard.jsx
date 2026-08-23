import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/ui/StatCard";
import Card from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import { ProgressBar } from "../components/ui/ProgressBar";
import { formatDate, getErrorMessage } from "../utils/format";
import { userService } from "../services/userService";
import { formationServiceExtended } from "../services/formationService";
import { categoryService } from "../services/categoryService";
import { reviewService } from "../services/reviewService";
import { enrollmentService, enrollmentServiceExtended } from "../services/enrollmentService";
import { progressionService, progressionServiceExtended } from "../services/progressionService";
import { attemptServiceExtended } from "../services/attemptService";
import { quizService } from "../services/quizService";
import { chapterServiceExtended } from "../services/chapterService";
import { useOwnedFormations } from "../hooks/useOwnedFormations";
import { Icons } from "../components/Icons";

/* ------------------------------------------------------------------ */
/* ADMIN                                                               */
/* ------------------------------------------------------------------ */
function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [formations, setFormations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      userService.index(),
      formationServiceExtended.index(),
      categoryService.index(),
      reviewService.index(),
      enrollmentService.index(),
    ])
      .then(([u, f, c, r, e]) => {
        setUsers(u.data || []);
        setFormations(f.data || []);
        setCategories(c.data || []);
        setReviews(r.data || []);
        setEnrollments(e.data || []);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error" title={getErrorMessage(error)} />;

  const countByRole = (role) => users.filter((u) => u.role === role).length;
  const publiees = formations.filter((f) => f.statut === "PUBLIEE").length;
  const avgNote = reviews.length
    ? (reviews.reduce((s, r) => s + Number(r.note), 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Icons.users} label="Utilisateurs" value={users.length} />
        <StatCard icon={Icons.formations} label="Formations publiées" value={`${publiees}/${formations.length}`} />
        <StatCard icon={Icons.categories} label="Catégories" value={categories.length} />
        <StatCard icon={Icons.reviews} label="Note moyenne" value={avgNote} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={Icons.progress} label="Inscriptions" value={enrollments.length} />
        <StatCard
          icon={Icons.shield}
          label="Administrateurs"
          value={countByRole("Administrateur")}
        />
        <StatCard icon={Icons.profile} label="Étudiants" value={countByRole("Etudiant")} />
      </div>
      <Card className="p-5">
        <h3 className="mb-3 text-base font-semibold text-slate-900">Gestion</h3>
        <div className="flex flex-wrap gap-2">
          {[
            ["/admin/users", "Utilisateurs"],
            ["/admin/categories", "Catégories"],
            ["/admin/formations", "Formations"],
            ["/admin/reviews", "Avis"],
            ["/admin/notifications", "Notifications"],
            ["/admin/conversations", "Conversations"],
            ["/admin/progressions", "Progressions"],
          ].map(([to, label]) => (
            <Link key={to} to={to} className="btn-secondary !py-2 !text-sm">
              {label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FORMATEUR                                                           */
/* ------------------------------------------------------------------ */
function FormateurDashboard() {
  const { formations, loading: loadingF } = useOwnedFormations();
  const [stats, setStats] = useState({ quizzes: 0, aCorriger: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (loadingF) return;
    let cancelled = false;
    (async () => {
      try {
        const qRes = await quizService.index();
        let aCorriger = 0;
        await Promise.all(
          (qRes.data || []).slice(0, 20).map(async (q) => {
            try {
              const res = await attemptServiceExtended.listByQuiz(q.id_quiz);
              aCorriger += (res.data || []).filter((a) => a.statut === "A_CORRIGER").length;
            } catch {
              /* quiz sans tentative */
            }
          }),
        );
        if (!cancelled) setStats({ quizzes: (qRes.data || []).length, aCorriger });
      } catch {
        if (!cancelled) setStats({ quizzes: 0, aCorriger: 0 });
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadingF]);

  if (loadingF) return <Spinner />;

  const publiees = formations.filter((f) => f.statut === "PUBLIEE").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Icons.formations} label="Mes formations" value={formations.length} />
        <StatCard icon={Icons.eye} label="Publiées" value={publiees} />
        <StatCard icon={Icons.quiz} label="Quiz créés" value={loadingStats ? "…" : stats.quizzes} />
        <StatCard icon={Icons.grades} label="À corriger" value={loadingStats ? "…" : stats.aCorriger} />
      </div>

      {!loadingStats && stats.aCorriger > 0 && (
        <Alert type="warning" title={`${stats.aCorriger} tentative(s) attendent votre correction.`}>
          <Link to="/formateur/corrections" className="font-semibold underline">
            Corriger maintenant
          </Link>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Mes formations</h3>
          {formations.length === 0 ? (
            <EmptyState
              title="Aucune formation"
              message="Créez votre première formation pour commencer."
              action={
                <Link to="/formateur/formations" className="btn-primary">
                  Mes formations
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2">
              {formations.slice(0, 6).map((f) => (
                <li key={f.id_formation}>
                  <Link
                    to={`/formateur/formations/${f.id_formation}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 transition hover:border-brand-300 hover:bg-brand-50/40"
                  >
                    <span className="min-w-0 truncate text-sm font-medium text-slate-800">{f.titre}</span>
                    <Badge color={f.statut === "PUBLIEE" ? "green" : "amber"}>
                      {f.statut === "PUBLIEE" ? "Publiée" : "Brouillon"}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Raccourcis</h3>
          <div className="flex flex-col gap-2">
            <Link to="/formateur/formations" className="btn-secondary !py-2 !text-sm">
              Gérer mes formations & publications
            </Link>
            <Link to="/formateur/quizzes" className="btn-secondary !py-2 !text-sm">
              Quiz des chapitres
            </Link>
            <Link to="/formateur/corrections" className="btn-secondary !py-2 !text-sm">
              Corrections en attente
            </Link>
            <Link to="/messagerie" className="btn-secondary !py-2 !text-sm">
              Messagerie
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ÉTUDIANT                                                            */
/* ------------------------------------------------------------------ */
function EtudiantDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [progressions, setProgressions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      enrollmentServiceExtended.getByUser(user.id),
      progressionService.me(),
      attemptServiceExtended.getByUser(user.id),
    ])
      .then(([e, p, a]) => {
        setEnrollments(e.data || []);
        setProgressions(p.data || []);
        setAttempts(a.data || []);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error" title={getErrorMessage(error)} />;

  const progressionPour = (idFormation) => {
    const p = progressions.find((x) => Number(x.id_formation) === Number(idFormation));
    return p ? Math.round(Number(p.pourcentage)) : 0; // valeur BACKEND, pas de recalcul
  };

  const moyenneGlobale =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((s, e) => s + progressionPour(e.id_formation), 0) / enrollments.length,
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Icons.formations} label="Mes formations" value={enrollments.length} />
        <StatCard icon={Icons.progress} label="Progression moyenne" value={`${moyenneGlobale}%`} />
        <StatCard icon={Icons.quiz} label="Tentatives" value={attempts.length} />
        <StatCard
          icon={Icons.checkCircle}
          label="Quizzes réussis"
          value={attempts.filter((a) => a.statut === "REUSSIE").length}
        />
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Continuer l'apprentissage</h3>
          <Link to="/etudiant/parcours" className="text-sm font-medium text-brand-600 hover:underline">
            Mon parcours →
          </Link>
        </div>
        {enrollments.length === 0 ? (
          <EmptyState
            title="Vous n'êtes inscrit à aucune formation"
            message="Explorez le catalogue et inscrivez-vous gratuitement."
            action={
              <Link to="/etudiant/catalogue" className="btn-primary">
                Voir le catalogue
              </Link>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {enrollments.slice(0, 6).map((e) => {
              const pct = progressionPour(e.id_formation);
              return (
                <li key={e.id_inscription}>
                  <Link
                    to={`/etudiant/formation/${e.id_formation}`}
                    className="block rounded-xl border border-slate-100 p-4 transition hover:border-brand-300 hover:bg-brand-50/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {e.titre ?? e.formation ?? `Formation #${e.id_formation}`}
                      </p>
                      <span className="shrink-0 text-xs font-bold text-brand-700">{pct}%</span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={pct} />
                    </div>
                    {e.date_inscription && (
                      <p className="mt-1.5 text-[11px] text-slate-400">
                        Inscrit le {formatDate(e.date_inscription)}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return <Spinner />;

  if (user.role === "Administrateur") return <AdminDashboard />;
  if (user.role === "Formateur") return <FormateurDashboard />;
  return <EtudiantDashboard />;
}
