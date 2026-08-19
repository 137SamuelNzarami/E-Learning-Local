import { useEffect, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { progressionServiceExtended } from "../../services/progressionService";
import { fullName } from "../../utils/format";

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

  return (
    <div>
      <PageHeader title="Progressions" subtitle="Suivi de la progression des étudiants dans les formations" />

      {error && <Alert type="error" className="mb-4" title={error.message} />}

      {loading ? (
        <Spinner />
      ) : total === 0 ? (
        <EmptyState title="Aucune progression enregistrée" />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Étudiants suivis</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Formations</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formationGroups.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Formations terminées (100%)</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{done}</p>
            </Card>
          </div>

          {formationGroups.map((g) => (
            <Card key={g.id_formation} className="p-5">
              <h3 className="mb-3 text-base font-semibold text-slate-900">{g.formation}</h3>
              <ul className="divide-y divide-slate-100">
                {g.rows.map((p) => {
                  const pct = Number(p.pourcentage) || 0;
                  return (
                    <li key={p.id_progression} className="py-3">
                      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800">{fullName({ prenom: p.prenom, nom: p.nom })}</p>
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-brand-600">{pct}%</span>
                          <Badge tone={pct >= 100 ? "success" : pct > 0 ? "warning" : "danger"}>
                            {pct >= 100 ? "Terminée" : pct > 0 ? "En cours" : "Non commencée"}
                          </Badge>
                        </span>
                      </div>
                      <ProgressBar value={pct} />
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
