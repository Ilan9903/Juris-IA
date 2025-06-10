// frontend_src/pages/Home.tsx
import { Box, Button, Card, CardActions, CardContent, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Slider from "react-slick";
import Footer from "../components/footer/Footer";
import TypingAnim from "../components/typer/TypingAnim";
import { getRecentArticles } from "../helpers/api-communicator";

interface Article {
  _id: string;
  title: string;
  content: string;
  category?: string[];
  createdAt?: string;
}

const Home = () => {
  const theme = useTheme(); // Hook 1
  const navigate = useNavigate(); // Hook 2

  // Appels de Hooks au niveau supérieur et dans le même ordre
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Hook 3
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md")); // Hook 4
  const isDesktopSmall = useMediaQuery(theme.breakpoints.between("md", "lg")); // Hook 5

  const [recentArticles, setRecentArticles] = useState<Article[]>([]); // Hook 6
  const [loadingArticles, setLoadingArticles] = useState<boolean>(true); // Hook 7

  useEffect(() => { // Hook 8
    const fetchArticles = async () => {
      setLoadingArticles(true);
      try {
        const data = await getRecentArticles(6); // Obtenir 6 articles pour plus de flexibilité
        if (Array.isArray(data)) {
          setRecentArticles(data);
        } else {
          console.warn("La réponse pour les articles récents n'est pas un tableau:", data);
          setRecentArticles([]);
          // Optionnel: toast.error("Format de données d'articles incorrect.");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des articles récents:", error);
        // Optionnel: toast.error("Impossible de charger les articles récents.");
        setRecentArticles([]);
      } finally {
        setLoadingArticles(false);
      }
    };
    fetchArticles();
  }, []);

  const handleArticleClick = (articleId: string) => {
    navigate(`/articles/${articleId}`);
  };

  // Déterminer le nombre de slides à afficher en fonction des breakpoints
  // Cette fonction n'est PAS un Hook et utilise les résultats des Hooks
  let slidesToShow = 3;
  let centerMode = false;
  let centerPadding = '0px';

  if (isMobile) { // Moins de 600px
    slidesToShow = 1;
    centerMode = true;
    centerPadding = '20px'; // ou '0px' si vous ne voulez pas d'aperçu
  } else if (isTablet) { // Entre 600px et 900px
    slidesToShow = 1; // Afficher 1 slide pour mieux voir le contenu sur tablette
    centerMode = true;
    centerPadding = '50px'; // ou '0px'
  } else if (isDesktopSmall) { // Entre 900px et 1200px
    slidesToShow = 2;
    centerMode = true; // Peut être true ou false selon la préférence
    centerPadding = '40px'; // Si centerMode est true
  }
  // Pour les écrans > 1200px, slidesToShow reste à 3, centerMode à false.

  // Configuration pour react-slick, utilisant les variables des Hooks
  const carouselSettings = {
    dots: true,
    infinite: recentArticles.length > slidesToShow, // Utiliser la variable calculée
    speed: 800,
    slidesToShow: slidesToShow, // Utiliser la variable calculée
    slidesToScroll: 1, // Défiler une slide à la fois
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    centerMode: centerMode, // Activer centerMode si moins de 3 slides sont affichées
    centerPadding: centerPadding,
    // responsive: [ // Les 'settings' ici ne sont que des objets de configuration, pas des appels de Hooks
    //   {
    //     breakpoint: theme.breakpoints.values.lg, // ex: 1200px
    //     settings: {
    //       slidesToShow: 2,
    //       slidesToScroll: 1,
    //       infinite: recentArticles.length > 2,
    //       centerMode: true,
    //       centerPadding: '40px',
    //     }
    //   },
    //   {
    //     breakpoint: theme.breakpoints.values.md, // ex: 900px
    //     settings: {
    //       slidesToShow: 1,
    //       slidesToScroll: 1,
    //       infinite: recentArticles.length > 1,
    //       centerMode: true,
    //       centerPadding: '40px',
    //     }
    //   },
    //   {
    //     breakpoint: theme.breakpoints.values.sm, // ex: 600px
    //     settings: {
    //       slidesToShow: 1,
    //       slidesToScroll: 1,
    //       infinite: recentArticles.length > 1,
    //       centerMode: true,
    //       centerPadding: '20px',
    //     }
    //   }
    // ]
  };

  const sliderWrapperWidth = '100%';

  // Aucun return anticipé avant la fin de tous les appels de Hooks.

  return (
    <Box width={"100%"} sx={{ pt: { xs: 2, md: "80px" }, overflowX: 'hidden' }}>
      <Box
        sx={{
          display: "flex",
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
          mx: "auto",
          mt: { xs: 2, md: 3 },
          textAlign: "center",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: "md", px: 2, mt: { xs: 2, md: 0 }, mb: { xs: 3, md: 4 } }}>
          <TypingAnim />
        </Box>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: { md: "row", xs: "column" },
            gap: 5,
            my: { xs: 3, md: 8 },
            position: "relative",
          }}
        >
          <img
            src="/robot.png" // Assurez-vous que les chemins des images sont corrects (dossier public)
            alt="robot"
            style={{ width: isMobile ? "120px" : "180px", margin: "auto" }}
          />
          <img
            className="image-inverted2 rotate"
            src="/openai.png"
            alt="openai"
            style={{ width: isMobile ? "120px" : "180px", margin: "auto" }}
          />
        </Box>
        {/* Section image chat.png - Centrée */}
        <Box sx={{ display: "flex", width: "100%", justifyContent: "center", px: 2, my: { xs: 6, md: 4 }, marginRight: "9px" }}>
          <Box // Conteneur pour limiter la largeur de l'image du chat et la centrer
            sx={{
              width: { xs: "95%", sm: "80%", md: "70%" },
              maxWidth: "750px", // Largeur maximale
              mx: "auto" // Centrage
            }}
          >
            <img
              src="/chat.png"
              alt="chatbot"
              style={{
                display: "block", // Changé en block pour que mx:auto fonctionne bien sur le parent
                width: "100%", // L'image prend 100% de son nouveau parent Box
                height: "auto", // Garder le ratio
                borderRadius: 20,
                boxShadow: "-5px -5px 105px #03a3c2",
                padding: isMobile ? "5px" : "10px",
              }}
            />
          </Box>
        </Box>

        {/* Section Carrousel des Articles Récents */}
        <Box sx={{ my: { xs: 3, md: 15 }, width: '100%', alignItems: 'center', justifyItems: 'center' }}>
          <Typography variant={isMobile ? "h6" : (isTablet || isDesktopSmall ? "h5" : "h4")} component="h2" gutterBottom textAlign="center" sx={{ mb: 3 }}>
            Nos Derniers Articles
          </Typography>
          {loadingArticles ? (
            <Typography textAlign="center">Chargement des articles...</Typography>
          ) : recentArticles.length > 0 ? (
            // Le conteneur direct du Slider doit avoir overflow: hidden pour éviter le scroll horizontal
            // causé par centerPadding ou le mécanisme interne du slider.
            <Box sx={{
              maxWidth: '1200px',
              mx: 'auto',
              width: sliderWrapperWidth, // Généralement 100% du parent
              overflow: 'hidden', // Crucial pour les carrousels
              // Le padding horizontal est maintenant mieux géré par centerPadding du slider
              // ou par le padding des slides elles-mêmes si centerMode est false.
            }}>
              <Slider {...carouselSettings}>
                {recentArticles.map((article) => (
                  <Box key={article._id} sx={{ px: centerMode ? 0 : { xs: 0.5, sm: 1, md: 1.5 } }}>
                    {/* Si centerMode, react-slick gère l'espacement. Sinon, petit padding pour séparer les cartes. */}
                    <Card sx={{
                      bgcolor: "#0c1e2e",
                      color: "white",
                      height: "80%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: { xs: '180px', sm: '260px', md: '280px' },
                      mx: { xs: 1, sm: 1.5, md: 2 },// Marge seulement si centerMode pour éviter double espacement
                      justifyItems: "center",
                      transition: 'transform 0.3s ease',
                    }}>
                      <CardContent sx={{ flexGrow: 1, p: isMobile ? 1.2 : 1.8 }}>
                        <Typography variant="h6" component="div" sx={{
                          color: "#03a3c5",
                          minHeight: '3em',
                          fontSize: isMobile ? '0.85rem' : (isTablet || isDesktopSmall ? '1rem' : '1.1rem'),
                          lineHeight: 1.25,
                          mb: 0.5,
                          display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {article.title}
                        </Typography>
                        <Typography variant="body2" sx={{
                          mt: 0.5,
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: isMobile ? 2 : (isTablet || isDesktopSmall ? 3 : 4),
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minHeight: isMobile ? '2.8em' : (isTablet || isDesktopSmall ? '4.2em' : '5.2em'),
                          fontSize: isMobile ? '0.7rem' : (isTablet ? '0.75rem' : '0.85rem'),
                          color: 'rgba(255,255,255,0.85)'
                        }}>
                          {article.content}
                        </Typography>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'center', pb: 1.5, pt: 0 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ color: "#03a3c5", borderColor: "#03a3c5", fontSize: isMobile ? '0.65rem' : '0.8rem', '&:hover': { backgroundColor: 'rgba(0, 255, 252, 0.06)', borderColor: "#00ddda" } }}
                          onClick={() => handleArticleClick(article._id)}
                        >
                          En savoir plus
                        </Button>
                      </CardActions>
                    </Card>
                  </Box>
                ))}
              </Slider>
            </Box>
          ) : (
            <Typography textAlign="center">Aucun article récent à afficher.</Typography>
          )}
          <Box sx={{ textAlign: 'center', mt: 4, mb: 3 }}>
            <Button
              variant="contained"
              component={Link}
              to="/articles"
              sx={{ bgcolor: "#03a3c9", color: "black", fontWeight: 'bold', '&:hover': { bgcolor: "#00dddc" } }}
            >
              Voir tous les articles
            </Button>
          </Box>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
};

export default Home;