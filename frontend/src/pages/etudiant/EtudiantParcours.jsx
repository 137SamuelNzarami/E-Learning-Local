import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import { ProgressBar } from "../../components/ui/ProgressBar";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import { enrollmentServiceExtended } from "../../services/enrollmentService";
import { progressionServiceExtended } from "../../services/progressionService";
import { formatDate } from "../../utils/format";
import { Icons } from "../../components/Icons";

export default function EtudiantParcours() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [progressions, setProgressions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      enrollmentServiceExtended.getByUser(user.id),
      progressionServiceExtended.getByUser(user.id),
    ])
      .then(([e, p]) => {
        setEnrollments(e.data || []);
        setProgressions(p.data || []);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [user.id]);

  const progressionFor = (idFormation) => {
    const row = progressions.find((p) => Number(p.id_formation) === Number(idFormation));
    return row ? Number(row.pourcentage) : 0;
  };

  return (
    <div>
      <PageHeader title="Mon parcours" subtitle="Vos formations en cours" />

      {error && <Alert type="error" className="mb-4" title={error.message} />}

      {loading ? (
        <Spinner />
      ) : enrollments.length === 0 ? (
        <Card>
          <EmptyState
            title="Aucune inscription"
            message="Parcourez le catalogue pour vous inscrire à une formation."
            action={<Link to="/etudiant/catalogue" className="btn-primary">Voir le catalogue</Link>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {enrollments.map((e) => {
            const pct = progressionFor(e.id_formation);
            return (
              <Link key={e.id_inscription} to={`/etudiant/formation/${e.id_formation}`}>
                <Card className="h-full p-5 transition hover:border-brand-300 hover:shadow-lift">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icons.formations />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{e.formation}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{e.description || ""}</p>
                  <p className="mt-2 text-xs text-slate-400">Inscrit le {formatDate(e.date_inscription)}</p>
                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500">Progression</span>
                      <span className="font-semibold text-brand-600">{pct}%</span>
                    </div>
                    <ProgressBar value={pct} />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
