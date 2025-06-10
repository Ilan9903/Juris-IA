import { Box, Button, Modal, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminCreateArticle, adminUpdateArticle } from "../../../helpers/api-communicator";

const style = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: '80%', md: '60%' },
    maxWidth: '700px',
    bgcolor: '#0b1929',
    color: 'white',
    borderRadius: 3,
    boxShadow: 24,
    p: 4,
    outline: 'none',
};

interface Article {
    _id: string;
    title: string;
    content: string;
    category: string[];
}

interface ArticleModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void; // Pour rafraîchir la liste après une action
    articleToEdit: Article | null;
}

const ArticleModal = ({ open, onClose, onSuccess, articleToEdit }: ArticleModalProps) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [categories, setCategories] = useState(''); // Géré comme une chaîne de caractères séparée par des virgules

    const isEditing = !!articleToEdit;

    useEffect(() => {
        if (articleToEdit) {
            setTitle(articleToEdit.title);
            setContent(articleToEdit.content);
            setCategories(articleToEdit.category.join(', '));
        } else {
            // Réinitialiser pour la création
            setTitle('');
            setContent('');
            setCategories('');
        }
    }, [articleToEdit, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) {
            return toast.error("Le titre et le contenu sont requis.");
        }

        const articleData = {
            title,
            content,
            // Transformer la chaîne de catégories en tableau de chaînes
            category: categories.split(',').map(cat => cat.trim()).filter(cat => cat),
        };

        const toastId = toast.loading(isEditing ? "Mise à jour de l'article..." : "Création de l'article...");
        try {
            if (isEditing) {
                await adminUpdateArticle(articleToEdit._id, articleData);
            } else {
                await adminCreateArticle(articleData);
            }
            toast.success(isEditing ? "Article mis à jour !" : "Article créé !", { id: toastId });
            onSuccess(); // Rafraîchir la liste
            onClose(); // Fermer la modale
        } catch (error) {
            console.error(error);
            toast.error("Une erreur est survenue.", { id: toastId });
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style} component="form" onSubmit={handleSubmit}>
                <Typography variant="h6" component="h2" mb={3}>
                    {isEditing ? "Modifier l'Article" : "Créer un Nouvel Article"}
                </Typography>
                <Stack spacing={2}>
                    <TextField
                        label="Titre de l'article"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        fullWidth
                        required
                        InputProps={{ style: { color: "white" } }}
                        InputLabelProps={{ style: { color: "white" } }}
                    />
                    <TextField
                        label="Contenu de l'article"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        fullWidth
                        required
                        multiline // Pour un champ de texte plus grand
                        rows={10}
                        InputProps={{ style: { color: "white" } }}
                        InputLabelProps={{ style: { color: "white" } }}
                    />
                    <TextField
                        label="Catégories (séparées par des virgules)"
                        value={categories}
                        onChange={(e) => setCategories(e.target.value)}
                        fullWidth
                        helperText="Ex: Droit du travail, Contrat, RGPD"
                        InputProps={{ style: { color: "white" } }}
                        InputLabelProps={{ style: { color: "white" } }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                        <Button onClick={onClose} variant="outlined">Annuler</Button>
                        <Button type="submit" variant="contained">{isEditing ? "Enregistrer" : "Créer"}</Button>
                    </Box>
                </Stack>
            </Box>
        </Modal>
    );
};

export default ArticleModal;