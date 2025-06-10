import { Box, Button, FormControl, InputLabel, MenuItem, Modal, Select, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminUpdateUser } from "../../../helpers/api-communicator";

const style = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 400 },
    bgcolor: '#0b1929',
    color: 'white',
    borderRadius: 3,
    boxShadow: 24,
    p: 4,
    outline: 'none',
};

interface AdminUser {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'redacteur' | 'admin';
}

interface EditUserModalProps {
    open: boolean;
    onClose: () => void;
    onUserUpdated: () => void; // Pour rafraîchir la liste après modification
    user: AdminUser | null;
}

const EditUserModal = ({ open, onClose, onUserUpdated, user }: EditUserModalProps) => {
    const [formData, setFormData] = useState({ name: '', email: '', role: 'user' });

    useEffect(() => {
        // Pré-remplir le formulaire quand un utilisateur est sélectionné
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                role: user.role,
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: unknown } }) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const toastId = toast.loading("Mise à jour de l'utilisateur...");
        try {
            await adminUpdateUser(user._id, formData);
            toast.success("Utilisateur mis à jour avec succès !", { id: toastId });
            onUserUpdated(); // Appelle la fonction de rafraîchissement
            onClose(); // Ferme la modale
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la mise à jour.", { id: toastId });
        }
    };

    if (!user) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style} component="form" onSubmit={handleSubmit}>
                <Typography variant="h6" component="h2" mb={3}>
                    Modifier l'Utilisateur
                </Typography>
                <Stack spacing={2}>
                    <TextField
                        label="Nom"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        fullWidth
                        InputProps={{ style: { color: "white" } }}
                        InputLabelProps={{ style: { color: "white" } }}
                        sx={{
                            "& .MuiInputBase-input": {
                                backgroundColor: "transparent", // Fond de l'input
                                borderRadius: 1,
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "white",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "white",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                borderColor: "white",
                            },
                        }}
                    />
                    <TextField
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        fullWidth
                        InputProps={{ style: { color: "white" } }}
                        InputLabelProps={{ style: { color: "white" } }}
                        sx={{
                            "& .MuiInputBase-input": {
                                backgroundColor: "transparent", // Fond de l'input
                                borderRadius: 1,
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "white",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "white",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                borderColor: "white",
                            },
                        }}
                    />
                    <FormControl fullWidth sx={{
                        bgcolor: "transparent",
                    }}>
                        <InputLabel>Rôle</InputLabel>
                        <Select
                            name="role"
                            value={formData.role}
                            label="Rôle"
                            onChange={handleChange}
                            sx={{
                                backgroundColor: "transparent",
                                color: "white",
                                ".MuiSelect-icon": { color: "white" },
                                ".MuiOutlinedInput-notchedOutline": { color: "white", borderColor: "white" },
                                "&:hover .MuiOutlinedInput-notchedOutline": { color: "white", borderColor: "white" },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { color: "white", borderColor: "white" },
                            }}
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        backgroundColor: "rgb(17,29,39)",
                                        color: "white",
                                    },
                                },
                            }}
                        >
                            <MenuItem value="user">user</MenuItem>
                            <MenuItem value="redacteur">redacteur</MenuItem>
                            <MenuItem value="admin">admin</MenuItem>

                        </Select>
                    </FormControl>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
                        <Button onClick={onClose} variant="outlined">Annuler</Button>
                        <Button type="submit" variant="contained">Enregistrer</Button>
                    </Box>
                </Stack>
            </Box>
        </Modal>
    );
};

export default EditUserModal;