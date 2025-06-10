// frontend_src/components/modals/SettingsModal.tsx
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Divider, IconButton, Modal, Stack, Switch, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useUI } from "../../context/UIContext";
import { changeUserPassword, deleteCurrentUserAccount } from '../../helpers/api-communicator';

// Style de la modale, inspiré de ProfilModal pour la cohérence
const style = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 500 },
    bgcolor: '#0b1929',
    color: 'white',
    borderRadius: 3,
    boxShadow: 24,
    p: { xs: 2, sm: 3, md: 4 },
    outline: 'none',
    maxHeight: '90vh',
    overflowY: 'auto'
};

const SettingsModal = () => {
    // Obtenir l'état et les fonctions depuis le contexte UI
    const { isSettingsModalOpen, closeSettingsModal, navigateToProfile, isCompactMode, toggleCompactMode } = useUI();

    // État pour gérer la vue actuelle de la modale ('main', 'changePassword', 'deleteConfirm')
    const [view, setView] = useState("main");

    // États pour les différents formulaires
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [passwordForDelete, setPasswordForDelete] = useState("");

    // Réinitialiser les états internes quand la modale se ferme
    useEffect(() => {
        if (!isSettingsModalOpen) {
            setTimeout(() => { // Petit délai pour laisser l'animation de fermeture se faire
                setView("main");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmNewPassword("");
                setPasswordForDelete("");
            }, 200);
        }
    }, [isSettingsModalOpen]);

    // Soumission du formulaire de changement de mot de passe
    const handleChangePasswordSubmit = async () => {
        if (!currentPassword || !newPassword) {
            return toast.error("Veuillez remplir tous les champs.");
        }
        if (newPassword !== confirmNewPassword) {
            return toast.error("Les nouveaux mots de passe ne correspondent pas.");
        }
        const toastId = toast.loading("Mise à jour du mot de passe...");
        try {
            await changeUserPassword(currentPassword, newPassword);
            toast.success("Mot de passe mis à jour avec succès !", { id: toastId });
            setView("main"); // Revenir à la vue principale
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Erreur lors de la mise à jour.";
            toast.error(errorMessage, { id: toastId });
        }
    };

    // Soumission du formulaire de suppression de compte
    const handleAccountDeleteConfirm = async () => {
        if (!passwordForDelete) {
            return toast.error("Veuillez entrer votre mot de passe.");
        }
        const toastId = toast.loading("Vérification et suppression...");
        try {
            await axios.post("/user/verify-password", { password: passwordForDelete });
            await deleteCurrentUserAccount();
            toast.success("Votre compte a été supprimé. Vous allez être redirigé.", { id: toastId, duration: 4000 });
            setTimeout(() => {
                window.location.href = "/";
            }, 1500);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Mot de passe incorrect ou erreur serveur.";
            toast.error(errorMessage, { id: toastId });
        }
    };

    // Fonction pour rendre le contenu de la modale en fonction de la vue
    const renderContent = () => {
        switch (view) {
            case 'changePassword':
                return (
                    <Stack spacing={3}>
                        <TextField fullWidth autoFocus label="Ancien mot de passe" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} InputProps={{ style: { color: "white" } }} InputLabelProps={{ style: { color: "white" } }} sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "white" } }} />
                        <TextField fullWidth label="Nouveau mot de passe" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} InputProps={{ style: { color: "white" } }} InputLabelProps={{ style: { color: "white" } }} sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "white" } }} />
                        <TextField fullWidth label="Confirmer le nouveau mot de passe" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleChangePasswordSubmit(); }} InputProps={{ style: { color: "white" } }} InputLabelProps={{ style: { color: "white" } }} sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "white" } }} />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                            <Button variant="outlined" onClick={() => setView('main')}>Annuler</Button>
                            <Button variant="contained" onClick={handleChangePasswordSubmit} sx={{ bgcolor: '#00fffc', color: 'black', '&:hover': { bgcolor: 'white' } }}>Enregistrer</Button>
                        </Box>
                    </Stack>
                );
            case 'deleteConfirm':
                return (
                    <Stack spacing={2}>
                        <Typography color="error.main">Cette action est irréversible. Pour confirmer, veuillez entrer votre mot de passe.</Typography>
                        <TextField fullWidth autoFocus label="Mot de passe" type="password" value={passwordForDelete} onChange={(e) => setPasswordForDelete(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAccountDeleteConfirm(); }} InputProps={{ style: { color: "white" } }} InputLabelProps={{ style: { color: "white" } }} sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "grey.700" } }} />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                            <Button variant="outlined" onClick={() => setView('main')}>Annuler</Button>
                            <Button variant="contained" color="error" onClick={handleAccountDeleteConfirm}>Supprimer Définitivement</Button>
                        </Box>
                    </Stack>
                );
            case 'main':
            default:
                return (
                    <Stack spacing={2.5} divider={<Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />}>
                        <Box>
                            <Typography variant="overline" sx={{ color: 'grey.500' }}>Compte</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                <Typography>Modifier le profil</Typography>
                                <Button size="small" variant="outlined" onClick={navigateToProfile} sx={{ color: 'white', borderColor: 'grey.700' }}>Modifier</Button>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                <Typography>Changer le mot de passe</Typography>
                                <Button size="small" variant="outlined" onClick={() => setView('changePassword')} sx={{ color: 'white', borderColor: 'grey.700' }}>Changer</Button>
                            </Box>
                        </Box>
                        <Box>
                            <Typography variant="overline" sx={{ color: 'grey.500' }}>Apparence</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                <Typography>Mode Compact</Typography>
                                <Switch checked={isCompactMode} onChange={toggleCompactMode} sx={{ color: '#03a3c2' }} />
                            </Box>
                        </Box>
                        <Box sx={{ mt: 2, p: 2, border: '1px solid rgba(255, 82, 82, 0.5)', borderRadius: '8px' }}>
                            <Typography variant="overline" color="error">Zone de Danger</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                <Typography>Supprimer mon compte</Typography>
                                <Button size="small" variant="contained" color="error" onClick={() => setView('deleteConfirm')}>Supprimer</Button>
                            </Box>
                            <Typography variant="caption" sx={{ color: 'grey.500', display: 'block', mt: 1 }}>
                                Cette action est irréversible. <br></br>Toutes vos données seront définitivement perdues.
                            </Typography>
                        </Box>
                    </Stack>
                );
        }
    };

    return (
        <Modal open={isSettingsModalOpen} onClose={closeSettingsModal}>
            <Box sx={style}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" component="h2">
                        {view === 'main' && 'Paramètres'}
                        {view === 'changePassword' && 'Changer le mot de passe'}
                        {view === 'deleteConfirm' && 'Confirmer la Suppression'}
                    </Typography>
                    <IconButton onClick={closeSettingsModal} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                {renderContent()}
            </Box>
        </Modal>
    );
};

export default SettingsModal;