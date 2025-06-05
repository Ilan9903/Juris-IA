// frontend_src/components/Header.tsx
import LogoutIcon from '@mui/icons-material/Logout'; // Importer l'icône de déconnexion
import { AppBar, Avatar, Badge, IconButton, Toolbar, Tooltip, useMediaQuery, useTheme } from "@mui/material"; // Ajout de useMediaQuery et useTheme
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Importer useNavigate
import ProfileModal from "../components/modals/ProfilModal";
import { useAuth } from "../context/useAuth";
import Logo from "./shared/Logo";
import NavigationLink from "./shared/NavigationLink";

// ... (UserStatusBadge component remains the same)
interface UserStatusBadgeProps {
  status: "online" | "idle" | "offline" | undefined;
  avatarSrc: string;
  userName: string | undefined;
  onOpen: () => void;
}

const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status, avatarSrc, userName, onOpen }) => {
  const dotColor =
    status === "online" ? "#43b581" : status === "idle" ? "#faa61a" : "#747f8d";
  const tooltipTitle =
    status === "online" ? "Connecté" : status === "idle" ? "Inactif" : "Hors ligne";
  const badgeColor =
    status === "online" ? "success" : status === "idle" ? "warning" : "default";

  return (
    <IconButton onClick={onOpen} sx={{ p: 0 }}>
      <Tooltip title={tooltipTitle}>
        <Badge
          key={status || "offline"}
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          variant="dot"
          sx={{ "& .MuiBadge-dot": { backgroundColor: dotColor } }}
          color={badgeColor}
        >
          <Avatar
            src={avatarSrc}
            alt={userName || 'User Avatar'}
            className={avatarSrc === "/pdp_none.png" ? "image-inverted" : ""}
            sx={{
              width: 40, // Taille légèrement réduite pour mobile si besoin
              height: 40,
              border: "1px solid #00fffc",
              fontWeight: "bold",
            }}
          >
            {!avatarSrc && userName?.[0]?.toUpperCase()}
          </Avatar>
        </Badge>
      </Tooltip>
    </IconButton>
  );
};

const Header = () => {
  const auth = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const user = auth?.user;
  const location = useLocation();
  const navigate = useNavigate(); // Hook pour la navigation

  const theme = useTheme();
  // Définir "mobile" comme étant les écrans 'sm' et plus petits
  // Vous pouvez ajuster le breakpoint (ex: 'xs' uniquement, ou 'md')
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    // console.log("[Header useEffect] User object or status changed:", user?.status);
  }, [user]);

  const handleOpen = () => setModalOpen(true);
  const handleClose = () => setModalOpen(false);

  const avatarSrc = user?.profileImage || "/pdp_none.png";

  const handleLogout = async () => {
    await auth.logout();
    navigate("/"); // Rediriger vers la page d'accueil après la déconnexion
  };

  return (
    <>
      <AppBar
        sx={{
          bgcolor: "transparent",
          position: "absolute",
          boxShadow: "none",
          top: 8,
          width: "100%",
          zIndex: 1100,
        }}
      >
        {/* Ajuster le padding de la Toolbar pour mobile */}
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", px: { xs: 1, sm: 2 } }}>
          <Logo />
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "4px" : "8px" }}> {/* Gap réduit sur mobile */}
            {auth?.isLoggedIn ? (
              <>
                {location.pathname !== "/chat" && !isMobile && ( // Cacher "Juris IA" sur mobile si déjà sur une autre page
                  <NavigationLink
                    bg="#03a3c2"
                    to="/chat"
                    text="Juris IA"
                    textColor="white"
                  />
                )}
                <UserStatusBadge
                  status={user?.status}
                  avatarSrc={avatarSrc}
                  userName={user?.name}
                  onOpen={handleOpen}
                />
                {isMobile ? (
                  <Tooltip title="Déconnexion">
                    <IconButton
                      onClick={handleLogout}
                      sx={{
                        color: "white", // Couleur de l'icône
                        bgcolor: "#1f505f", // Fond similaire au bouton original
                        '&:hover': {
                          bgcolor: "#3c3e70", // Assombrir au survol
                        },
                        padding: "9px", // Ajuster le padding pour la taille de l'icône
                        marginLeft: "5px",
                        marginRight: "3.5px",
                      }}
                    >
                      <LogoutIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <NavigationLink
                    bg="#1f505f"
                    textColor="white"
                    to="/" // La redirection est gérée par handleLogout maintenant
                    text="Deconnexion"
                    onClick={handleLogout} // Utiliser la nouvelle fonction handleLogout
                  />
                )}
              </>
            ) : (
              <>
                <NavigationLink
                  bg="#03a3c2"
                  to="/login"
                  text="Connexion"
                  textColor="black"
                  style={isMobile ? { padding: '6px 10px', fontSize: '0.8rem' } : {}} // Style réduit sur mobile
                />
                <NavigationLink
                  bg="#1f505f"
                  textColor="white"
                  to="/signup"
                  text="S'inscrire"
                  style={isMobile ? { padding: '6px 10px', fontSize: '0.8rem' } : {}} // Style réduit sur mobile
                />
              </>
            )}
          </div>
        </Toolbar>
      </AppBar>
      <ProfileModal open={modalOpen} handleClose={handleClose} />
    </>
  );
};

export default Header;