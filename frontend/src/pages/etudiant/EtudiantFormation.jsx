import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { formationServiceExtended } from "../../services/formationService";
import { chapterServiceExtended } from "../../services/chapterService";
import { enrollmentServiceExtended } from "../../services/enrollmentService";
import { getErrorMessage } from "../../utils/format";
import { Icons } from "../../components/Icons";

/**
 * Fiche formation côté étudiant :
 * - infos + inscription (POST /enrollments) si nécessaire
 * - parcours des chapitres (états calculés par le BACKEND :
 *   accessible / verrouillé / validé + présence de quiz)
 */
export default function EtudiantFormation() {
  const { id } = useParams();
  const { user } = useAuth();

  const [formation, setFormation] = useState(null);
  const [parcours, setParcours] = useState(null);
  const [inscrit, setInscrit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [enrollBusy, setEnrollBusy] = useState(false);
  const [enrollError, setEnrollError] = useState(null);
  const [inscritMsg, setInscritMsg] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const fRes = await formationServiceExtended.show(id);
        if (!cancelled) setFormation(fRes.data);

        const [eRes, pRes] = await Promise.all([
          enrollmentServiceExtended.getByUser(user.id).catch(() => ({ data: [] })),
          chapterServiceExtended.byFormation(id).catch(() => null),
        ]);
        if (cancelled) return;

        const mine = (eRes.data || []).some(
          (e) => Number(e.id_formation) === Number(id),
        );
        setInscrit(mine);
        setParcours(pRes ? pRes.data : null);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user.id]);

  const enroll = async () => {
    setEnrollBusy(true);
    setEnrollError(null);
    try {
      await enrollmentServiceExtended.store({ id_formation: Number(id) });
      setInscrit(true);
      setInscritMsg("Inscription confirmée — bon apprentissage !");
    } catch (err) {
      setEnrollError(err);
    } finally {
      setEnrollBusy(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <Alert type="error" title={getErrorMessage(error)} />;

  const chapitres = parcours?.chapitres || [];
  const pct = Math.round(Number(parcours?.progression_pourcentage ?? 0));
  const premierAccessible = chapitres.find((c) => c.accessible && !c.valide);

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/etudiant/catalogue" className="text-sm font-medium text-brand-600 hover:underline">
        ← Retour au catalogue
      </Link>

      <PageHeader title={formation?.titre} subtitle={formation?.description || undefined} />

      <Card className="mb-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            {inscrit ? (
              <>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-500">Votre progression</span>
                  <span className="font-semibold text-brand-700">{pct}%</span>
                </div>
                <ProgressBar value={pct} />
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-800">Vous n'êtes pas encore inscrit</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  Inscrivez-vous pour accéder au contenu et suivre votre progression.
                </p>
              </>
            )}
          </div>
          {!inscrit && (
            <button type="button" className="btn-primary shrink-0" onClick={enroll} disabled={enrollBusy}>
              {enrollBusy ? "Inscription..." : "S'inscrire gratuitement"}
            </button>
          )}
          {inscrit && premierAccessible && (
            <Link to={`/etudiant/chapitre/${premierAccessible.id_chapitre}`} className="btn-primary shrink-0">
              {pct > 0 ? "Continuer" : "Commencer"} <Icons.arrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        {inscritMsg && <Alert type="success" className="mt-4" title={inscritMsg} />}
        {enrollError && <Alert type="error" className="mt-4" title={getErrorMessage(enrollError)} />}
      </Card>

      <h2 className="mb-3 text-lg font-bold text-slate-900">Programme</h2>
      {chapitres.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          Le programme de cette formation n'est pas encore disponible.
        </Card>
      ) : (
        <ul className="space-y-3">
          {chapitres.map((ch, i) => {
            const state = ch.valide ? "valide" : ch.accessible ? "en_cours" : "verrouille";
            return (
              <li key={ch.id_chapitre}>
                {ch.accessible ? (
                  <Link
                    to={`/etudiant/chapitre/${ch.id_chapitre}`}
                    className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:bg-brand-50/40"
                  >
                    <ChapterIndex index={i} state={state} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate font-semibold text-slate-900">{ch.titre}</p>
                        <StateBadge state={state} />
                      </div>
                      {ch.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{ch.description}</p>
                      )}
                      {ch.a_quiz && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-brand-700">
                          <Icons.quiz className="h-4 w-4" /> Quiz de validation requis
                        </p>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 opacity-75">
                    <ChapterIndex index={i} state={state} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate font-semibold text-slate-500">{ch.titre}</p>
                        <StateBadge state={state} />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Validez les chapitres précédents pour débloquer.
                      </p>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ChapterIndex({ index, state }) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
        state === "valide"
          ? "bg-green-100 text-green-700"
          : state === "en_cours"
            ? "bg-brand-100 text-brand-700"
            : "bg-slate-200 text-slate-400"
      }`}
    >
      {state === "valide" ? <Icons.check className="h-5 w-5" /> : index + 1}
    </span>
  );
}

function StateBadge({ state }) {
  if (state === "valide") return <Badge color="green">Validé</Badge>;
  if (state === "en_cours") return <Badge color="sky">Disponible</Badge>;
  return <Badge color="gray">Verrouillé</Badge>;
}
