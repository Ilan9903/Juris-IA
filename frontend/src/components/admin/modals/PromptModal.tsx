import { Box, Button, FormControl, InputLabel, MenuItem, Modal, Select, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminCreatePrompt, adminUpdatePrompt } from "../../../helpers/api-communicator";

const style = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', md: '70%' },
    maxWidth: '800px',
    bgcolor: '#0b1929',
    color: 'white',
    border: '1px solid grey.800',
    borderRadius: 3,
    boxShadow: 24,
    p: 4,
    outline: 'none',
};

interface Prompt {
    _id: string;
    name: string;
    description: string;
    content: string;
    category: string;
    status: 'draft' | 'published' | 'archived';
}

interface PromptModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    promptToEdit: Partial<Prompt> | null; // Utiliser Partial pour le mode création
}

const PromptModal = ({ open, onClose, onSuccess, promptToEdit }: PromptModalProps) => {
    const [formData, setFormData] = useState({ name: '', description: '', content: '', category: '', status: 'draft' });
    const isEditing = !!promptToEdit?._id;

    useEffect(() => {
        if (promptToEdit) {
            setFormData({
                name: promptToEdit.name || '',
                description: promptToEdit.description || '',
                content: promptToEdit.content || '',
                category: promptToEdit.category || '',
                status: promptToEdit.status || 'draft',
            });
        }
    }, [promptToEdit, open]);

    const handleChange = (e: any) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.content) {
            return toast.error("Le nom et le contenu du prompt sont requis.");
        }

        const toastId = toast.loading(isEditing ? "Mise à jour du prompt..." : "Création du prompt...");
        try {
            if (isEditing) {
                await adminUpdatePrompt(promptToEdit!._id!, formData);
            } else {
                await adminCreatePrompt(formData);
            }
            toast.success(isEditing ? "Prompt mis à jour !" : "Prompt créé !", { id: toastId });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Une erreur est survenue.", { id: toastId });
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style} component="form" onSubmit={handleSubmit}>
                <Typography variant="h6" component="h2" mb={3}>
                    {isEditing ? "Modifier le Prompt IA" : "Créer un Nouveau Prompt"}
                </Typography>
                <Stack spacing={2}>
                    <TextField label="Nom du Prompt (unique)" name="name" value={formData.name} onChange={handleChange} fullWidth required />
                    <TextField label="Description" name="description" value={formData.description} onChange={handleChange} fullWidth />
                    <TextField label="Catégorie" name="category" value={formData.category} onChange={handleChange} fullWidth />
                    <TextField label="Contenu du Prompt (les instructions pour l'IA)" name="content" value={formData.content} onChange={handleChange} fullWidth required multiline rows={8} />
                    <FormControl fullWidth>
                        <InputLabel>Statut</InputLabel>
                        <Select name="status" value={formData.status} label="Statut" onChange={handleChange}>
                            <MenuItem value="draft">Brouillon (draft)</MenuItem>
                            <MenuItem value="published">Publié (published)</MenuItem>
                            <MenuItem value="archived">Archivé (archived)</MenuItem>
                        </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                        <Button onClick={onClose} variant="outlined">Annuler</Button>
                        <Button type="submit" variant="contained">{isEditing ? "Enregistrer" : "Créer"}</Button>
                    </Box>
                </Stack>
            </Box>
        </Modal>
    );
};

export default PromptModal;