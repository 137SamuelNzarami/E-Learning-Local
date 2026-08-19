import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Icons } from "../Icons";
import { fullName, initials } from "../../utils/format";
import { notificationServiceExtended } from "../../services/notificationService";

function SidebarLink({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? "bg-brand-700 text-white shadow-soft"
            : "text-brand-100/70 hover:bg-white/[0.06] hover:text-white"
        }`
      }
    >
      {Icon && <Icon />}
      {label}
    </NavLink>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-soft">
        <Icons.logo className="h-5 w-5" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-[15px] font-bold tracking-tight text-white">E-Learning</p>
        <p className="truncate font-serif text-[12px] italic text-brand-200">Universitaire Locale</p>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  const fetchUnread = () => {
    notificationServiceExtended
      .countUnread()
      .then((res) => setUnreadCount(Number(res?.data?.total) || 0))
      .catch(() => {});
  };

  useEffect(() => {
    fetchUnread();
    const timer = setInterval(fetchUnread, 15000);
    return () => clearInterval(timer);
  }, [user?.id]);

  useEffect(() => {
    fetchUnread();
  }, [location.pathname]);

  const nav = [
    { to: "/dashboard", icon: Icons.dashboard, label: "Tableau de bord" },
    ...(user?.role === "Administrateur"
      ? [
          { to: "/admin/users", icon: Icons.users, label: "Utilisateurs" },
          { to: "/admin/categories", icon: Icons.categories, label: "Catégories" },
          { to: "/admin/formations", icon: Icons.formations, label: "Formations" },
          { to: "/admin/reviews", icon: Icons.reviews, label: "Avis" },
          { to: "/admin/notifications", icon: Icons.notifications, label: "Notifications" },
          { to: "/admin/conversations", icon: Icons.messages, label: "Conversations" },
          { to: "/admin/progressions", icon: Icons.progress, label: "Progressions" },
        ]
      : []),
    ...(user?.role === "Formateur"
      ? [
          { to: "/formateur/formations", icon: Icons.formations, label: "Mes formations" },
          { to: "/formateur/contenu", icon: Icons.lessons, label: "Contenus pédagogiques" },
          { to: "/formateur/quizzes", icon: Icons.quiz, label: "Quiz" },
          { to: "/formateur/devoirs", icon: Icons.assignments, label: "Devoirs & notes" },
          { to: "/messagerie", icon: Icons.messages, label: "Messagerie" },
        ]
      : []),
    ...(user?.role === "Etudiant"
      ? [
          { to: "/etudiant/catalogue", icon: Icons.formations, label: "Catalogue" },
          { to: "/etudiant/parcours", icon: Icons.progress, label: "Mon parcours" },
          { to: "/etudiant/devoirs", icon: Icons.assignments, label: "Mes devoirs" },
          { to: "/etudiant/tentatives", icon: Icons.grades, label: "Mes résultats" },
          { to: "/messagerie", icon: Icons.messages, label: "Messagerie" },
        ]
      : []),
    { to: "/profile", icon: Icons.profile, label: "Mon profil" },
  ];

  const sidebar = (
    <div className="flex h-full flex-col bg-brand-950">
      <div className="px-4 pt-5 pb-4"><Brand /></div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {nav.map((item) => (
          <SidebarLink key={item.to} {...item} onClick={() => setMobileOpen(false)} />
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-3 px-2 py-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
            {initials(user?.prenom, user?.nom)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{fullName(user)}</p>
            <p className="truncate text-xs text-brand-200/70">{user?.role}</p>
          </div>
        </div>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-100/70 transition hover:bg-white/[0.06] hover:text-white"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <Icons.logout />
          Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64 lg:flex-col">
        {sidebar}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="btn-ghost !p-2 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Icons.menu />
          </button>
          <div className="hidden sm:block">
            <p className="text-sm text-slate-500">
              Bienvenue, <span className="font-semibold text-slate-800">{user?.prenom}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NavLink
              to="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Icons.bell />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </NavLink>
            <span className="hidden h-6 w-px bg-slate-200 sm:block" />
            <NavLink
              to="/profile"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-100"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                {initials(user?.prenom, user?.nom)}
              </div>
              <span className="hidden text-sm font-medium text-slate-700 md:block">
                {fullName(user)}
              </span>
            </NavLink>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
