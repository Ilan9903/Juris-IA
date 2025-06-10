// frontend_src/pages/Login.tsx
import { Box, Button, Typography, useMediaQuery, useTheme } from "@mui/material";
import React, { useEffect } from "react";
import { toast } from "react-hot-toast";
import { IoIosLogIn } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import CustomizedInput from "../components/shared/CustomizedInput";
import { useAuth } from "../context/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const theme = useTheme();

  // hideRobot sera true si la largeur est <= 1249px
  const hideRobot = useMediaQuery('(max-width:1249px)');
  // isMobile sera true si la largeur est <= breakpoint 'sm' (typiquement 600px)
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    try {
      toast.loading("Connexion...", { id: "login" });
      await auth?.login(email, password);
      toast.success("Connexion réussie", { id: "login" });
    } catch (error) {
      console.log(error);
      toast.error("Connexion échouée", { id: "login" });
    }
  };

  useEffect(() => {
    if (auth?.user) {
      return navigate("/chat");
    }
  }, [auth, navigate]);

  return (
    <Box // Conteneur principal de la page
      width="100%"
      minHeight="calc(100vh - 100px)" // Ajustez 64px à la hauteur de votre header si elle est différente
      display="flex"
      alignItems="center"
      justifyContent="center" // Centre le contenu global horizontalement
      sx={{
        pt: { xs: 2, md: 0 }, // Moins de padding en haut sur mobile
        px: 2, // Padding horizontal global
        boxSizing: 'border-box',
      }}
    >
      {/* Conteneur pour la disposition robot + formulaire */}
      <Box
        display="flex"
        width="100%"
        maxWidth="lg" // Limite la largeur globale de cette section
        alignItems="center"
        // Sur mobile (isMobile) ou si le robot est caché (hideRobot), centrer le formulaire.
        // Sinon (grand écran avec robot), espacer.
        justifyContent={isMobile || hideRobot ? "center" : "space-between"}
        // Sur mobile (isMobile), toujours column-reverse.
        // Sur tablette/desktop (pas isMobile): si robot caché (hideRobot), alors column-reverse pour centrer le form.
        // Sinon (robot visible), alors row.
        flexDirection={isMobile ? "column-reverse" : (hideRobot ? "column-reverse" : "row")}
      >
        {/* Image du Robot : affichée seulement si !hideRobot */}
        {!hideRobot && (
          <Box
            flex={{ md: 0.6 }} // Donne un peu plus d'espace au robot s'il est visible
            display="flex" // Assurez-vous que display est flex ici
            justifyContent="center"
            alignItems="center"
            sx={{ p: { md: 3 }, alignSelf: { md: 'stretch' } }} // Pour que le robot prenne de la hauteur aussi
          >
            <img
              src="/airobot.png"
              alt="Robot"
              style={{ width: "100%", maxWidth: "400px", maxHeight: '70vh', height: "auto", objectFit: 'contain' }}
            />
          </Box>
        )}

        {/* Conteneur du Formulaire */}
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center" // Centrer le formulaire (le Box avec maxWidth)
          // Si le robot est caché, le formulaire peut prendre plus d'espace ou être simplement centré.
          // S'il n'est pas caché (sur desktop), il prend flex: 0.4
          flex={hideRobot ? 1 : { xs: 1, md: 0.4 }}
          width="100%" // Nécessaire pour que alignItems: 'center' fonctionne bien sur le Box enfant
          sx={{
            py: { xs: 3, md: 2 }, // Padding vertical
          }}
        >
          <Box // Le formulaire lui-même
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: "100%",
              maxWidth: "420px", // Légèrement réduit pour un meilleur aspect
              padding: { xs: "25px", sm: "30px" },
              boxShadow: "0px 8px 25px rgba(0, 0, 0, 0.15)", // Ombre plus douce
              borderRadius: "12px", // Coins plus arrondis
              bgcolor: "#172331", // Fond légèrement différent pour se détacher
              backdropFilter: "blur(8px)",     // Effet de flou
            }}
          >
            <Typography
              variant="h4"
              textAlign="center"
              paddingBottom={2}
              fontWeight={700} // Plus gras
              color="white" // Assurer la couleur
              fontSize={{ xs: "1.6rem", sm: "1.8rem", md: "2rem" }} // Tailles de police responsives
            >
              Connexion
            </Typography>
            <CustomizedInput type="email" name="email" label="Email" />
            <CustomizedInput type="password" name="password" label="Password" />
            <Button
              type="submit"
              fullWidth
              sx={{
                py: 1.5,
                mt: 3,
                borderRadius: "8px", // Coins du bouton arrondis
                bgcolor: "#03a3c2",
                color: "white",
                fontWeight: "bold",
                fontSize: "1rem",
                ":hover": {
                  bgcolor: "white",
                  color: "#03a3c2",
                },
              }}
              endIcon={<IoIosLogIn />}
            >
              Se Connecter
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;