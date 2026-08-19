import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Alert from "../../components/ui/Alert";
import { formationService } from "../../services/formationService";
import { enrollmentServiceExtended } from "../../services/enrollmentService";
import { Icons } from "../../components/Icons";

export default function EtudiantCatalogue() {
  const { user } = useAuth();
  const [formations, setFormations] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [f, e] = await Promise.all([
        formationService.index(),
        enrollmentServiceExtended.getByUser(user.id),
      ]);
      setFormations(f.data || []);
      setEnrolledIds(new Set((e.data || []).map((x) => x.id_formation)));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user.id]);

  const enroll = async (idFormation) => {
    setBusy(idFormation);
    try {
      await enrollmentServiceExtended.store({ id_formation: idFormation });
      setNotice("Inscription réussie ! Vous pouvez maintenant suivre la formation.");
      load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader title="Catalogue des formations" subtitle="Choisissez une formation et inscrivez-vous" />

      {notice && <Alert type="success" className="mb-4" title={notice} />}
      {error && <Alert type="error" className="mb-4" title={error.message} />}

      {loading ? (
        <Spinner />
      ) : formations.length === 0 ? (
        <Card>
          <EmptyState title="Aucune formation disponible" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {formations.map((f) => {
            const enrolled = enrolledIds.has(f.id_formation);
            return (
              <Card key={f.id_formation} className="flex flex-col p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icons.formations />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{f.titre}</h3>
                <p className="mt-1 line-clamp-3 flex-1 text-sm text-slate-500">{f.description || "Aucune description."}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>{f.nom_categorie}</span>
                  <span>Formateur : {f.prenom} {f.nom}</span>
                </div>
                <div className="mt-4">
                  {enrolled ? (
                    <Link to={`/etudiant/formation/${f.id_formation}`} className="btn-primary block w-full !py-2 text-center text-sm">
                      Continuer la formation
                    </Link>
                  ) : (
                    <button type="button" className="btn-primary w-full !py-2 text-sm" disabled={busy === f.id_formation} onClick={() => enroll(f.id_formation)}>
                      {busy === f.id_formation ? "Inscription..." : "S'inscrire"}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
