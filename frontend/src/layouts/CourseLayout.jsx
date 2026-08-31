import { useEffect, useState, useMemo } from "react";
import { Link, NavLink, Outlet, useLocation, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icons } from "../components/Icons";
import { fullName, initials } from "../utils/format";
import { notificationServiceExtended } from "../services/notificationService";
import { chapterServiceExtended } from "../services/chapterService";
import { sectionServiceExtended } from "../services/sectionService";
import { sousSectionServiceExtended } from "../services/sousSectionService";
import { formationServiceExtended } from "../services/formationService";
import { progressionServiceExtended } from "../services/progressionService";
import { ProgressBar } from "../components/ui/ProgressBar";

export default function CourseLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const chapterId = params.idChapitre || params.id;

  const scrollToAnchor = (anchorId) => {
    setMobileOpen(false);
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (window.__scrollToSousSection) {
      window.__scrollToSousSection(anchorId);
    }
  };

  const [formation, setFormation] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [sectionsByChapter, setSectionsByChapter] = useState({});
  const [sousBySection, setSousBySection] = useState({});
  const [progression, setProgression] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnread = () => {
    notificationServiceExtended
      .countUnread()
      .then((res) => setUnreadCount(Number(res?.data?.total) || 0))
      .catch(() => {});
  };

  useEffect(() => { fetchUnread(); }, []);
  useEffect(() => fetchUnread(), [location.pathname]);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!chapterId) { setLoading(false); return; }

        const chRes = await chapterServiceExtended.show(chapterId);
        if (cancelled) return;
        const chapter = chRes.data;
        const idFormation = chapter.id_formation;
        setFormation({ id_formation: idFormation, titre: chapter.titre });

        formationServiceExtended.show(idFormation).then((r) => {
          if (!cancelled) setFormation(r.data);
        }).catch(() => {});

        progressionServiceExtended.getByUser(user.id).then((r) => {
          if (cancelled) return;
          const p = (r.data || []).find((x) => Number(x.id_formation) === Number(idFormation));
          setProgression(p ? Math.round(Number(p.pourcentage)) : 0);
        }).catch(() => {});

        const chList = await chapterServiceExtended.byFormation(idFormation);
        const allChapters = Array.isArray(chList.data)
          ? chList.data
          : (chList.data?.chapitres || []);
        if (cancelled) return;
        setChapters(allChapters);

        const [secPairs, ssPairs] = await Promise.all([
          Promise.all(
            allChapters.map(async (ch) => {
              const res = await sectionServiceExtended.byChapter(ch.id_chapitre).catch(() => ({ data: [] }));
              return [ch.id_chapitre, res.data || []];
            }),
          ),
          Promise.all(
            allChapters.map(async (ch) => {
              const sRes = await sectionServiceExtended.byChapter(ch.id_chapitre).catch(() => ({ data: [] }));
              const sections = sRes.data || [];
              const ssPairsInner = await Promise.all(
                sections.map(async (s) => {
                  const res = await sousSectionServiceExtended.bySection(s.id_section).catch(() => ({ data: [] }));
                  return [s.id_section, res.data || []];
                }),
              );
              return [ch.id_chapitre, Object.fromEntries(ssPairsInner)];
            }),
          ),
        ]);
        if (cancelled) return;
        setSectionsByChapter(Object.fromEntries(secPairs));
        const flatSs = {};
        for (const [chId, ssMap] of ssPairs) {
          flatSs[chId] = ssMap;
        }
        setSousBySection(flatSs);
      } catch {
        /* silent */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [chapterId, user.id]);

  const sidebar = (
    <nav className="h-full overflow-y-auto bg-white p-3 scrollbar-thin" aria-label="Table des matières du cours">
      <div className="mb-4 px-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Contenu du cours
        </p>
        {progression > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Progression</span>
              <span className="font-bold text-brand-600">{progression}%</span>
            </div>
            <div className="mt-1">
              <ProgressBar value={progression} />
            </div>
          </div>
        )}
      </div>

      {chapters.length === 0 && !loading && (
        <div className="empty-state py-8">
          <div className="empty-icon !h-12 !w-12">
            <Icons.book className="h-6 w-6" />
          </div>
          <p className="mt-2 text-xs text-slate-400">Aucun chapitre disponible</p>
        </div>
      )}

      <ol className="space-y-1">
        {chapters.map((ch, i) => {
          const isOpen = String(ch.id_chapitre) === String(chapterId);
          const sections = sectionsByChapter[ch.id_chapitre] || [];
          return (
            <li key={ch.id_chapitre}>
              <Link
                to={ch.accessible !== false ? `/etudiant/chapitre/${ch.id_chapitre}` : "#"}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                  isOpen
                    ? "bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200/50"
                    : ch.accessible === false
                      ? "text-slate-300 cursor-not-allowed"
                      : ch.valide
                        ? "text-success-600 hover:bg-success-50"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                  ch.valide
                    ? "bg-success-100 text-success-600"
                    : isOpen
                      ? "bg-brand-100 text-brand-700"
                      : ch.accessible === false
                        ? "bg-slate-100 text-slate-300"
                        : "bg-slate-100 text-slate-500"
                }`}>
                  {ch.valide ? <Icons.check className="h-3 w-3" /> : ch.accessible === false ? <Icons.lock className="h-3 w-3" /> : i + 1}
                </span>
                <span className="min-w-0 truncate">{ch.titre}</span>
              </Link>

              {isOpen && sections.length > 0 && (
                <ol className="ml-8 mt-1 space-y-0.5 border-l border-slate-100 pl-3">
                  {sections.map((sec) => {
                    const sss = (sousBySection[ch.id_chapitre] || {})[sec.id_section] || [];
                    return (
                      <li key={sec.id_section}>
                        <p className="mb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                          {sec.titre}
                        </p>
                        {sss.length > 0 && (
                          <ol className="space-y-0.5">
                            {sss.map((ss) => (
                              <li key={ss.id_sous_section}>
                                <button
                                  type="button"
                                  onClick={() => scrollToAnchor(`sous-section-${ss.id_sous_section}`)}
                                  className="block w-full truncate rounded-md px-2 py-1.5 text-left text-[12px] text-slate-500 transition-all duration-150 hover:bg-brand-50 hover:text-brand-700"
                                >
                                  {ss.titre}
                                </button>
                              </li>
                            ))}
                          </ol>
                        )}
                      </li>
                    );
                  })}
                  {ch.a_quiz && isOpen && (
                    <li>
                      <button
                        type="button"
                        onClick={() => scrollToAnchor("chapitre-quiz")}
                        className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] font-semibold text-amber-600 transition-all duration-150 hover:bg-warning-50 hover:text-amber-700"
                      >
                        <Icons.quiz className="h-3.5 w-3.5" />
                        Quiz de fin de chapitre
                      </button>
                    </li>
                  )}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );

  return (
    <div className="min-h-screen bg-canvas-warm">
      {/* Course Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-header">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition-base lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le sommaire"
            >
              <Icons.menu className="h-5 w-5" />
            </button>
            <Link to="/etudiant/parcours" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-base">
              <Icons.arrowLeft className="h-4 w-4" />
              <span className="hidden text-sm font-medium sm:block">Mon parcours</span>
            </Link>
            <span className="hidden h-5 w-px bg-slate-200 sm:block" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800">
                {formation?.titre || "Chargement..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 ring-1 ring-brand-200/50">
                <span className="text-[11px] font-medium text-slate-500">Progression</span>
                <span className="text-xs font-bold text-brand-700">{progression}%</span>
              </div>
            </div>
            <NavLink
              to="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-base hover:bg-slate-100 hover:text-slate-700"
              aria-label="Notifications"
            >
              <Icons.bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </NavLink>
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
      </header>

      <div className="flex">
        {/* Sidebar desktop */}
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white shadow-sidebar lg:block" style={{ height: "calc(100vh - 4rem)" }}>
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
                <p className="text-sm font-bold text-slate-800">Sommaire</p>
                <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-base" onClick={() => setMobileOpen(false)}>
                  <Icons.close className="h-4 w-4" />
                </button>
              </div>
              <div className="h-[calc(100%-3.5rem)]">{sidebar}</div>
            </div>
          </div>
        )}

        {/* Content area */}
        <main className="min-h-[calc(100vh-4rem)] flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
