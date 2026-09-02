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
import { useOwnedFormations } from "../hooks/useOwnedFormations";
import { Icons } from "../components/Icons";

/* ================================================================== */
/* ADMIN DASHBOARD — management-oriented, data-rich                    */
/* ================================================================== */
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

  const stats = [
    { icon: Icons.users, label: "Utilisateurs", value: users.length, color: "bg-blue-50 text-blue-600" },
    { icon: Icons.formations, label: "Formations publiées", value: `${publiees}/${formations.length}`, color: "bg-brand-50 text-brand-600" },
    { icon: Icons.categories, label: "Catégories", value: categories.length, color: "bg-purple-50 text-purple-600" },
    { icon: Icons.reviews, label: "Note moyenne", value: avgNote, color: "bg-amber-50 text-amber-600" },
  ];

  const secondaryStats = [
    { icon: Icons.progress, label: "Inscriptions", value: enrollments.length, color: "bg-emerald-50 text-emerald-600" },
    { icon: Icons.shield, label: "Administrateurs", value: countByRole("Administrateur"), color: "bg-red-50 text-red-600" },
    { icon: Icons.profile, label: "Formateurs", value: countByRole("Formateur"), color: "bg-indigo-50 text-indigo-600" },
    { icon: Icons.profile, label: "Étudiants", value: countByRole("Etudiant"), color: "bg-cyan-50 text-cyan-600" },
  ];

  const shortcuts = [
    ["/admin/users", Icons.users, "Utilisateurs"],
    ["/admin/formations", Icons.formations, "Formations"],
    ["/admin/categories", Icons.categories, "Catégories"],
    ["/admin/reviews", Icons.reviews, "Avis"],
    ["/admin/progressions", Icons.progress, "Progressions"],
    ["/admin/notifications", Icons.notifications, "Notifications"],
    ["/admin/conversations", Icons.messages, "Conversations"],
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Tableau de bord</h1>
        <p className="page-subtitle">Vue d'ensemble de la plateforme</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card group">
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">{s.label}</p>
                <p className="stat-value mt-1">{s.value}</p>
              </div>
              <div className={`stat-icon ${s.color} transition-base group-hover:scale-110`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {secondaryStats.map((s) => (
          <div key={s.label} className="stat-card group">
            <div className="flex items-start justify-between">
              <div>
                <p className="stat-label">{s.label}</p>
                <p className="stat-value mt-1">{s.value}</p>
              </div>
              <div className={`stat-icon ${s.color} transition-base group-hover:scale-110`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-bold text-slate-800">Accès rapides</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {shortcuts.map(([to, Icon, label]) => (
              <Link key={to} to={to} className="card-interactive flex items-center gap-3 !rounded-xl p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-base group-hover:bg-brand-100">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-bold text-slate-800">Derniers avis</h3>
          {reviews.length === 0 ? (
            <div className="empty-state py-6">
              <p className="text-xs text-slate-400">Aucun avis pour le moment</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {reviews.slice(0, 4).map((r) => (
                <li key={r.id_avis} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 transition-base hover:bg-slate-100">
                  <span className="truncate text-xs font-medium text-slate-600">{r.utilisateur || r.email || `User #${r.id_utilisateur}`}</span>
                  <div className="flex items-center gap-1">
                    <Icons.star className="h-3 w-3 text-amber-400" />
                    <span className="text-xs font-bold text-amber-600">{Number(r.note)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ================================================================== */
/* FORMATEUR DASHBOARD — creation-oriented, progress-focused           */
/* ================================================================== */
function FormateurDashboard() {
  const { formations, loading: loadingF } = useOwnedFormations();
  const [quizCount, setQuizCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (loadingF) return;
    let cancelled = false;
    (async () => {
      try {
        const qRes = await quizService.index();
        if (!cancelled) setQuizCount((qRes.data || []).length);
      } catch {
        if (!cancelled) setQuizCount(0);
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadingF]);

  if (loadingF) return <Spinner />;

  const publiees = formations.filter((f) => f.statut === "PUBLIEE").length;
  const brouillons = formations.length - publiees;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl gradient-brand p-6 text-white sm:p-8">
        <h1 className="text-2xl font-bold">Espace formateur</h1>
        <p className="mt-1 text-sm text-white/80">Gérez vos formations et suivez les progrès de vos étudiants</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/formateur/formations" className="btn !bg-white !text-brand-700 hover:!bg-white/90">
            <Icons.plus className="h-4 w-4" />
            Mes formations
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Mes formations</p>
              <p className="stat-value mt-1">{formations.length}</p>
            </div>
            <div className="stat-icon bg-brand-50 text-brand-600 transition-base group-hover:scale-110">
              <Icons.formations className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Publiées</p>
              <p className="stat-value mt-1">{publiees}</p>
            </div>
            <div className="stat-icon bg-success-50 text-success-600 transition-base group-hover:scale-110">
              <Icons.eye className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Brouillons</p>
              <p className="stat-value mt-1">{brouillons}</p>
            </div>
            <div className="stat-icon bg-warning-50 text-warning-600 transition-base group-hover:scale-110">
              <Icons.edit className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Quiz créés</p>
              <p className="stat-value mt-1">{loadingStats ? "…" : quizCount}</p>
            </div>
            <div className="stat-icon bg-purple-50 text-purple-600 transition-base group-hover:scale-110">
              <Icons.quiz className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Mes formations</h3>
            <Link to="/formateur/formations" className="text-xs font-medium text-brand-600 hover:underline">Voir tout →</Link>
          </div>
          {formations.length === 0 ? (
            <EmptyState
              title="Aucune formation"
              message="Créez votre première formation pour commencer."
              action={<Link to="/formateur/formations" className="btn-primary">Mes formations</Link>}
            />
          ) : (
            <ul className="space-y-2">
              {formations.slice(0, 5).map((f) => (
                <li key={f.id_formation}>
                  <Link
                    to={`/formateur/formations/${f.id_formation}`}
                    className="card-interactive flex items-center justify-between !rounded-xl p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{f.titre}</p>
                      {f.description && (
                        <p className="mt-0.5 truncate text-xs text-slate-400">{f.description}</p>
                      )}
                    </div>
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
          <h3 className="mb-4 text-sm font-bold text-slate-800">Raccourcis</h3>
          <div className="space-y-2">
            {[
              ["/formateur/formations", Icons.formations, "Mes formations & publications"],
              ["/formateur/quizzes", Icons.quiz, "Quiz des chapitres"],
              ["/messagerie", Icons.messages, "Messagerie"],
            ].map(([to, Icon, label]) => (
              <Link key={to} to={to} className="card-interactive flex items-center gap-3 !rounded-xl p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ================================================================== */
/* ÉTUDIANT DASHBOARD — learning-centric, progression prominent        */
/* ================================================================== */
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

  const progressionFor = (idFormation) => {
    const p = progressions.find((x) => Number(x.id_formation) === Number(idFormation));
    return p ? Math.round(Number(p.pourcentage)) : 0;
  };

  const avgProgression = enrollments.length > 0
    ? Math.round(enrollments.reduce((s, e) => s + progressionFor(e.id_formation), 0) / enrollments.length)
    : 0;

  const quizzesReussis = attempts.filter((a) => a.statut === "REUSSIE").length;
  const quizzesEnCours = attempts.filter((a) => a.statut === "EN_COURS").length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl gradient-hero p-6 text-white sm:p-8">
        <h1 className="text-2xl font-bold">
          Bonjour, {user?.prenom} 
        </h1>
        <p className="mt-1 text-sm text-white/80">
          {enrollments.length === 0
            ? "Commencez votre parcours d'apprentissage !"
            : `Vous êtes inscrit${enrollments.length > 1 ? "e" : ""} à ${enrollments.length} formation${enrollments.length > 1 ? "s" : ""}`}
        </p>
        {enrollments.length > 0 && (
          <div className="mt-4 flex items-center gap-4">
            <div className="text-3xl font-bold">{avgProgression}%</div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] text-white/70">
                <span>Progression moyenne</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${avgProgression}%` }}
                />
              </div>
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/etudiant/catalogue" className="btn !bg-white !text-brand-700 hover:!bg-white/90">
            <Icons.formations className="h-4 w-4" />
            Explorer le catalogue
          </Link>
          {enrollments.length > 0 && (
            <Link to="/etudiant/parcours" className="btn !bg-white/20 !text-white hover:!bg-white/30">
              <Icons.progress className="h-4 w-4" />
              Mon parcours
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Mes formations</p>
              <p className="stat-value mt-1">{enrollments.length}</p>
            </div>
            <div className="stat-icon bg-brand-50 text-brand-600 transition-base group-hover:scale-110">
              <Icons.formations className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Progression moy.</p>
              <p className="stat-value mt-1">{avgProgression}%</p>
            </div>
            <div className="stat-icon bg-emerald-50 text-emerald-600 transition-base group-hover:scale-110">
              <Icons.progress className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Quiz réussis</p>
              <p className="stat-value mt-1">{quizzesReussis}</p>
            </div>
            <div className="stat-icon bg-success-50 text-success-600 transition-base group-hover:scale-110">
              <Icons.checkCircle className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="stat-card group">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">En attente</p>
              <p className="stat-value mt-1">{quizzesEnCours}</p>
            </div>
            <div className="stat-icon bg-warning-50 text-warning-600 transition-base group-hover:scale-110">
              <Icons.clock className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Continue learning */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Continuer l'apprentissage</h3>
          <Link to="/etudiant/parcours" className="text-xs font-medium text-brand-600 hover:underline">Mon parcours →</Link>
        </div>
        {enrollments.length === 0 ? (
          <EmptyState
            title="Aucune inscription"
            message="Explorez le catalogue et inscrivez-vous gratuitement."
            action={<Link to="/etudiant/catalogue" className="btn-primary">Voir le catalogue</Link>}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {enrollments.slice(0, 4).map((e) => {
              const pct = progressionFor(e.id_formation);
              return (
                <li key={e.id_inscription}>
                  <Link
                    to={`/etudiant/formation/${e.id_formation}`}
                    className="card-interactive block !rounded-xl p-4"
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
                      <p className="mt-2 text-[11px] text-slate-400">
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

      {/* Shortcuts + Attempts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-bold text-slate-800">Raccourcis</h3>
          <div className="space-y-2">
            {[
              ["/etudiant/catalogue", Icons.formations, "Catalogue"],
              ["/etudiant/parcours", Icons.progress, "Mon parcours"],
              ["/etudiant/tentatives", Icons.grades, "Mes résultats"],
              ["/messagerie", Icons.messages, "Messagerie"],
            ].map(([to, Icon, label]) => (
              <Link key={to} to={to} className="card-interactive flex items-center gap-3 !rounded-xl p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </Link>
            ))}
          </div>
        </Card>

        {attempts.length > 0 && (
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-bold text-slate-800">Dernières tentatives</h3>
            <ul className="space-y-2">
              {attempts.slice(0, 5).map((a) => (
                <li key={a.id_tentative} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 transition-base hover:bg-slate-100">
                  <span className="truncate text-xs font-medium text-slate-600">{a.quiz || `Quiz #${a.id_quiz}`}</span>
                  <div className="flex items-center gap-2">
                    {a.note !== null && <span className="text-xs tabular-nums text-slate-500">{Math.round(Number(a.note))}/100</span>}
                    <Badge tone={a.statut === "REUSSIE" ? "success" : a.statut === "ECHOUEE" ? "danger" : "warning"}>
                      {a.statut === "REUSSIE" ? "Réussi" : a.statut === "ECHOUEE" ? "Échoué" : "En attente"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* ROUTER                                                              */
/* ================================================================== */
export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return <Spinner />;
  if (user.role === "Administrateur") return <AdminDashboard />;
  if (user.role === "Formateur") return <FormateurDashboard />;
  return <EtudiantDashboard />;
}
