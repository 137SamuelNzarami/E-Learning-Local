import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import AppLayout from "./components/layout/AppLayout";
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
import FormateurContenu from "./pages/formateur/FormateurContenu";
import FormateurQuizzes from "./pages/formateur/FormateurQuizzes";
import FormateurDevoirs from "./pages/formateur/FormateurDevoirs";
import FormationBuilder from "./pages/formateur/FormationBuilder";

import EtudiantCatalogue from "./pages/etudiant/EtudiantCatalogue";
import EtudiantParcours from "./pages/etudiant/EtudiantParcours";
import EtudiantFormation from "./pages/etudiant/EtudiantFormation";
import EtudiantLecon from "./pages/etudiant/EtudiantLecon";
import EtudiantQuiz from "./pages/etudiant/EtudiantQuiz";
import EtudiantDevoirs from "./pages/etudiant/EtudiantDevoirs";
import EtudiantTentatives from "./pages/etudiant/EtudiantTentatives";

const adminRoles = ["Administrateur"];

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/messagerie" element={<MessagingPage />} />
          <Route path="/messagerie/conversation/:id" element={<ConversationPage />} />

          <Route
            path="/admin/users"
            element={<RoleRoute roles={adminRoles}><AdminUsers /></RoleRoute>}
          />
          <Route
            path="/admin/categories"
            element={<RoleRoute roles={adminRoles}><AdminCategories /></RoleRoute>}
          />
          <Route
            path="/admin/formations"
            element={<RoleRoute roles={adminRoles}><AdminFormations /></RoleRoute>}
          />
          <Route
            path="/admin/reviews"
            element={<RoleRoute roles={adminRoles}><AdminReviews /></RoleRoute>}
          />
          <Route
            path="/admin/notifications"
            element={<RoleRoute roles={adminRoles}><AdminNotifications /></RoleRoute>}
          />
          <Route
            path="/admin/conversations"
            element={<RoleRoute roles={adminRoles}><AdminConversations /></RoleRoute>}
          />
          <Route
            path="/admin/progressions"
            element={<RoleRoute roles={adminRoles}><AdminProgressions /></RoleRoute>}
          />

          <Route
            path="/formateur/formations"
            element={<RoleRoute roles={["Formateur", "Administrateur"]}><FormateurFormations /></RoleRoute>}
          />
          <Route
            path="/formateur/formations/:id"
            element={<RoleRoute roles={["Formateur", "Administrateur"]}><FormationBuilder /></RoleRoute>}
          />
          <Route
            path="/formateur/contenu"
            element={<RoleRoute roles={["Formateur", "Administrateur"]}><FormateurContenu /></RoleRoute>}
          />
          <Route
            path="/formateur/quizzes"
            element={<RoleRoute roles={["Formateur", "Administrateur"]}><FormateurQuizzes /></RoleRoute>}
          />
          <Route
            path="/formateur/devoirs"
            element={<RoleRoute roles={["Formateur", "Administrateur"]}><FormateurDevoirs /></RoleRoute>}
          />

          <Route
            path="/etudiant/catalogue"
            element={<RoleRoute roles={["Etudiant"]}><EtudiantCatalogue /></RoleRoute>}
          />
          <Route
            path="/etudiant/parcours"
            element={<RoleRoute roles={["Etudiant"]}><EtudiantParcours /></RoleRoute>}
          />
          <Route
            path="/etudiant/formation/:id"
            element={<RoleRoute roles={["Etudiant"]}><EtudiantFormation /></RoleRoute>}
          />
          <Route
            path="/etudiant/lecon/:id"
            element={<RoleRoute roles={["Etudiant"]}><EtudiantLecon /></RoleRoute>}
          />
          <Route
            path="/etudiant/quiz/:id"
            element={<RoleRoute roles={["Etudiant"]}><EtudiantQuiz /></RoleRoute>}
          />
          <Route
            path="/etudiant/devoirs"
            element={<RoleRoute roles={["Etudiant"]}><EtudiantDevoirs /></RoleRoute>}
          />
          <Route
            path="/etudiant/tentatives"
            element={<RoleRoute roles={["Etudiant"]}><EtudiantTentatives /></RoleRoute>}
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
