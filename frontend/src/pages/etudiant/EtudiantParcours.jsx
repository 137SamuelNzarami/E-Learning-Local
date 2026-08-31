import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { enrollmentServiceExtended } from "../../services/enrollmentService";
import { progressionService } from "../../services/progressionService";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Icons } from "../../components/Icons";
import { formatDate } from "../../utils/format";

export default function EtudiantParcours() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [progressions, setProgressions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      enrollmentServiceExtended.getByUser(user.id),
      progressionService.me(),
    ])
      .then(([e, p]) => {
        setEnrollments(e.data || []);
        setProgressions(p.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <Spinner />;

  const progressionFor = (idFormation) => {
    const p = progressions.find((x) => Number(x.id_formation) === Number(idFormation));
    return p ? Math.round(Number(p.pourcentage)) : 0;
  };

  const avgProgression = enrollments.length > 0
    ? Math.round(enrollments.reduce((s, e) => s + progressionFor(e.id_formation), 0) / enrollments.length)
    : 0;

  const sorted = [...enrollments].sort((a, b) => {
    const pa = progressionFor(a.id_formation);
    const pb = progressionFor(b.id_formation);
    return pb - pa;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl gradient-brand p-6 text-white sm:p-8">
        <h1 className="text-2xl font-bold">Mon parcours</h1>
        <p className="mt-1 text-sm text-white/80">
          {enrollments.length === 0
            ? "Vous n'avez pas encore de formation en cours"
            : `Suivez vos ${enrollments.length} formation${enrollments.length > 1 ? "s" : ""} en cours`}
        </p>
        {enrollments.length > 0 && (
          <div className="mt-4 flex items-center gap-4">
            <div className="text-3xl font-bold">{avgProgression}%</div>
            <div className="flex-1">
              <div className="h-2 rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${avgProgression}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-white/70">Progression moyenne</p>
            </div>
          </div>
        )}
      </div>

      {/* Enrollments */}
      {enrollments.length === 0 ? (
        <EmptyState
          title="Aucune formation"
          message="Explorez le catalogue et inscrivez-vous à une formation."
          action={<Link to="/etudiant/catalogue" className="btn-primary">Voir le catalogue</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((e) => {
            const pct = progressionFor(e.id_formation);
            const isComplete = pct >= 100;
            return (
              <Link
                key={e.id_inscription}
                to={`/etudiant/formation/${e.id_formation}`}
                className="card-hover group relative overflow-hidden"
              >
                {/* Progress indicator */}
                <div className="gradient-brand p-4 pb-8">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                      {isComplete ? (
                        <Icons.award className="h-5 w-5" />
                      ) : (
                        <Icons.formations className="h-5 w-5" />
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-white">{pct}%</span>
                    </div>
                  </div>
                </div>

                <div className="relative -mt-4 rounded-t-xl bg-white p-5">
                  <h3 className="text-base font-bold text-slate-800 group-hover:text-brand-700 transition-base">
                    {e.titre ?? e.formation ?? `Formation #${e.id_formation}`}
                  </h3>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Progression</span>
                      <span className="font-bold text-brand-600">{pct}%</span>
                    </div>
                    <div className="mt-1">
                      <ProgressBar value={pct} />
                    </div>
                  </div>

                  {e.date_inscription && (
                    <p className="mt-3 text-[11px] text-slate-400">
                      Inscrit le {formatDate(e.date_inscription)}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-brand-600 group-hover:underline">
                      {isComplete ? "Revoir la formation" : "Continuer →"}
                    </span>
                    {isComplete && (
                      <span className="badge-success">Terminé</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
