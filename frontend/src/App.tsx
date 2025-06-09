import Box from "@mui/material/Box";
import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import { useAuth } from "./context/useAuth"; // MODIFIÉ: Importe useAuth du nouveau fichier
import ArticleDetailPage from "./pages/ArticleDetailPage";
import ArticlesPage from "./pages/ArticlesPage";
import Chat from "./pages/Chat";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";

const ACTUAL_HEADER_HEIGHT = "100px";

const App = () => {
  const auth = useAuth();

  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}> {/* Conteneur racine */}
      <Header onMenuClick={() => setDrawerOpen(true)} /> {/* Header est en position: "fixed", donc hors du flux normal */}

      {/* Ce Box est le conteneur principal pour tout le contenu SOUS le header */}
      <Box
        component="main"
        sx={{
          flexGrow: 1, // Pour qu'il prenne l'espace vertical restant si le parent (Box ci-dessus) n'a pas de hauteur fixe autre que 100vh
          paddingTop: ACTUAL_HEADER_HEIGHT, // << C'EST LA LIGNE CRUCIALE POUR DÉCALER LE CONTENU
          height: '100vh', // S'assurer qu'il a une référence de hauteur pour les enfants en %
          overflowY: 'auto', // Permettre le défilement si le contenu dépasse la hauteur de la fenêtre
          overflowX: 'hidden', // Empêche le défilement horizontal
          width: '100%', // S'assurer qu'il prend toute la largeur
        }}
      >
        <Routes>
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default App;