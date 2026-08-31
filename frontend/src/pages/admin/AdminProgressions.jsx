import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { progressionServiceExtended } from "../../services/progressionService";
import { fullName } from "../../utils/format";
import { Icons } from "../../components/Icons";

export default function AdminProgressions() {
  const [progressions, setProgressions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    progressionServiceExtended
      .index()
      .then((res) => setProgressions(res.data || []))
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  const byFormation = progressions.reduce((acc, p) => {
    const key = `${p.id_formation}`;
    if (!acc[key]) acc[key] = { id_formation: p.id_formation, formation: p.formation, rows: [] };
    acc[key].rows.push(p);
    return acc;
  }, {});

  const formationGroups = Object.values(byFormation).sort((a, b) =>
    String(a.formation).localeCompare(String(b.formation))
  );

  const total = progressions.length;
  const done = progressions.filter((p) => Number(p.pourcentage) >= 100).length;
  const avgProgression = total > 0
    ? Math.round(progressions.reduce((s, p) => s + (Number(p.pourcentage) || 0), 0) / total)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Progressions</h1>
        <p className="page-subtitle">Suivi de la progression des étudiants dans les formations</p>
      </div>

      {error && <Alert type="error" title={error.message} />}

      {loading ? (
        <Spinner />
      ) : total === 0 ? (
        <EmptyState title="Aucune progression enregistrée" message="Les progressions des étudiants apparaîtront ici." />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="stat-card group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-label">Étudiants suivis</p>
                  <p className="stat-value mt-1">{total}</p>
                </div>
                <div className="stat-icon bg-brand-50 text-brand-600 transition-base group-hover:scale-110">
                  <Icons.users className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div className="stat-card group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-label">Formations</p>
                  <p className="stat-value mt-1">{formationGroups.length}</p>
                </div>
                <div className="stat-icon bg-purple-50 text-purple-600 transition-base group-hover:scale-110">
                  <Icons.formations className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div className="stat-card group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-label">Terminées (100%)</p>
                  <p className="stat-value mt-1">{done}</p>
                </div>
                <div className="stat-icon bg-success-50 text-success-600 transition-base group-hover:scale-110">
                  <Icons.checkCircle className="h-5 w-5" />
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
          </div>

          {/* Formation groups */}
          <div className="space-y-4">
            {formationGroups.map((g) => (
              <Card key={g.id_formation} className="overflow-hidden p-0">
                <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3 sm:px-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">{g.formation}</h3>
                    <Badge neutral>{g.rows.length} étudiant{g.rows.length > 1 ? "s" : ""}</Badge>
                  </div>
                </div>
                <ul className="divide-y divide-slate-100">
                  {g.rows.map((p) => {
                    const pct = Number(p.pourcentage) || 0;
                    return (
                      <li key={p.id_progression} className="px-5 py-3 sm:px-6 transition-base hover:bg-slate-50/50">
                        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">{fullName({ prenom: p.prenom, nom: p.nom })}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold tabular-nums text-brand-600">{pct}%</span>
                            <Badge tone={pct >= 100 ? "success" : pct > 0 ? "warning" : "danger"}>
                              {pct >= 100 ? "Terminée" : pct > 0 ? "En cours" : "Non commencée"}
                            </Badge>
                          </div>
                        </div>
                        <ProgressBar value={pct} />
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
