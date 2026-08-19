import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { formationService } from "../services/formationService";

export function useOwnedFormations() {
  const { user } = useAuth();
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await formationService.index();
        const list = res.data || [];

        const owned = [];
        for (const f of list) {
          const detail = await formationService.show(f.id_formation);
          if (Number(detail.data?.id_formateur) === Number(user.id)) {
            owned.push(detail.data);
          }
        }

        if (!cancelled) setFormations(owned);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user.id]);

  return { formations, loading, error, reload: () => window.location.reload() };
}
