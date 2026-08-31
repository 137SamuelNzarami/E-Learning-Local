import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { formationServiceExtended } from "../../services/formationService";
import { enrollmentServiceExtended } from "../../services/enrollmentService";
import { categoryService } from "../../services/categoryService";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import { Icons } from "../../components/Icons";
import { formatDate, getErrorMessage } from "../../utils/format";

export default function EtudiantCatalogue() {
  const { user } = useAuth();
  const [formations, setFormations] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    Promise.all([
      formationServiceExtended.index(),
      enrollmentServiceExtended.getByUser(user.id),
      categoryService.index(),
    ])
      .then(([f, e, c]) => {
        const published = (f.data || []).filter((x) => x.statut === "PUBLIEE");
        setFormations(published);
        setEnrolledIds(new Set((e.data || []).map((x) => x.id_formation)));
        setCategories(c.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const handleEnroll = async (id) => {
    setEnrolling(id);
    try {
      await enrollmentServiceExtended.store({ id_formation: id, id_utilisateur: user.id });
      setEnrolledIds((prev) => new Set([...prev, id]));
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setEnrolling(null);
    }
  };

  const filtered = formations.filter((f) => {
    const matchSearch = !search || f.titre.toLowerCase().includes(search.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = !categoryFilter || String(f.id_categorie) === categoryFilter;
    return matchSearch && matchCategory;
  });

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl gradient-brand p-6 text-white sm:p-8">
        <h1 className="text-2xl font-bold">Catalogue de formations</h1>
        <p className="mt-1 text-sm text-white/80">
          Explorez nos formations et commencez votre parcours d'apprentissage
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="relative flex-1 sm:max-w-md">
            <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <input
              type="text"
              placeholder="Rechercher une formation..."
              className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/50 backdrop-blur-sm focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white backdrop-blur-sm focus:border-white/40 focus:ring-2 focus:ring-white/20"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="" className="text-slate-800">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id_categorie} value={c.id_categorie} className="text-slate-800">{c.nom_categorie ?? c.nom}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{filtered.length}</span> formation{filtered.length !== 1 ? "s" : ""} disponible{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Aucune formation trouvée"
          message={search || categoryFilter ? "Essayez de modifier vos filtres." : "Aucune formation n'est publiée pour le moment."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => {
            const isEnrolled = enrolledIds.has(f.id_formation);
            return (
              <div key={f.id_formation} className="card-hover group overflow-hidden">
                {/* Gradient header */}
                <div className="gradient-brand p-4 pb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                      <Icons.formations className="h-5 w-5" />
                    </div>
                    {f.categorie && (
                      <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium text-white">
                        {f.categorie}
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative -mt-3 rounded-t-xl bg-white p-5">
                  <h3 className="text-base font-bold text-slate-800 group-hover:text-brand-700 transition-base">
                    {f.titre}
                  </h3>
                  {f.description && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {f.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-4 text-[11px] text-slate-400">
                    {f.date_creation && (
                      <span className="flex items-center gap-1">
                        <Icons.calendar className="h-3 w-3" />
                        {formatDate(f.date_creation)}
                      </span>
                    )}
                    {f.formateur && (
                      <span className="flex items-center gap-1">
                        <Icons.profile className="h-3 w-3" />
                        {f.formateur}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 border-t border-slate-100 pt-3">
                    {isEnrolled ? (
                      <Link
                        to={`/etudiant/formation/${f.id_formation}`}
                        className="btn-primary w-full"
                      >
                        <Icons.eye className="h-4 w-4" />
                        Voir la formation
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleEnroll(f.id_formation)}
                        disabled={enrolling === f.id_formation}
                        className="btn-primary w-full"
                      >
                        {enrolling === f.id_formation ? (
                          "Inscription..."
                        ) : (
                          <>
                            <Icons.check className="h-4 w-4" />
                            S'inscrire
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
