import ArticleIcon from '@mui/icons-material/Article';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Button, CircularProgress, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminGetAllArticles } from "../../helpers/api-communicator";

interface Article {
    _id: string;
    title: string;
    category: string[];
    createdAt: string;
}

const ArticleManagement = () => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArticles = async () => {
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
        };
        fetchArticles();
    }, []);

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Gestion des Articles
                </Typography>
                <Button variant="contained" startIcon={<ArticleIcon />}>
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
                                <TableCell align="right">
                                    <Tooltip title="Modifier">
                                        <IconButton onClick={() => console.log('Edit article:', article._id)}>
                                            <EditIcon sx={{ color: 'grey.500', '&:hover': { color: 'white' } }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Supprimer">
                                        <IconButton onClick={() => console.log('Delete article:', article._id)}>
                                            <DeleteIcon sx={{ color: 'grey.500', '&:hover': { color: 'red' } }} />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ArticleManagement;