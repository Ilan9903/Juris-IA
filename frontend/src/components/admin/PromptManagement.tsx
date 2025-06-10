import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { Box, Button, Chip, CircularProgress, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminDeletePrompt, adminGetAllPrompts } from "../../helpers/api-communicator";
import ConfirmationModal from "../modals/ConfirmationModal";
import PromptModal from '././modals/PromptModal';

interface Prompt {
    _id: string;
    name: string;
    description: string;
    content: string;
    category: string;
    status: 'draft' | 'published' | 'archived';
    updatedAt: string;
}

const PromptManagement = () => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);

    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [promptToEdit, setPromptToEdit] = useState<Partial<Prompt> | null>(null);
    const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);

    const fetchPrompts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminGetAllPrompts();
            setPrompts(data.prompts);
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la récupération des prompts.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPrompts();
    }, [fetchPrompts]);

    const handleOpenCreateModal = () => {
        setPromptToEdit({}); // Ouvre en mode création avec un objet vide
        setIsPromptModalOpen(true);
    };

    const handleOpenEditModal = (prompt: Prompt) => {
        setPromptToEdit(prompt);
        setIsPromptModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!promptToDelete) return;
        try {
            await adminDeletePrompt(promptToDelete._id);
            toast.success(`Le prompt "${promptToDelete.name}" a été supprimé.`);
            setPrompts(prev => prev.filter(p => p._id !== promptToDelete._id));
        } catch (error) {
            toast.error("Erreur lors de la suppression.");
        } finally {
            setPromptToDelete(null); // Ferme la modale de confirmation
        }
    };

    const getStatusChipColor = (status: 'draft' | 'published' | 'archived') => {
        if (status === 'published') return 'success';
        if (status === 'draft') return 'warning';
        return 'default';
    }

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Gestion des Prompts IA ({prompts.length})
                </Typography>
                <Button variant="contained" startIcon={<PsychologyIcon />} onClick={handleOpenCreateModal}>
                    Nouveau Prompt
                </Button>
            </Box>
            <TableContainer component={Paper} sx={{ bgcolor: 'rgb(23, 35, 49)' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nom</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Description</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Statut</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Dernière MàJ</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {prompts.map((prompt) => (
                            <TableRow key={prompt._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>{prompt.name}</TableCell>
                                <TableCell sx={{ color: 'white', maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {prompt.description}
                                </TableCell>
                                <TableCell>
                                    <Chip label={prompt.status} color={getStatusChipColor(prompt.status)} size="small" />
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>{new Date(prompt.updatedAt).toLocaleDateString()}</TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Modifier">
                                        <IconButton onClick={() => handleOpenEditModal(prompt)}>
                                            <EditIcon sx={{ color: 'grey.500', '&:hover': { color: 'white' } }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Supprimer">
                                        <IconButton onClick={() => setPromptToDelete(prompt)}>
                                            <DeleteIcon sx={{ color: 'grey.500', '&:hover': { color: 'red' } }} />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <ConfirmationModal
                open={!!promptToDelete}
                onClose={() => setPromptToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirmer la Suppression"
                message={`Voulez-vous vraiment supprimer le prompt "${promptToDelete?.name}" ?`}
            />
            <PromptModal
                open={isPromptModalOpen}
                onClose={() => setIsPromptModalOpen(false)}
                onSuccess={fetchPrompts}
                promptToEdit={promptToEdit}
            />
        </Box>
    );
};

export default PromptManagement;