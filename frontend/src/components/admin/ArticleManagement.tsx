import ArticleIcon from '@mui/icons-material/Article';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Button, CircularProgress, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminDeleteArticle, adminGetAllArticles } from "../../helpers/api-communicator";
import ConfirmationModal from '../modals/ConfirmationModal';
import ArticleModal from './modals/ArticleModal'; // Importer la nouvelle modale

interface Article {
    _id: string;
    title: string;
    category: string[];
    createdAt: string;
    updatedAt: string;
    content: string; // Ajouter content pour l'édition
}

const ArticleManagement = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    // États pour les modales
    const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
    const [articleToEdit, setArticleToEdit] = useState<Article | null>(null);
    const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);

    // Fonction pour récupérer les articles, mise dans un useCallback
    const fetchArticles = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminGetAllArticles();
            setArticles(data.articles);
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la récupération des articles.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    // Logique pour la suppression
    const handleConfirmDelete = async () => {
        if (!articleToDelete) return;
        try {
            await adminDeleteArticle(articleToDelete._id);
            toast.success(`L'article "${articleToDelete.title}" a été supprimé.`);
            setArticles(prev => prev.filter(article => article._id !== articleToDelete._id));
        } catch (error) {
            toast.error("Erreur lors de la suppression.");
        } finally {
            setArticleToDelete(null); // Ferme la modale de confirmation
        }
    };

    // Fonctions pour ouvrir les modales
    const handleOpenCreateModal = () => {
        setArticleToEdit(null); // S'assurer qu'on est en mode création
        setIsArticleModalOpen(true);
    };

    const handleOpenEditModal = (article: Article) => {
        setArticleToEdit(article);
        setIsArticleModalOpen(true);
    };

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Gestion des Articles ({articles.length})
                </Typography>
                <Button variant="contained" startIcon={<ArticleIcon />} onClick={handleOpenCreateModal}>
                    Nouvel Article
                </Button>
            </Box>
            <TableContainer component={Paper} sx={{ bgcolor: 'rgb(23, 35, 49)' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Titre</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Catégories</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Créé le</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Dernière Màj</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {articles.map((article) => (
                            <TableRow key={article._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell sx={{ color: 'white', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {article.title}
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>{article.category.join(', ')}</TableCell>
                                <TableCell sx={{ color: 'white' }}>{new Date(article.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell sx={{ color: 'white' }}>{new Date(article.updatedAt).toLocaleDateString()}</TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Modifier">
                                        <IconButton onClick={() => handleOpenEditModal(article)}>
                                            <EditIcon sx={{ color: 'grey.500', '&:hover': { color: 'white' } }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Supprimer">
                                        <IconButton onClick={() => setArticleToDelete(article)}>
                                            <DeleteIcon sx={{ color: 'grey.500', '&:hover': { color: 'red' } }} />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Rendu des modales */}
            <ConfirmationModal
                open={!!articleToDelete}
                onClose={() => setArticleToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirmer la Suppression"
                message={`Voulez-vous vraiment supprimer l'article "${articleToDelete?.title}" ?`}
            />
            <ArticleModal
                open={isArticleModalOpen}
                onClose={() => setIsArticleModalOpen(false)}
                onSuccess={fetchArticles} // Rafraîchir la liste après une création/mise à jour
                articleToEdit={articleToEdit}
            />
        </Box>
    );
};

export default ArticleManagement;