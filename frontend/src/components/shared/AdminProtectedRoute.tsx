// frontend_src/components/shared/AdminProtectedRoute.tsx
import { Box, CircularProgress } from "@mui/material";
import toast from "react-hot-toast";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const AdminProtectedRoute = () => {
    const auth = useAuth();

    // Si l'application est encore en train de vérifier l'authentification, on peut afficher un loader
    if (auth.loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
            </Box> // Ou un spinner plus élaboré
        );
    }

    // Si l'utilisateur est connecté ET a le rôle 'admin'
    if (auth.isLoggedIn && auth.user?.role === 'admin') {
        return <Outlet />; // Affiche le contenu de la route enfant (notre tableau de bord)
    } else {
        // Sinon, redirige vers la page d'accueil
        toast.error("Accès refusé. Vous n'avez pas les permissions nécessaires.");
        return <Navigate to="/" />;
    }
};

export default AdminProtectedRoute;