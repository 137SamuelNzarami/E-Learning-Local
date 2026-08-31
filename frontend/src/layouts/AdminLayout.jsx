import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icons } from "../components/Icons";
import { fullName, initials } from "../utils/format";
import { notificationServiceExtended } from "../services/notificationService";

const nav = [
  { to: "/admin/dashboard", icon: Icons.dashboard, label: "Tableau de bord", badge: null },
  { to: "/admin/users", icon: Icons.users, label: "Utilisateurs", badge: null },
  { to: "/admin/formations", icon: Icons.formations, label: "Formations", badge: null },
  { to: "/admin/categories", icon: Icons.categories, label: "Catégories", badge: null },
  { to: "/admin/reviews", icon: Icons.reviews, label: "Avis", badge: null },
  { to: "/admin/progressions", icon: Icons.progress, label: "Progressions", badge: null },
  { to: "/admin/notifications", icon: Icons.notifications, label: "Notifications", badge: null },
  { to: "/admin/conversations", icon: Icons.messages, label: "Conversations", badge: null },
  { to: "/admin/profile", icon: Icons.profile, label: "Profil", badge: null },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
  }, []);

  useEffect(() => {
    fetchUnread();
    setMobileOpen(false);
  }, [location.pathname]);

  const sidebar = (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Brand */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-400 shadow-sm">
            <Icons.shield className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white tracking-tight">Administration</p>
            <p className="text-[11px] text-slate-400">E-Learning Universitaire</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 scrollbar-thin" aria-label="Navigation administration">
        {nav.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to !== "/dashboard" && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`sidebar-link ${
                isActive ? "sidebar-admin-active" : "sidebar-admin-inactive"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-3 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-200 ring-2 ring-slate-600/50">
            {initials(user?.prenom, user?.nom)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{fullName(user)}</p>
            <p className="truncate text-[11px] text-slate-500">{user?.role}</p>
          </div>
        </div>
        <button
          type="button"
          className="sidebar-link sidebar-admin-inactive w-full"
          onClick={() => { logout(); navigate("/login"); }}
        >
          <Icons.logout className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64 lg:flex-col shadow-sidebar">
        {sidebar}
      </div>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80vw] shadow-lift animate-slide-in">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-xl shadow-header">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition-base lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Icons.menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-800">Administration</h1>
              <p className="text-[11px] text-slate-400">Gestion de la plateforme</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
<NavLink
          to="/admin/notifications"
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
            <span className="hidden h-6 w-px bg-slate-200 sm:block" />
            <div
              className="flex items-center gap-2.5 rounded-xl px-2 py-1.5"
              title={fullName(user)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800 ring-2 ring-brand-200/50">
                {initials(user?.prenom, user?.nom)}
              </div>
              <span className="hidden text-sm font-semibold text-slate-700 md:block">
                {user?.prenom}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex min-h-[calc(100vh-4rem)] flex-col p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="flex-1">
            <Outlet />
          </div>
        </main>

        {/* Footer admin spécifique */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                <Icons.shield className="h-3.5 w-3.5" />
              </div>
              <p className="text-xs text-slate-500">
                Administration E-Learning Universitaire · © {new Date().getFullYear()}
              </p>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-xs text-slate-500 transition-base hover:text-brand-600"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
