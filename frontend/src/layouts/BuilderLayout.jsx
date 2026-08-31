import { useEffect, useState, useCallback } from "react";
import { Link, NavLink, Outlet, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icons } from "../components/Icons";
import { fullName, initials } from "../utils/format";
import { formationServiceExtended } from "../services/formationService";
import { chapterServiceExtended } from "../services/chapterService";
import { sectionServiceExtended } from "../services/sectionService";
import { sousSectionServiceExtended } from "../services/sousSectionService";

function TreeNode({ item, kind, index, depth = 0, isExpanded, onToggle, onSelect, isActive }) {
  const Icon = kind === "chapter" ? Icons.book : kind === "section" ? Icons.folder : Icons.file;
  const chevronOpen = isExpanded ? <Icons.chevronDown className="h-3 w-3" /> : <Icons.chevronRight className="h-3 w-3" />;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect({ kind, item })}
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[13px] font-medium transition-all duration-150 ${
          isActive
            ? "bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200/50"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {kind === "chapter" && (
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
            isActive ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500"
          }`}>
            {(index || 0) + 1}
          </span>
        )}
        {kind !== "chapter" && <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-brand-500" : "text-slate-400"}`} />}
        <span className="min-w-0 truncate flex-1 text-left">{item.titre}</span>
        {kind === "chapter" && chevronOpen}
      </button>
    </li>
  );
}

export default function BuilderLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [formation, setFormation] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [sectionsByChapter, setSectionsByChapter] = useState({});
  const [sousBySection, setSousBySection] = useState({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [selectTarget, setSelectTarget] = useState(null);
  const [expandedChapters, setExpandedChapters] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const f = await formationServiceExtended.show(id);
      setFormation(f.data);
      const ch = await chapterServiceExtended.byFormation(id);
      setChapters(Array.isArray(ch.data) ? ch.data : []);
    } catch {
      /* handled by child */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const loadSections = useCallback(async (idChapitre) => {
    const res = await sectionServiceExtended.byChapter(idChapitre);
    const list = res.data || [];
    setSectionsByChapter((m) => ({ ...m, [idChapitre]: list }));
    return list;
  }, []);

  const loadSousSections = useCallback(async (idSection) => {
    const res = await sousSectionServiceExtended.bySection(idSection);
    const list = res.data || [];
    setSousBySection((m) => ({ ...m, [idSection]: list }));
    return list;
  }, []);

  const refreshChapters = useCallback(async () => {
    const ch = await chapterServiceExtended.byFormation(id);
    setChapters(Array.isArray(ch.data) ? ch.data : []);
  }, [id]);

  const toggleChapter = useCallback((idChapitre) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(idChapitre)) {
        next.delete(idChapitre);
      } else {
        next.add(idChapitre);
        if (!sectionsByChapter[idChapitre]) {
          loadSections(idChapitre);
        }
      }
      return next;
    });
  }, [sectionsByChapter, loadSections]);

  const handleSelect = useCallback((target) => {
    setSelectTarget(target);
    if (target.kind === "chapter" && !sectionsByChapter[target.item.id_chapitre]) {
      loadSections(target.item.id_chapitre);
    }
    if (target.kind === "section" && !sousBySection[target.item.id_section]) {
      loadSousSections(target.item.id_section);
    }
  }, [sectionsByChapter, sousBySection, loadSections, loadSousSections]);

  const publiee = formation?.statut === "PUBLIEE";

  const sidebar = (
    <nav className="h-full overflow-y-auto bg-white p-3 scrollbar-thin" aria-label="Arbre pédagogique">
      <div className="mb-4 px-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Arbre du cours
        </p>
        {chapters.length > 0 && (
          <p className="mt-1 text-[11px] text-slate-400">
            {chapters.length} chapitre{chapters.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {chapters.length === 0 && !loading && (
        <div className="empty-state py-8">
          <div className="empty-icon !h-12 !w-12">
            <Icons.book className="h-6 w-6" />
          </div>
          <p className="mt-2 text-xs text-slate-400">Aucun chapitre</p>
          <p className="text-[11px] text-slate-300">Commencez par en ajouter un</p>
        </div>
      )}

      <ol className="space-y-0.5">
        {chapters.map((ch, i) => {
          const sections = sectionsByChapter[ch.id_chapitre] || [];
          const isExpanded = expandedChapters.has(ch.id_chapitre);
          const isChapterActive = selectTarget?.kind === "chapter" && selectTarget?.item?.id_chapitre === ch.id_chapitre;
          return (
            <li key={ch.id_chapitre}>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => toggleChapter(ch.id_chapitre)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-base"
                  aria-label={isExpanded ? "Réduire" : "Développer"}
                >
                  {sections.length > 0 ? (
                    isExpanded ? <Icons.chevronDown className="h-3 w-3" /> : <Icons.chevronRight className="h-3 w-3" />
                  ) : (
                    <span className="h-3 w-3" />
                  )}
                </button>
                <div className="flex-1">
                  <TreeNode
                    item={ch}
                    kind="chapter"
                    index={i}
                    depth={0}
                    isExpanded={isExpanded}
                    onToggle={() => toggleChapter(ch.id_chapitre)}
                    onSelect={handleSelect}
                    isActive={isChapterActive}
                  />
                </div>
              </div>

              {isExpanded && sections.length > 0 && (
                <ol className="ml-5 mt-0.5 space-y-0.5 border-l border-slate-100 pl-2">
                  {sections.map((sec) => {
                    const sss = sousBySection[sec.id_section] || [];
                    const isSecActive = selectTarget?.kind === "section" && selectTarget?.item?.id_section === sec.id_section;
                    return (
                      <li key={sec.id_section}>
                        <TreeNode
                          item={sec}
                          kind="section"
                          depth={1}
                          onSelect={handleSelect}
                          isActive={isSecActive}
                        />
                        {sss.length > 0 && (
                          <ol className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-50 pl-2">
                            {sss.map((ss) => {
                              const isSsActive = selectTarget?.kind === "sous" && selectTarget?.item?.id_sous_section === ss.id_sous_section;
                              return (
                                <li key={ss.id_sous_section}>
                                  <TreeNode
                                    item={ss}
                                    kind="sous"
                                    depth={2}
                                    onSelect={handleSelect}
                                    isActive={isSsActive}
                                  />
                                </li>
                              );
                            })}
                          </ol>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Builder Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-header">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition-base lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir l'arbre"
            >
              <Icons.menu className="h-5 w-5" />
            </button>
            <Link to="/formateur/formations" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-base">
              <Icons.arrowLeft className="h-4 w-4" />
              <span className="hidden text-sm font-medium sm:block">Mes formations</span>
            </Link>
            <span className="hidden h-5 w-px bg-slate-200 sm:block" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">
                {formation?.titre || "Chargement..."}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {chapters.length} chapitre{chapters.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`badge ${publiee ? "badge-success" : "badge-warning"}`}>
              {publiee ? "Publiée" : "Brouillon"}
            </span>
            <NavLink
              to="/profile"
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-base hover:bg-slate-100"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-800 ring-2 ring-brand-200/50">
                {initials(user?.prenom, user?.nom)}
              </div>
            </NavLink>
          </div>
        </div>
        {notice && (
          <div className="animate-slide-up border-t border-success-100 bg-success-50 px-4 py-2.5 text-xs font-medium text-success-700">
            {notice}
          </div>
        )}
      </header>

      <div className="flex" style={{ height: "calc(100vh - 4rem)" }}>
        {/* Sidebar desktop */}
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white shadow-sidebar lg:block">
          <div className="sticky top-0 overflow-y-auto scrollbar-thin" style={{ height: "calc(100vh - 4rem)" }}>
            {sidebar}
          </div>
        </aside>

        {/* Sidebar mobile */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] shadow-lift animate-slide-in">
              <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
                <p className="text-sm font-bold text-slate-800">Arbre pédagogique</p>
                <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-base" onClick={() => setMobileOpen(false)}>
                  <Icons.close className="h-4 w-4" />
                </button>
              </div>
              <div className="h-[calc(100%-3.5rem)]">{sidebar}</div>
            </div>
          </div>
        )}

        {/* Canvas — content rendered by FormationBuilder via Outlet */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 animate-fade-in">
            <Outlet context={{
              formation,
              chapters,
              sectionsByChapter,
              sousBySection,
              load,
              loadSections,
              loadSousSections,
              refreshChapters,
              setNotice,
              selectTarget,
              clearSelectTarget: () => setSelectTarget(null),
            }} />
          </div>
        </main>
      </div>
    </div>
  );
}
