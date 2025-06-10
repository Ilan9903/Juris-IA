import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { Box, Button, Chip, CircularProgress, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminGetAllPrompts } from "../../helpers/api-communicator";

interface Prompt {
    _id: string;
    name: string;
    description: string;
    status: 'draft' | 'published' | 'archived';
    updatedAt: string;
}

const PromptManagement = () => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrompts = async () => {
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
        };
        fetchPrompts();
    }, []);

    const getStatusChipColor = (status: 'draft' | 'published' | 'archived') => {
        switch (status) {
            case 'published':
                return 'success';
            case 'draft':
                return 'warning';
            case 'archived':
                return 'default';
            default:
                return 'default';
        }
    }

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Gestion des Prompts IA
                </Typography>
                <Button variant="contained" startIcon={<PsychologyIcon />}>
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
                                        <IconButton onClick={() => console.log('Edit prompt:', prompt._id)}>
                                            <EditIcon sx={{ color: 'grey.500', '&:hover': { color: 'white' } }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Supprimer">
                                        <IconButton onClick={() => console.log('Delete prompt:', prompt._id)}>
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

export default PromptManagement;