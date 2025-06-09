// frontend_src/components/modals/SettingsModal.tsx
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Divider, IconButton, Modal, Stack, Switch, Typography } from "@mui/material";

// Style de la modale (inchangé)
const style = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 500 },
    bgcolor: '#0b1929', // Un fond légèrement différent pour se démarquer
    color: 'white',
    borderRadius: 3,
    boxShadow: 24,
    p: { xs: 2, sm: 3, md: 4 },
    outline: 'none',
};

interface SettingsModalProps {
    open: boolean;
    handleClose: () => void;
}

const SettingsModal = ({ open, handleClose }: SettingsModalProps) => {
    // Logique factice pour le switch de thème
    const handleThemeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log("Thème sombre activé:", event.target.checked);
        // Ici, vous implémenteriez la logique de changement de thème avec votre Contexte de Thème
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="settings-modal-title"
        >
            <Box sx={style}>
                {/* En-tête de la modale */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography id="settings-modal-title" variant="h6" component="h2">
                        Paramètres
                    </Typography>
                    <IconButton onClick={handleClose} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Contenu de la modale organisé avec Stack */}
                <Stack spacing={2} divider={<Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />}>

                    {/* Section Compte */}
                    <Box>
                        <Typography variant="overline" sx={{ color: 'grey.500' }}>Compte</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography>Changer le mot de passe</Typography>
                            <Button size="small" variant="outlined" sx={{ color: 'white', borderColor: 'grey.700' }}>Changer</Button>
                        </Box>
                    </Box>

                    {/* Section Apparence */}
                    <Box>
                        <Typography variant="overline" sx={{ color: 'grey.500' }}>Apparence</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography>Thème sombre</Typography>
                            <Switch defaultChecked onChange={handleThemeChange} />
                        </Box>
                    </Box>

                    {/* Section Données */}
                    <Box>
                        <Typography variant="overline" sx={{ color: 'grey.500' }}>Données</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography>Exporter toutes les conversations</Typography>
                            <Button size="small" variant="outlined" sx={{ color: 'white', borderColor: 'grey.700' }}>Exporter</Button>
                        </Box>
                    </Box>

                    {/* Zone de Danger */}
                    <Box sx={{ mt: 2, p: 2, border: '1px solid rgba(255, 82, 82, 0.5)', borderRadius: '8px' }}>
                        <Typography variant="overline" color="error">Zone de Danger</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography>Supprimer le compte</Typography>
                            <Button size="small" variant="contained" color="error">Supprimer</Button>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'grey.500', display: 'block', mt: 1 }}>
                            Cette action est irréversible. Toutes vos données seront définitivement perdues.
                        </Typography>
                    </Box>

                </Stack>
            </Box>
        </Modal>
    );
};

export default SettingsModal;