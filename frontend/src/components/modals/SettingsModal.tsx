// frontend_src/components/modals/SettingsModal.tsx
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Divider, IconButton, Modal, Stack, Switch, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useUI } from "../../context/UIContext";
import { deleteCurrentUserAccount } from '../../helpers/api-communicator';

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
};

const SettingsModal = () => {

    const { isSettingsModalOpen, closeSettingsModal, navigateToProfile } = useUI();

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [passwordForDelete, setPasswordForDelete] = useState("");

    // Réinitialiser l'état interne de la modale quand elle se ferme
    useEffect(() => {
        if (!isSettingsModalOpen) {
            setShowDeleteConfirm(false);
            setPasswordForDelete("");
        }
    }, [isSettingsModalOpen]);

    const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log("Thème sombre activé:", event.target.checked);
        // Logique future pour le changement de thème
    };

    // Gère la suppression du compte après confirmation du mot de passe
    const handleAccountDeleteConfirm = async () => {
        if (!passwordForDelete) {
            return toast.error("Veuillez entrer votre mot de passe.");
        }
        const toastId = toast.loading("Vérification et suppression...");
        try {
            // Étape 1: Vérifier le mot de passe
            await axios.post("/user/verify-password", { password: passwordForDelete });

            // Étape 2: Si le mot de passe est bon, supprimer le compte
            await deleteCurrentUserAccount();

            toast.success("Votre compte a été supprimé. Vous allez être redirigé.", {
                id: toastId,
                duration: 4000 // Laisser le temps à l'utilisateur de lire le message
            });

            setTimeout(() => {
                window.location.href = "/"; // Redirige vers la page d'accueil
            }, 1500); // Délai de 1.5 secondes

        } catch (error: any) {
            console.error("Erreur lors de la suppression du compte", error);
            const errorMessage = error.response?.data?.message || "Mot de passe incorrect ou erreur serveur.";
            toast.error(errorMessage, { id: toastId });
        }
    };

    return (
        <Modal open={isSettingsModalOpen} onClose={closeSettingsModal}>
            <Box sx={style}>
                {/* En-tête de la modale */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography id="settings-modal-title" variant="h6" component="h2">
                        {showDeleteConfirm ? "Confirmer la Suppression" : "Paramètres ⚙️"}
                    </Typography>
                    <IconButton onClick={closeSettingsModal} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Contenu conditionnel */}
                {showDeleteConfirm ? (
                    // VUE DE CONFIRMATION POUR LA SUPPRESSION
                    <Stack spacing={2}>
                        <Typography color="error.main">
                            Cette action est irréversible. Pour confirmer la suppression définitive de votre compte, veuillez entrer votre mot de passe.
                        </Typography>
                        <TextField
                            fullWidth
                            autoFocus
                            label="Mot de passe"
                            type="password"
                            value={passwordForDelete}
                            onChange={(e) => setPasswordForDelete(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAccountDeleteConfirm(); }}
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
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                            <Button variant="outlined" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
                            <Button variant="contained" color="error" onClick={handleAccountDeleteConfirm}>
                                Supprimer Définitivement
                            </Button>
                        </Box>
                    </Stack>
                ) : (
                    // VUE PRINCIPALE DES PARAMÈTRES
                    <Stack spacing={2.5} divider={<Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />}>

                        <Box>
                            <Typography variant="overline" sx={{ color: 'grey.500' }}>Compte</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                <Typography>Modifier le profil</Typography>
                                <Button size="small" variant="outlined" onClick={navigateToProfile} sx={{ color: 'white', borderColor: 'grey.700' }}>Modifier</Button>
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="overline" sx={{ color: 'grey.500' }}>Apparence</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                <Typography>Thème sombre</Typography>
                                <Switch defaultChecked onChange={handleThemeChange} />
                            </Box>
                        </Box>

                        <Box>
                            <Typography variant="overline" sx={{ color: 'grey.500' }}>Données</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                <Typography>Exporter les conversations</Typography>
                                <Button size="small" variant="outlined" sx={{ color: 'white', borderColor: 'grey.700' }}>Exporter</Button>
                            </Box>
                        </Box>

                        <Box sx={{ mt: 2, p: 2, border: '1px solid rgba(255, 82, 82, 0.5)', borderRadius: '8px' }}>
                            <Typography variant="overline" color="error">Zone de Danger</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                <Typography>Supprimer mon compte</Typography>
                                <Button size="small" variant="contained" color="error" onClick={() => setShowDeleteConfirm(true)}>
                                    Supprimer
                                </Button>
                            </Box>
                            <Typography variant="caption" sx={{ color: 'grey.500', display: 'block', mt: 1 }}>
                                Cette action est irréversible. <br></br> Toutes vos données seront définitivement perdues.
                            </Typography>
                        </Box>
                    </Stack>
                )}
            </Box>
        </Modal>
    );
};

export default SettingsModal;