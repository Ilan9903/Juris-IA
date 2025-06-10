import { Box, Typography } from "@mui/material"; // Ajout de Typography pour la route index
import { useState } from "react";
import { Route, Routes } from "react-router-dom";

// Imports des composants et pages
import Header from "./components/Header";
import ProfilModal from "./components/modals/ProfilModal";
import SettingsModal from "./components/modals/SettingsModal";
import AdminProtectedRoute from "./components/shared/AdminProtectedRoute";
import { useAuth } from "./context/useAuth";
import ArticleDetailPage from "./pages/ArticleDetailPage";
import ArticlesPage from "./pages/ArticlesPage";
import Chat from "./pages/Chat";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";

// Imports des nouvelles pages et composants admin
import ArticleManagement from "./components/admin/ArticleManagement";
import UserManagement from "./components/admin/UserManagement";
import AdminDashboard from "./pages/admin/AdminDashboard";


// Hauteur standard d'un header Material-UI sur desktop.
// Mesurez la hauteur réelle de votre Header avec l'inspecteur pour une valeur exacte.
const ACTUAL_HEADER_HEIGHT = "100px";

const App = () => {
  const auth = useAuth();
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    // Le conteneur racine de l'application
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header onMenuClick={() => setDrawerOpen(true)} />

      {/* Conteneur principal pour tout le contenu SOUS le header */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          paddingTop: ACTUAL_HEADER_HEIGHT, // Espace pour le Header fixe
          height: `calc(100vh - ${ACTUAL_HEADER_HEIGHT})`, // Hauteur pour remplir le reste de l'écran
          overflowY: 'auto', // Permet le défilement vertical pour les pages longues (comme Home)
          overflowX: 'hidden',
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Routes>
          {/* Routes existantes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/chat"
            element={auth?.isLoggedIn && auth.user ?
              <Chat isDrawerOpen={isDrawerOpen} setDrawerOpen={setDrawerOpen} />
              : <Login />}
          />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:id" element={<ArticleDetailPage />} />

          {/* --- NOUVELLES ROUTES POUR L'ADMINISTRATION --- */}
          {/* Toutes les routes à l'intérieur ici seront protégées par AdminProtectedRoute */}
          <Route element={<AdminProtectedRoute />}>
            {/* La route /admin utilisera AdminDashboard comme layout */}
            <Route path="/admin" element={<AdminDashboard />}>
              {/* La page par défaut du tableau de bord (ex: /admin) */}
              <Route index element={
                <Box>
                  <Typography variant="h4">Tableau de Bord</Typography>
                  <Typography>Bienvenue sur l'espace d'administration de Juris IA.</Typography>
                </Box>
              } />
              {/* La sous-route pour la gestion des utilisateurs (ex: /admin/users) */}
              <Route path="users" element={<UserManagement />} />
              <Route path="articles" element={<ArticleManagement />} />
              {/* TODO: Ajouter les routes pour les articles et les prompts ici */}
              {/* <Route path="articles" element={<ArticleManagement />} /> */}
              {/* <Route path="prompts" element={<PromptManagement />} /> */}
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Box>

      {/* Les modales sont globales et gérées par le UIContext */}
      <ProfilModal />
      <SettingsModal />
    </Box>
  );
};

export default App;
