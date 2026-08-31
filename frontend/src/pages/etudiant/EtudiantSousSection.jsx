import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import Alert from "../../components/ui/Alert";
import { sousSectionServiceExtended } from "../../services/sousSectionService";
import RichTextRenderer from "../../components/content/RichTextRenderer";
import { getErrorMessage } from "../../utils/format";
import { Icons } from "../../components/Icons";

export default function EtudiantSousSection() {
  const { idChapitre, idSs } = useParams();
  const [ss, setSs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await sousSectionServiceExtended.show(idSs);
        if (!cancelled) setSs(res.data);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [idSs]);

  if (loading) return <Spinner />;
  if (error) return <Alert type="error" title={getErrorMessage(error)} />;

  return (
    <div className="space-y-4">
      <Link
        to={`/etudiant/chapitre/${idChapitre}`}
        className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline"
      >
        <Icons.arrowLeft className="h-4 w-4" />
        Retour au chapitre
      </Link>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h1 className="text-lg font-bold text-slate-800">{ss?.titre}</h1>
          {ss?.updated_at && (
            <p className="mt-1 text-[11px] text-slate-400">
              Dernière mise à jour : {new Date(ss.updated_at).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
        <div className="prose-custom px-6 py-6 sm:px-8">
          <RichTextRenderer html={ss?.contenu} />
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Link
          to={`/etudiant/chapitre/${idChapitre}`}
          className="btn-secondary"
        >
          <Icons.arrowLeft className="h-4 w-4" />
          Retour au chapitre
        </Link>
      </div>
    </div>
  );
}
