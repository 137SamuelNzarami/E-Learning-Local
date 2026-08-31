import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { formationService } from "../services/formationService";

export function useOwnedFormations() {
  const { user } = useAuth();
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await formationService.index();
      const list = res.data || [];
      setFormations(list.filter((f) => Number(f.id_formateur) === Number(user.id)));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user.id]);

  return { formations, loading, error, reload: load };
}
