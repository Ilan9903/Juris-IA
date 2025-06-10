// frontend_src/components/modals/ConfirmationModal.tsx
import { Box, Button, Modal, Stack, Typography } from "@mui/material";

// Style de la modale, simple et centré
const style = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', sm: 400 },
    bgcolor: '#0b1929',
    color: 'white',
    border: '1px solid grey.800',
    borderRadius: 3,
    boxShadow: 24,
    p: 4,
    outline: 'none',
};

// Props que la modale accepte
interface ConfirmationModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmationModal = ({ open, onClose, onConfirm, title, message }: ConfirmationModalProps) => {
    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="confirmation-modal-title"
            aria-describedby="confirmation-modal-description"
        >
            <Box sx={style}>
                <Typography id="confirmation-modal-title" variant="h6" component="h2">
                    {title}
                </Typography>
                <Typography id="confirmation-modal-description" sx={{ mt: 2, color: 'grey.300' }}>
                    {message}
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
                    <Button variant="outlined" onClick={onClose} sx={{ color: 'white', borderColor: 'grey.700' }}>
                        Annuler
                    </Button>
                    <Button variant="contained" color="error" onClick={onConfirm} autoFocus>
                        Confirmer
                    </Button>
                </Stack>
            </Box>
        </Modal>
    );
};

export default ConfirmationModal;