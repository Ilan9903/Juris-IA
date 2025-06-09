// frontend_src/components/Header.tsx
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu'; // Importer l'icône du menu
import { AppBar, Avatar, Badge, Box, IconButton, Toolbar, Tooltip, useMediaQuery, useTheme } from "@mui/material"; // Ajout de Box
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUI } from "../context/UIContext"; // Importer le contexte UI
import { useAuth } from "../context/useAuth";
import Logo from "./shared/Logo";
import NavigationLink from "./shared/NavigationLink";

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
              width: 40,
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

// Le composant Header reçoit maintenant la prop onMenuClick
const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const auth = useAuth();
  const { openProfileModal } = useUI();
  const user = auth?.user;
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  // Le menu hamburger apparaitra quand la sidebar disparait (en dessous du breakpoint 'md')
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    console.log("--- Header Debug ---");
    console.log("Breakpoint 'isMobile' (<md) est:", isMobile);
    console.log("Chemin actuel (location.pathname):", location.pathname);
    const shouldShowMenu = isMobile && location.pathname === "/chat";
    console.log("Le menu hamburger devrait-il s'afficher ?", shouldShowMenu);
    console.log("--------------------");
  }, [isMobile, location.pathname]);

  useEffect(() => {
    // console.log("[Header useEffect] User object or status changed:", user?.status);
  }, [user]);
  const avatarSrc = user?.profileImage || "/pdp_none.png";

  const handleLogout = async () => {
    await auth.logout();
    navigate("/");
  };

  return (
    <>
      <AppBar
        sx={{
          bgcolor: "transparent",
          position: "fixed", // Assurez-vous qu'il est "fixed" et non "absolute" pour rester en place au scroll
          boxShadow: "none",
          top: 8, // Collé en haut
          width: "100%",
          zIndex: 1100,
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", px: { xs: 1, sm: 2 } }}>
          {/* Conteneur à gauche pour le menu hamburger et le logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Condition d'affichage du menu hamburger */}
            {isMobile && location.pathname === "/chat" && (
              <IconButton
                color="inherit" // Hérite la couleur du parent (blanc par défaut dans la Toolbar)
                edge="start" // Pour un meilleur positionnement à gauche
                onClick={onMenuClick} // Appelle la fonction passée par App.tsx
                sx={{ mr: 0, ml: 1 }} // Marge à droite pour espacer du logo
              >
                <MenuIcon />
              </IconButton>
            )}
            <Logo />
          </Box>

          {/* Conteneur à droite pour les liens et l'avatar utilisateur */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "4px" : "12px" }}>
            {auth?.isLoggedIn ? (
              <>
                {/* CORRECTION : La condition pour afficher le bouton "Juris IA" est restaurée ici */}
                {location.pathname !== "/chat" && (
                  <NavigationLink
                    bg="#03a3c2"
                    to="/chat"
                    text="Juris IA"
                    textColor="white"
                    // Ajout d'un style conditionnel pour réduire sa taille sur mobile
                    style={isMobile ? { padding: '6px 10px', fontSize: '0.8rem' } : {}}
                  />
                )}
                <UserStatusBadge
                  status={user?.status}
                  avatarSrc={avatarSrc}
                  userName={user?.name}
                  onOpen={openProfileModal}
                />
                {isMobile ? (
                  <Tooltip title="Déconnexion">
                    <IconButton
                      onClick={handleLogout}
                      sx={{
                        color: "white",
                        bgcolor: "#1f505f",
                        '&:hover': { bgcolor: "#3c3e70" },
                        padding: "8px",
                        marginLeft: "4px"
                      }}
                    >
                      <LogoutIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <NavigationLink
                    bg="#1f505f"
                    textColor="white"
                    to="/"
                    text="Deconnexion"
                    onClick={handleLogout}
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
                  style={isMobile ? { padding: '6px 10px', fontSize: '0.8rem' } : {}}
                />
                <NavigationLink
                  bg="#1f505f"
                  textColor="white"
                  to="/signup"
                  text="S'inscrire"
                  style={isMobile ? { padding: '6px 10px', fontSize: '0.8rem' } : {}}
                />
              </>
            )}
          </div>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default Header;