// frontend_src/pages/ArticlesPage.tsx
import SearchIcon from '@mui/icons-material/Search'; // Ajouté pour l'icône de loupe
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Grid,
    InputAdornment, // Ajouté pour l'icône/spinner
    Pagination,
    Paper,
    TextField,
    Typography
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { getArticleCategoriesList, GetArticlesParams, getPagedArticles } from "../helpers/api-communicator";

interface Article {
    _id: string;
    title: string;
    content: string;
    category?: string[];
    createdAt?: string;
}

interface PagedArticlesResponse {
    articles: Article[];
    currentPage: number;
    totalPages: number;
    totalArticles: number;
    message?: string;
}

const ARTICLES_PER_PAGE = 6;
const SEARCH_DEBOUNCE_DELAY = 500;

const ArticlesPage = () => {
    const navigate = useNavigate();

    const [categories, setCategories] = useState<string[]>([]);
    const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const [articles, setArticles] = useState<Article[]>([]);
    const [loadingArticles, setLoadingArticles] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(0);

    const [searchInput, setSearchInput] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isProcessingSearch, setIsProcessingSearch] = useState<boolean>(false);

    const articlesSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoadingCategories(true);
                const fetchedCategories = await getArticleCategoriesList();
                if (Array.isArray(fetchedCategories)) {
                    setCategories(fetchedCategories);
                } else {
                    toast.error("Format des catégories incorrect.");
                    setCategories([]);
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des catégories:", error);
                toast.error("Impossible de charger les catégories.");
                setCategories([]);
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (searchInput) {
            setIsProcessingSearch(true);
        } else if (!searchInput && !searchTerm) {
            setIsProcessingSearch(false);
        }

        const timerId = setTimeout(() => {
            setSearchTerm(searchInput);
            setCurrentPage(1);
        }, SEARCH_DEBOUNCE_DELAY);
        return () => {
            clearTimeout(timerId);
        };
    }, [searchInput, searchTerm]);


    useEffect(() => {
        const fetchArticles = async () => {
            setLoadingArticles(true);
            if (searchTerm) {
                setIsProcessingSearch(true);
            }
            try {
                const params: GetArticlesParams = {
                    page: currentPage,
                    limit: ARTICLES_PER_PAGE,
                    category: selectedCategory,
                    search: searchTerm,
                };
                const response: PagedArticlesResponse = await getPagedArticles(params);
                setArticles(response.articles || []);
                setTotalPages(response.totalPages || 0);
            } catch (error) {
                console.error("Erreur lors de la récupération des articles:", error);
                toast.error("Impossible de charger les articles.");
                setArticles([]);
                setTotalPages(0);
            } finally {
                setLoadingArticles(false);
                setIsProcessingSearch(false);
            }
        };
        fetchArticles();
    }, [currentPage, selectedCategory, searchTerm]);

    const handleCategoryClick = (category: string) => {
        const newSelectedCategory = selectedCategory === category ? null : category;
        setSelectedCategory(newSelectedCategory);
        setCurrentPage(1);
        setTimeout(() => {
            articlesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
        setCurrentPage(value);
        setTimeout(() => {
            articlesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleArticleClick = (articleId: string) => {
        navigate(`/articles/${articleId}`);
    };

    const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInput(event.target.value);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 8, pt: "30px" }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom>
                    Nos Articles Juridiques
                </Typography>
                <Typography variant="subtitle1" color="white">
                    Explorez notre base de connaissances et trouvez les informations dont vous avez besoin.
                </Typography>
            </Box>

            <Box sx={{ mb: 5 }}>
                <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
                    Parcourir par Catégories
                </Typography>
                {loadingCategories ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : categories.length > 0 ? (
                    <Paper elevation={2} sx={{ p: 2, backgroundColor: 'rgba(12, 30, 48, 0.5)' }}>
                        <Grid container spacing={1.5} justifyContent="center">
                            {categories.map((categoryName) => (
                                <Grid item key={categoryName}>
                                    <Chip
                                        label={categoryName}
                                        onClick={() => handleCategoryClick(categoryName)}
                                        color={selectedCategory === categoryName ? "primary" : "default"}
                                        clickable
                                        sx={{
                                            fontSize: '0.9rem',
                                            padding: '10px 10px',
                                            backgroundColor: selectedCategory === categoryName ? theme => theme.palette.primary.main : '#1a3652',
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: selectedCategory === categoryName ? theme => theme.palette.primary.dark : '#2c4e6f',
                                            },
                                        }}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                ) : (
                    <Typography textAlign="center" color="text.secondary">
                        Aucune catégorie disponible pour le moment.
                    </Typography>
                )}
            </Box>

            <Box id="all-articles-section" ref={articlesSectionRef} sx={{ minHeight: '50vh' }}>
                <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 1 }}>
                    {selectedCategory ? `Articles sur : ${selectedCategory}` : "Tous les Articles"}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, px: { xs: 0, sm: '20%' } }}>
                    <TextField
                        fullWidth
                        label="Rechercher des articles..."
                        variant="outlined"
                        value={searchInput}
                        onChange={handleSearchInputChange}
                        InputLabelProps={{
                            sx: {
                                color: '#a6b8cc',
                                '&.Mui-focused': {
                                    color: '#a6b8cc',
                                },
                            }
                        }}
                        sx={{
                            backgroundColor: 'rgba(26, 54, 82, 0.7)',
                            '& .MuiOutlinedInput-root': {
                                '& input': {
                                    color: 'white',
                                },
                                '& fieldset': {
                                    borderColor: '#3a5f82',
                                },
                                '&:hover fieldset': {
                                    borderColor: '#00fffc',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#00fffc',
                                },
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    {isProcessingSearch ? (
                                        <CircularProgress size={20} sx={{ color: '#00fffc' }} />
                                    ) : (
                                        <SearchIcon sx={{ color: '#a6b8cc' }} />
                                    )}
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
                {searchTerm && (
                    <Typography variant="subtitle1" textAlign="center" sx={{ mb: 2, fontStyle: 'italic' }}>
                        Résultats pour : "<strong>{searchTerm}</strong>"
                    </Typography>
                )}

                {loadingArticles ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                        <CircularProgress size={50} />
                    </Box>
                ) : articles.length > 0 ? (
                    <>
                        <Grid container spacing={3}>
                            {articles.map((article) => (
                                <Grid item xs={12} sm={6} md={4} key={article._id}>
                                    <Card sx={{
                                        bgcolor: "#0c1e2e",
                                        color: "white",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        border: "1px solid #1a3652",
                                        transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                                        '&:hover': {
                                            transform: 'translateY(-5px)',
                                            boxShadow: '0px 8px 15px rgba(0, 255, 252, 0.2)'
                                        }
                                    }}>
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography variant="h6" component="div" sx={{ color: "#00fffc", minHeight: '3.2em', mb: 1 }}>
                                                {article.title}
                                            </Typography>
                                            <Typography variant="body2" sx={{
                                                display: '-webkit-box',
                                                WebkitBoxOrient: 'vertical',
                                                WebkitLineClamp: 4,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                minHeight: '5.8em'
                                            }}>
                                                {article.content}
                                            </Typography>
                                        </CardContent>
                                        <CardActions sx={{ justifyContent: 'center', p: 2 }}>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    color: "#00fffc",
                                                    borderColor: "#00fffc",
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(0, 255, 252, 0.1)',
                                                        borderColor: "#00ddda"
                                                    }
                                                }}
                                                onClick={() => handleArticleClick(article._id)}
                                            >
                                                Lire la suite
                                            </Button>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                        {totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
                                <Pagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={handlePageChange}
                                    color="primary"
                                    sx={{
                                        '& .MuiPaginationItem-root': { color: 'white' },
                                        '& .MuiPaginationItem-icon': { color: '#00fffc' },
                                        '& .Mui-selected': {
                                            backgroundColor: 'rgba(0, 255, 252, 0.2) !important',
                                            color: '#00fffc !important',
                                        },
                                    }}
                                />
                            </Box>
                        )}
                    </>
                ) : (
                    <Typography textAlign="center" color="text.secondary" sx={{ mt: 5 }}>
                        Aucun article ne correspond à vos critères pour le moment.
                    </Typography>
                )}
            </Box>
        </Container>
    );
};

export default ArticlesPage;