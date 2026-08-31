import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Icons } from "../Icons";
import { fullName, initials } from "../../utils/format";
import { notificationServiceExtended } from "../../services/notificationService";

const formateurNav = [
  { to: "/formateur/formations", icon: Icons.formations, label: "Mes formations" },
  { to: "/formateur/quizzes", icon: Icons.quiz, label: "Quiz" },
];

const etudiantNav = [
  { to: "/etudiant/catalogue", icon: Icons.formations, label: "Catalogue" },
  { to: "/etudiant/parcours", icon: Icons.progress, label: "Mon parcours" },
  { to: "/etudiant/tentatives", icon: Icons.grades, label: "Résultats" },
];

function NotificationBell({ count }) {
  return (
    <NavLink
      to="/notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-base hover:bg-slate-100 hover:text-slate-700"
      aria-label="Notifications"
    >
      <Icons.bell className="h-[18px] w-[18px]" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white shadow-sm">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </NavLink>
  );
}

function UserMenu({ user, onLogout }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-base hover:bg-slate-100"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800 ring-2 ring-brand-200/50">
          {initials(user?.prenom, user?.nom)}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.prenom}</p>
          <p className="text-[11px] text-slate-400">{user?.role}</p>
        </div>
        <Icons.chevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 animate-scale-in rounded-xl border border-slate-200 bg-white py-1.5 shadow-lift">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">{fullName(user)}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <div className="py-1.5">
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Icons.profile className="h-4 w-4 text-slate-400" />
                Mon profil
              </Link>
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Icons.bell className="h-4 w-4 text-slate-400" />
                Notifications
              </Link>
              <Link
                to="/messagerie"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Icons.messages className="h-4 w-4 text-slate-400" />
                Messagerie
              </Link>
            </div>
            <div className="border-t border-slate-100 pt-1.5">
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                  navigate("/login");
                }}
              >
                <Icons.logout className="h-4 w-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MobileNav({ nav, onNavigate }) {
  return (
    <nav className="space-y-1 px-3 pb-4">
      <Link
        to="/dashboard"
        onClick={onNavigate}
        className="sidebar-link text-slate-600 hover:bg-slate-100 hover:text-slate-800"
      >
        <Icons.dashboard className="h-5 w-5" />
        Tableau de bord
      </Link>
      {nav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `sidebar-link ${
              isActive ? "bg-brand-700 text-white shadow-soft" : "text-slate-600 hover:bg-brand-50 hover:text-brand-700"
            }`
          }
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * Header générique des rôles Formateur / Étudiant.
 * L'administrateur dispose de sa PROPRE interface (AdminLayout, routes
 * /admin/*) : ce composant ne contient aucune variante admin.
 */
export default function Header() {
  const { user, logout } = useAuth();
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
  }, [user?.id]);

  useEffect(() => {
    fetchUnread();
    setMobileOpen(false);
  }, [location.pathname]);

  const role = user?.role;
  const navItems = role === "Formateur" ? formateurNav : etudiantNav;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-xl p-2 text-slate-500 transition-base hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Icons.menu className="h-5 w-5" />
            </button>

            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-soft">
                <Icons.logo className="h-5 w-5" />
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="text-sm font-bold tracking-tight text-slate-800">E-Learning</p>
                <p className="text-[11px] text-slate-500">Universitaire Local</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-link !py-2 !px-3 !text-[13px] rounded-lg ${
                      isActive
                        ? "bg-brand-50 text-brand-700 font-semibold"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell count={unreadCount} />
            <span className="hidden h-6 w-px bg-slate-200 sm:block" />
            <UserMenu user={user} onLogout={logout} />
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80vw] bg-white shadow-lift">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <Icons.logo className="h-4 w-4" />
                </div>
                <p className="text-sm font-bold text-slate-800">E-Learning</p>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 transition-base hover:bg-slate-100"
                onClick={() => setMobileOpen(false)}
              >
                <Icons.close className="h-4 w-4" />
              </button>
            </div>
            <MobileNav nav={navItems} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}