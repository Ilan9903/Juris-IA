import { useMediaQuery, useTheme } from "@mui/material";
import { TypeAnimation } from "react-type-animation";

const TypingAnim = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <TypeAnimation
      sequence={[
        // Same substring at the start will only be typed once, initially
        "Chat avec Juris IA ⚖️",
        1000,
        "Ton propre assistant IA Juridique",
        2000,
        "Créer avec OpenAI 🤖",
        1500,
      ]}
      speed={40}
      style={{
        fontSize: isMobile ? "30px" : "60px", // Taille de police conditionnelle
        color: "white",
        display: "inline-block",
        textAlign: "center", // Pour mieux centrer sur mobile si le conteneur est plus large
        textShadow: "1px 1px 20px #000",
      }}
      repeat={Infinity}
    />
  );
};

export default TypingAnim;
