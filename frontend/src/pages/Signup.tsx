// frontend_src/pages/Signup.tsx
import { Box, Button, Typography, useMediaQuery, useTheme } from "@mui/material"; // Importer useMediaQuery et useTheme
import React, { useEffect } from "react";
import { toast } from "react-hot-toast";
import { IoIosLogIn } from "react-icons/io"; // Assurez-vous que l'icône est pertinente pour l'inscription aussi
import { useNavigate } from "react-router-dom";
import CustomizedInput from "../components/shared/CustomizedInput";
import { useAuth } from "../context/useAuth";

const Signup = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const theme = useTheme(); // Accéder au thème pour les breakpoints

  // hideRobot sera true si la largeur est <= 1249px
  const hideRobot = useMediaQuery('(max-width:1249px)');
  // isMobile sera true si la largeur est <= breakpoint 'sm' (typiquement 600px)
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    try {
      toast.loading("Inscription...", { id: "signup" });
      await auth?.signup(name, email, password);
      toast.success("Inscription réussie", { id: "signup" });
    } catch (error) {
      console.log(error);
      toast.error("Inscription échouée", { id: "signup" });
    }
  };

  useEffect(() => {
    if (auth?.user) {
      return navigate("/chat"); // Redirige vers le chat si l'utilisateur est déjà connecté/inscrit
    }
  }, [auth, navigate]);

  return (
    // Conteneur principal de la page
    <Box
      width="100%"
      minHeight="calc(100vh - 64px)" // Ajustez 64px à la hauteur de votre header si elle est différente
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
        justifyContent={isMobile || hideRobot ? "center" : "space-between"}
        flexDirection={isMobile ? "column-reverse" : (hideRobot ? "column-reverse" : "row")}
      >
        {/* Image du Robot : affichée seulement si !hideRobot */}
        {!hideRobot && (
          <Box
            flex={{ md: 0.6 }}
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{ p: { md: 3 }, alignSelf: { md: 'stretch' } }}
          >
            <img
              src="/airobot.png" // Assurez-vous que ce chemin est correct
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
          alignItems="center"
          flex={hideRobot ? 1 : { xs: 1, md: 0.4 }}
          width="100%"
          sx={{
            py: { xs: 3, md: 2 },
          }}
        >
          <Box // Le formulaire lui-même
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: "100%",
              maxWidth: "420px",
              padding: { xs: "25px", sm: "30px" },
              boxShadow: "0px 8px 25px rgba(0, 0, 0, 0.15)",
              borderRadius: "12px",
              bgcolor: "rgba(17, 29, 39, 0.85)", // Similaire à Login pour la cohérence
              backdropFilter: "blur(8px)",
            }}
          >
            <Typography
              variant="h4"
              textAlign="center"
              paddingBottom={2}
              fontWeight={700}
              color="white"
              fontSize={{ xs: "1.6rem", sm: "1.8rem", md: "2rem" }}
            >
              Inscription
            </Typography>
            <CustomizedInput type="text" name="name" label="Nom" /> {/* Champ Nom pour l'inscription */}
            <CustomizedInput type="email" name="email" label="Email" />
            <CustomizedInput type="password" name="password" label="Mot de passe" />
            <Button
              type="submit"
              fullWidth
              sx={{
                py: 1.5,
                mt: 3,
                borderRadius: "8px",
                bgcolor: "#51538f", // Couleur différente pour le bouton S'inscrire
                color: "white",
                fontWeight: "bold",
                fontSize: "1rem",
                ":hover": {
                  bgcolor: "#3c3e70", // Variante plus foncée au survol
                  // Ou bgcolor: "white", color: "black" si vous préférez ce style de survol
                },
              }}
              endIcon={<IoIosLogIn />} // Vous pourriez vouloir une autre icône pour "s'inscrire", ex: PersonAddIcon
            >
              S'inscrire
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Signup;