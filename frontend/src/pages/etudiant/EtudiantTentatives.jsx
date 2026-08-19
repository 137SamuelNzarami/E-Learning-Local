import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import { attemptServiceExtended } from "../../services/attemptService";
import { studentAnswerServiceExtended } from "../../services/studentAnswerService";
import { Icons } from "../../components/Icons";

export default function EtudiantTentatives() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await attemptServiceExtended.getByUser(user.id);
        const list = res.data || [];
        setAttempts(list);

        const map = {};
        for (const attempt of list) {
          const sa = await studentAnswerServiceExtended.getByAttempt(attempt.id_tentative);
          const records = sa.data || [];
          const correct = records.filter((r) => r.est_correcte === 1 || r.est_correcte === true).length;
          map[attempt.id_tentative] = {
            records,
            computedScore: records.length ? Math.round((correct / records.length) * 100) : 0,
          };
        }
        setDetails(map);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  const displayScore = (attempt) => {
    if (attempt.note !== null && attempt.note !== undefined) return Number(attempt.note);
    return details[attempt.id_tentative]?.computedScore ?? 0;
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Mes tentatives" subtitle="Résultats de vos quiz" />

      {error && <Alert type="error" className="mb-4" title={error.message} />}

      {attempts.length === 0 ? (
        <Card>
          <EmptyState title="Aucune tentative" message="Passez un quiz pour voir vos résultats ici." />
        </Card>
      ) : (
        <div className="space-y-3">
          {attempts.map((a) => {
            const score = displayScore(a);
            const detail = details[a.id_tentative];
            const open = expanded === a.id_tentative;
            return (
              <Card key={a.id_tentative} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icons.quiz />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{a.quiz}</p>
                      <p className="text-xs text-slate-400">Tentative #{a.id_tentative}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={score >= 50 ? "success" : "danger"}>{score}%</Badge>
                    {detail?.records?.length > 0 && (
                      <button type="button" className="btn-secondary !px-3 !py-1.5 !text-xs" onClick={() => setExpanded(open ? null : a.id_tentative)}>
                        {open ? "Réduire" : "Détail"}
                      </button>
                    )}
                  </div>
                </div>

                {open && detail?.records?.length > 0 && (
                  <div className="border-t border-slate-100 p-4">
                    <ul className="space-y-2">
                      {detail.records.map((r) => {
                        const good = r.est_correcte === 1 || r.est_correcte === true;
                        return (
                          <li key={r.id_reponse_etudiant} className={`rounded-lg border-l-4 px-3 py-2 ${good ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
                            <p className="text-sm font-medium text-slate-800">{r.question}</p>
                            <p className={`text-xs ${good ? "text-green-700" : "text-red-700"}`}>
                              Votre réponse : {r.reponse} {good ? "✓" : "✗"}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
