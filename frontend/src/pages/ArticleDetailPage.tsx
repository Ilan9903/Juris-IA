// frontend_src/pages/ArticleDetailPage.tsx
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Chip, CircularProgress, Container, Divider, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { getArticleDetailsById } from '../helpers/api-communicator'; // Assurez-vous que le chemin est correct

// L'interface Article que vous avez définie (assurez-vous qu'elle est cohérente ou importez-la)
interface Article {
    _id: string;
    title: string;
    content: string;
    category?: string[];
    createdAt?: string; // La date de création
    updatedAt?: string; // La date de mise à jour
    isUniversal?: boolean;
    pdfUrl?: string;
}

const ArticleDetailPage = () => {
    const { id } = useParams<{ id: string }>(); // Récupère l'ID de l'article depuis l'URL
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        if (id) {
            const fetchArticleDetails = async () => {
                setLoading(true);
                setError(null);
                try {
                    // toast.loading("Chargement de l'article...", { id: "article-detail-load" }); // Optionnel
                    const data = await getArticleDetailsById(id);
                    setArticle(data);
                    // toast.success("Article chargé !", { id: "article-detail-load" }); // Optionnel
                } catch (err) {
                    console.error("Erreur lors de la récupération des détails de l'article:", err);
                    toast.error("Impossible de charger cet article.");
                    setError("Impossible de charger l'article. Il se peut qu'il n'existe pas ou qu'une erreur soit survenue.");
                    setArticle(null);
                } finally {
                    setLoading(false);
                }
            };
            fetchArticleDetails();
        } else {
            setError("Aucun ID d'article fourni.");
            setLoading(false);
        }
    }, [id]); // Se redéclenche si l'ID dans l'URL change

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', pt: "80px" }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ pt: "100px", textAlign: 'center' }}>
                <Typography variant="h5" color="error" gutterBottom>
                    Erreur
                </Typography>
                <Typography>{error}</Typography>
                <Button component={RouterLink} to="/articles" variant="outlined" sx={{ mt: 3 }}>
                    Retour à la liste des articles
                </Button>
            </Container>
        );
    }

    if (!article) {
        return (
            <Container maxWidth="md" sx={{ pt: "100px", textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                    Article non trouvé.
                </Typography>
                <Button component={RouterLink} to="/articles" variant="outlined" sx={{ mt: 3 }}>
                    Retour à la liste des articles
                </Button>
            </Container>
        );
    }

    // Formater les dates (optionnel, mais recommandé pour la lisibilité)
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Date inconnue';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, pt: "80px" /* Pour le header fixe */ }}>
            <Button
                component={RouterLink}
                to="/articles"
                startIcon={<ArrowBackIcon />}
                sx={{ mb: 3, color: '#00fffc' }}
            >
                Retour aux articles
            </Button>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: "#0c1e2e", color: "white" }}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ color: "#00fffc", wordBreak: 'break-word' }}>
                    {article.title}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {article.category?.map((cat) => (
                        <Chip label={cat} key={cat} sx={{ backgroundColor: '#1a3652', color: 'white' }} />
                    ))}
                </Box>
                <Typography variant="caption" display="block" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                    Publié le : {formatDate(article.createdAt)}
                </Typography>
                {article.updatedAt !== article.createdAt && (
                    <Typography variant="caption" display="block" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                        Dernière mise à jour : {formatDate(article.updatedAt)}
                    </Typography>
                )}
                <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.2)' }} />

                {/* Pour afficher le contenu HTML potentiellement formaté (si votre contenu est du HTML sûr) */}
                {/* <Typography component="div" dangerouslySetInnerHTML={{ __html: article.content }} sx={{ lineHeight: 1.7, '& p': {mb: 2} }} /> */}

                {/* Pour afficher le contenu comme du texte simple avec respect des retours à la ligne */}
                <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, wordBreak: 'break-word' }}>
                    {article.content}
                </Typography>

                {article.pdfUrl && (
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Button
                            variant="contained"
                            href={article.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ bgcolor: "#00fffc", color: "black", '&:hover': { bgcolor: "#00d3d0" } }}
                        >
                            Télécharger le PDF
                        </Button>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default ArticleDetailPage;