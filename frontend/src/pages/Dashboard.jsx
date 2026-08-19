import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import StatCard from "../components/ui/StatCard";
import Card from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { RoleBadge } from "../components/ui/Badge";
import { ProgressBar } from "../components/ui/ProgressBar";
import { formatDate, fullName } from "../utils/format";
import { userService } from "../services/userService";
import { formationService } from "../services/formationService";
import { categoryService } from "../services/categoryService";
import { reviewService } from "../services/reviewService";
import { enrollmentService, enrollmentServiceExtended } from "../services/enrollmentService";
import { progressionService, progressionServiceExtended } from "../services/progressionService";
import { attemptService, attemptServiceExtended } from "../services/attemptService";
import { assignmentService } from "../services/assignmentService";
import { submissionService } from "../services/submissionService";
import { quizService } from "../services/quizService";
import { moduleService } from "../services/moduleService";
import { chapterService } from "../services/chapterService";
import { lessonService } from "../services/lessonService";
import { useOwnedFormations } from "../hooks/useOwnedFormations";
import { Icons } from "../components/Icons";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [formations, setFormations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const { data: enrollments } = useApi(() => enrollmentService.index(), []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      userService.index(),
      formationService.index(),
      categoryService.index(),
      reviewService.index(),
    ])
      .then(([u, f, c, r]) => {
        setUsers(u.data || []);
        setFormations(f.data || []);
        setCategories(c.data || []);
        setReviews(r.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const countByRole = (role) => users.filter((u) => u.role === role).length;
  const avgNote = reviews.length
    ? (reviews.reduce((s, r) => s + Number(r.note), 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Utilisateurs" value={users.length} icon={Icons.users} />
        <StatCard label="Formations" value={formations.length} icon={Icons.formations} />
        <StatCard label="Catégories" value={categories.length} icon={Icons.categories} />
        <StatCard label="Note moyenne des avis" value={avgNote} icon={Icons.reviews} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Dernières formations</h2>
            <Link to="/admin/formations" className="text-sm font-medium text-brand-600 hover:underline">
              Tout voir
            </Link>
          </div>
          {formations.length === 0 ? (
            <EmptyState title="Aucune formation" message="Les formations créées apparaîtront ici." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {formations.slice(0, 6).map((f) => (
                <li key={f.id_formation} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-800">{f.titre}</p>
                    <p className="text-xs text-slate-500">{f.nom_categorie} · {f.prenom} {f.nom}</p>
                  </div>
                  <span className="text-xs text-slate-400">#{f.id_formation}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Répartition des rôles</h2>
            <Link to="/admin/users" className="text-sm font-medium text-brand-600 hover:underline">Gérer</Link>
          </div>
          <ul className="space-y-3">
            <li className="flex items-center justify-between">
              <RoleBadge role="Administrateur" />
              <span className="font-semibold text-slate-800">{countByRole("Administrateur")}</span>
            </li>
            <li className="flex items-center justify-between">
              <RoleBadge role="Formateur" />
              <span className="font-semibold text-slate-800">{countByRole("Formateur")}</span>
            </li>
            <li className="flex items-center justify-between">
              <RoleBadge role="Etudiant" />
              <span className="font-semibold text-slate-800">{countByRole("Etudiant")}</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function FormateurDashboard() {
  const { user } = useAuth();
  const { formations, loading } = useOwnedFormations();
  const { data: quizzes } = useApi(() => quizService.index(), []);
  const { data: assignments } = useApi(() => assignmentService.index(), []);
  const { data: lessons } = useApi(() => lessonService.index(), []);
  const { data: modules } = useApi(() => moduleService.index(), []);
  const { data: chapters } = useApi(() => chapterService.index(), []);
  const { data: enrollments } = useApi(() => enrollmentService.index(), []);

  if (loading) return <Spinner />;

  const formationIds = new Set(formations.map((f) => f.id_formation));
  const moduleIds = new Set((modules || []).filter((m) => formationIds.has(m.id_formation)).map((m) => m.id_module));
  const chapterIds = new Set((chapters || []).filter((c) => moduleIds.has(c.id_module)).map((c) => c.id_chapitre));
  const lessonIds = new Set((lessons || []).filter((l) => chapterIds.has(l.id_chapitre)).map((l) => l.id_lecon));
  const students = (enrollments || []).filter((e) => formationIds.has(e.id_formation)).length;
  const myQuizzes = (quizzes || []).filter((q) => formationIds.has(q.id_formation)).length;
  const myAssignments = (assignments || []).filter((a) => lessonIds.has(a.id_lecon)).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Mes formations" value={formations.length} icon={Icons.formations} />
        <StatCard label="Étudiants inscrits" value={students} icon={Icons.users} />
        <StatCard label="Quiz" value={myQuizzes} icon={Icons.quiz} />
        <StatCard label="Devoirs" value={myAssignments} icon={Icons.assignments} />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Mes formations</h2>
          <Link to="/formateur/formations" className="text-sm font-medium text-brand-600 hover:underline">
            Gérer le contenu
          </Link>
        </div>
        {formations.length === 0 ? (
          <EmptyState
            title="Aucune formation"
            message="Votre administrateur doit vous rattacher à une formation."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {formations.map((f) => (
              <li key={f.id_formation} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-800">{f.titre}</p>
                  <p className="text-xs text-slate-500">{f.nom_categorie}</p>
                </div>
                <Link to={`/formateur/formations/${f.id_formation}`} className="btn-secondary !px-3 !py-1.5 !text-xs">
                  Ouvrir
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function EtudiantDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [progressions, setProgressions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      enrollmentServiceExtended.getByUser(user.id),
      progressionServiceExtended.getByUser(user.id),
      attemptServiceExtended.getByUser(user.id),
    ])
      .then(([e, p, a]) => {
        setEnrollments(e.data || []);
        setProgressions(p.data || []);
        setAttempts(a.data || []);
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <Spinner />;

  const avgProgression = progressions.length
    ? Math.round(progressions.reduce((s, p) => s + Number(p.pourcentage || 0), 0) / progressions.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Formations suivies" value={enrollments.length} icon={Icons.formations} />
        <StatCard label="Progression moyenne" value={`${avgProgression}%`} icon={Icons.progress} />
        <StatCard label="Quiz passés" value={attempts.length} icon={Icons.quiz} />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">Mes formations</h2>
          <Link to="/etudiant/catalogue" className="text-sm font-medium text-brand-600 hover:underline">
            Découvrir le catalogue
          </Link>
        </div>
        {enrollments.length === 0 ? (
          <EmptyState
            title="Vous n'êtes inscrit à aucune formation"
            message="Parcourez le catalogue pour rejoindre votre première formation."
            action={
              <Link to="/etudiant/catalogue" className="btn-primary mt-2">
                Voir le catalogue
              </Link>
            }
          />
        ) : (
          <ul className="space-y-4">
            {enrollments.map((en) => {
              const prog = progressions.find((p) => p.id_formation === en.id_formation);
              return (
                <li key={en.id_inscription}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Link
                        to={`/etudiant/formation/${en.id_formation}`}
                        className="font-medium text-slate-800 hover:text-brand-600"
                      >
                        {en.formation}
                      </Link>
                      <p className="text-xs text-slate-500">Inscrit le {formatDate(en.date_inscription)}</p>
                    </div>
                    <Link
                      to={`/etudiant/formation/${en.id_formation}`}
                      className="btn-secondary !px-3 !py-1.5 !text-xs"
                    >
                      Continuer
                    </Link>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <ProgressBar value={prog?.pourcentage} />
                    <span className="w-12 text-right text-sm font-semibold text-slate-700">
                      {prog?.pourcentage ?? 0}%
                    </span>
                  </div>
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Bonjour, {user?.prenom}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Voici un aperçu de votre espace{" "}
          <span className="font-serif italic text-brand-700">{user?.role}.</span>
        </p>
      </div>
      {user?.role === "Administrateur" && <AdminDashboard />}
      {user?.role === "Formateur" && <FormateurDashboard />}
      {user?.role === "Etudiant" && <EtudiantDashboard />}
    </div>
  );
}
