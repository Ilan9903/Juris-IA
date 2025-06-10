// frontend_src/components/admin/UserManagement.tsx
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, CircularProgress, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminDeleteUser, adminGetAllUsers } from "../../helpers/api-communicator";
import ConfirmationModal from '../modals/ConfirmationModal'; // Importer la modale de confirmation
import EditUserModal from '././modals/EditUserModal';

// Définir un type pour l'utilisateur admin, plus complet
interface AdminUser {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'redacteur' | 'admin';
    createdAt: string;
}

const UserManagement = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

    const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
    const [userToEdit, setUserToEdit] = useState<AdminUser | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminGetAllUsers();
            setUsers(data.users);
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la récupération des utilisateurs.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Logique pour la suppression
    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await adminDeleteUser(userToDelete._id);
            toast.success(`L'utilisateur ${userToDelete.name} a été supprimé.`);
            setUsers(prev => prev.filter(user => user._id !== userToDelete._id)); // Mettre à jour la liste
        } catch (error) {
            toast.error("Erreur lors de la suppression.");
        } finally {
            setUserToDelete(null); // Fermer la modale
        }
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Box>
            <Typography variant="h4" component="h1" gutterBottom>
                Gestion des Utilisateurs
            </Typography>
            <TableContainer component={Paper} sx={{ bgcolor: 'rgb(23, 35, 49)' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nom</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Rôle</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Inscrit le</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user._id}>
                                <TableCell sx={{ color: 'white' }}>{user.name}</TableCell>
                                <TableCell sx={{ color: 'white' }}>{user.email}</TableCell>
                                <TableCell sx={{ color: 'white' }}>{user.role}</TableCell>
                                <TableCell sx={{ color: 'white' }}>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Modifier">
                                        <IconButton onClick={() => setUserToEdit(user)}>
                                            <EditIcon sx={{ color: 'grey.500', '&:hover': { color: 'white' } }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Supprimer">
                                        <IconButton onClick={() => setUserToDelete(user)}>
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
                open={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirmer la Suppression"
                message={`Voulez-vous vraiment supprimer l'utilisateur ${userToDelete?.name} ? Cette action est irréversible.`}
            />
            <EditUserModal
                open={!!userToEdit}
                onClose={() => setUserToEdit(null)}
                onUserUpdated={fetchUsers} // Rafraîchir la liste après une mise à jour
                user={userToEdit}
            />
        </Box>
    );
};

export default UserManagement;