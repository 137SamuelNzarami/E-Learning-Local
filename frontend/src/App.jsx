import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import AppLayout from "./components/layout/AppLayout";
import AdminLayout from "./layouts/AdminLayout";
import BuilderLayout from "./layouts/BuilderLayout";
import CourseLayout from "./layouts/CourseLayout";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import NotificationsPage from "./pages/NotificationsPage";
import MessagingPage from "./pages/messagerie/MessagingPage";
import ConversationPage from "./pages/messagerie/ConversationPage";

import AdminUsers from "./pages/admin/AdminUsers";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminFormations from "./pages/admin/AdminFormations";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminConversations from "./pages/admin/AdminConversations";
import AdminProgressions from "./pages/admin/AdminProgressions";

import FormateurFormations from "./pages/formateur/FormateurFormations";
import FormateurQuizzes from "./pages/formateur/FormateurQuizzes";
import FormationBuilder from "./pages/formateur/FormationBuilder";

import EtudiantCatalogue from "./pages/etudiant/EtudiantCatalogue";
import EtudiantParcours from "./pages/etudiant/EtudiantParcours";
import EtudiantFormation from "./pages/etudiant/EtudiantFormation";
import EtudiantChapitre from "./pages/etudiant/EtudiantChapitre";
import EtudiantSousSection from "./pages/etudiant/EtudiantSousSection";
import EtudiantTentatives from "./pages/etudiant/EtudiantTentatives";

const adminRoles = ["Administrateur"];
const formateurRoles = ["Formateur"];
const etudiantRoles = ["Etudiant"];

/**
 * Pages du chrome AppLayout réservées aux rôles non-admin :
 * un administrateur travaille uniquement dans sa propre interface
 * (AdminLayout, routes /admin/*) et ne doit jamais y être redirigé.
 */
function GuardNonAdmin({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (user?.role === "Administrateur") {
    const ADMIN_MAP = {
      "/dashboard": "/admin/dashboard",
      "/profile": "/admin/profile",
      "/notifications": "/admin/notifications",
      "/messagerie": "/admin/conversations",
    };
    const to =
      ADMIN_MAP[pathname] ??
      (pathname.startsWith("/messagerie/conversation/")
        ? "/admin/conversations"
        : "/admin/dashboard");
    return <Navigate to={to} replace />;
  }

  return children;
}

export default function App() {
  const { user } = useAuth();

  const redirectDashboard = user?.role === "Administrateur"
    ? "/admin/dashboard"
    : "/dashboard";

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={redirectDashboard} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={redirectDashboard} replace /> : <Register />} />

      <Route element={<ProtectedRoute />}>
        {/* ============================================================ */}
        {/* ADMIN — AdminLayout dédié (sidebar + header)                  */}
        {/* ============================================================ */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<RoleRoute roles={adminRoles}><Dashboard /></RoleRoute>} />
          <Route path="/admin/users" element={<RoleRoute roles={adminRoles}><AdminUsers /></RoleRoute>} />
          <Route path="/admin/formations" element={<RoleRoute roles={adminRoles}><AdminFormations /></RoleRoute>} />
          <Route path="/admin/categories" element={<RoleRoute roles={adminRoles}><AdminCategories /></RoleRoute>} />
          <Route path="/admin/reviews" element={<RoleRoute roles={adminRoles}><AdminReviews /></RoleRoute>} />
          <Route path="/admin/progressions" element={<RoleRoute roles={adminRoles}><AdminProgressions /></RoleRoute>} />
          <Route path="/admin/notifications" element={<RoleRoute roles={adminRoles}><AdminNotifications /></RoleRoute>} />
          <Route path="/admin/conversations" element={<RoleRoute roles={adminRoles}><AdminConversations /></RoleRoute>} />
          <Route path="/admin/profile" element={<RoleRoute roles={adminRoles}><Profile /></RoleRoute>} />
        </Route>

        {/* ============================================================ */}
        {/* APP LAYOUT — pages générales (formateur + étudiant)           */}
        {/* ============================================================ */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<GuardNonAdmin><Dashboard /></GuardNonAdmin>} />
          <Route path="/profile" element={<GuardNonAdmin><Profile /></GuardNonAdmin>} />
          <Route path="/notifications" element={<GuardNonAdmin><NotificationsPage /></GuardNonAdmin>} />
          <Route path="/messagerie" element={<GuardNonAdmin><MessagingPage /></GuardNonAdmin>} />
          <Route path="/messagerie/conversation/:id" element={<GuardNonAdmin><ConversationPage /></GuardNonAdmin>} />

          {/* Formateur : listes */}
          <Route path="/formateur/formations" element={<RoleRoute roles={formateurRoles}><FormateurFormations /></RoleRoute>} />
          <Route path="/formateur/quizzes" element={<RoleRoute roles={formateurRoles}><FormateurQuizzes /></RoleRoute>} />

          {/* Étudiant : pages de navigation */}
          <Route path="/etudiant/catalogue" element={<RoleRoute roles={etudiantRoles}><EtudiantCatalogue /></RoleRoute>} />
          <Route path="/etudiant/parcours" element={<RoleRoute roles={etudiantRoles}><EtudiantParcours /></RoleRoute>} />
          <Route path="/etudiant/formation/:id" element={<RoleRoute roles={etudiantRoles}><EtudiantFormation /></RoleRoute>} />
          <Route path="/etudiant/tentatives" element={<RoleRoute roles={etudiantRoles}><EtudiantTentatives /></RoleRoute>} />
        </Route>

        {/* ============================================================ */}
        {/* BUILDER — BuilderLayout dédié formateur                        */}
        {/* ============================================================ */}
        <Route element={<BuilderLayout />}>
          <Route path="/formateur/formations/:id" element={<RoleRoute roles={formateurRoles}><FormationBuilder /></RoleRoute>} />
        </Route>

        {/* ============================================================ */}
        {/* COURSE — CourseLayout dédié étudiant                           */}
        {/* ============================================================ */}
        <Route element={<CourseLayout />}>
          <Route path="/etudiant/chapitre/:id" element={<RoleRoute roles={etudiantRoles}><EtudiantChapitre /></RoleRoute>} />
          <Route path="/etudiant/chapitre/:idChapitre/sous-section/:idSs" element={<RoleRoute roles={etudiantRoles}><EtudiantSousSection /></RoleRoute>} />
        </Route>

        <Route path="*" element={<Navigate to={redirectDashboard} replace />} />
      </Route>
    </Routes>
  );
}
