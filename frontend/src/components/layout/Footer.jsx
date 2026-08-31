import { Link } from "react-router-dom";
import { Icons } from "../Icons";
import { useAuth } from "../../context/AuthContext";

const formateurFooterLinks = [
  { to: "/dashboard", label: "Tableau de bord" },
  { to: "/formateur/formations", label: "Mes formations" },
  { to: "/formateur/quizzes", label: "Quiz" },
];

const etudiantFooterLinks = [
  { to: "/dashboard", label: "Tableau de bord" },
  { to: "/etudiant/catalogue", label: "Catalogue" },
  { to: "/etudiant/parcours", label: "Mon parcours" },
  { to: "/etudiant/tentatives", label: "Mes résultats" },
];

/**
 * Footer générique des rôles Formateur / Étudiant.
 * L'administrateur dispose de sa PROPRE interface (AdminLayout, routes
 * /admin/*) : ce composant ne contient aucune variante admin.
 */
export default function Footer() {
  const { user } = useAuth();
  const year = new Date().getFullYear();
  const role = user?.role;
  const navLinks = role === "Formateur" ? formateurFooterLinks : etudiantFooterLinks;

  return (
    <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-soft">
                <Icons.logo className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight text-slate-800">E-Learning</p>
                <p className="font-serif text-[11px] italic text-slate-500">Universitaire Local</p>
              </div>
            </Link>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-500">
              Plateforme d'apprentissage universitaire. Construisez votre parcours, partagez vos connaissances, progressez à votre rythme.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Navigation</h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate-600 hover:text-brand-600 transition-base">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Ressources</h4>
            <ul className="space-y-2">
              <li><Link to="/profile" className="text-sm text-slate-600 hover:text-brand-600 transition-base">Mon profil</Link></li>
              <li><Link to="/notifications" className="text-sm text-slate-600 hover:text-brand-600 transition-base">Notifications</Link></li>
              {role === "Etudiant" && (
                <li><Link to="/messagerie" className="text-sm text-slate-600 hover:text-brand-600 transition-base">Messagerie</Link></li>
              )}
              <li><span className="text-sm text-slate-400">Aide (bientôt)</span></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Contact</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <Icons.mail className="h-3.5 w-3.5 text-slate-400" />
                support@eulocal.edu
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <Icons.home className="h-3.5 w-3.5 text-slate-400" />
                Université Local
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row">
          <p className="text-[11px] text-slate-400">
            © {year} E-Learning Universitaire. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-400">Fait avec passion pour l'éducation</span>
          </div>
        </div>
      </div>
    </footer>
  );
}