// frontend_src/components/admin/UserManagement.tsx
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminGetAllUsers } from "../../helpers/api-communicator";

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

    useEffect(() => {
        const fetchUsers = async () => {
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
        };
        fetchUsers();
    }, []);

    if (loading) {
        return <div>Chargement de la liste des utilisateurs...</div>;
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
                                        <IconButton onClick={() => console.log('Edit user:', user._id)}>
                                            <EditIcon sx={{ color: 'grey.500' }} />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Supprimer">
                                        <IconButton onClick={() => console.log('Delete user:', user._id)}>
                                            <DeleteIcon sx={{ color: 'red' }} />
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

export default UserManagement;