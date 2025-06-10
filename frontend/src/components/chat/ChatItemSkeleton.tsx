// frontend_src/components/chat/ChatItemSkeleton.tsx
import { Box, Paper, Skeleton, Stack } from '@mui/material';

const ChatItemSkeleton = ({ role }: { role: 'user' | 'assistant' }) => {
    const isUser = role === 'user';

    return (
        <Box
            sx={{
                display: 'flex',
                p: 0,
                flexDirection: isUser ? 'row-reverse' : 'row',
                mb: 2,
                alignItems: 'flex-end',
                width: '100%',
            }}
        >
            {/* Squelette pour l'avatar */}
            <Skeleton
                variant="circular"
                sx={{
                    width: 36,
                    height: 36,
                    ml: isUser ? 1.5 : 0,
                    mr: isUser ? 0 : 1.5,
                    alignSelf: 'flex-end',
                }}
            />

            {/* Squelette pour la bulle de message */}
            <Paper
                sx={{
                    py: '10px',
                    px: '14px',
                    bgcolor: 'rgb(28, 40, 51)', // Une couleur sombre neutre
                    opacity: 0.5,
                    borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    maxWidth: '75%',
                    display: 'inline-block',
                }}
            >
                <Stack spacing={1}>
                    {/* Squelettes pour les lignes de texte */}
                    <Skeleton variant="text" sx={{ fontSize: '1rem', width: '80px', bgcolor: 'grey.700' }} />
                    <Skeleton variant="text" sx={{ fontSize: '1rem', width: '150px', bgcolor: 'grey.700' }} />
                </Stack>
            </Paper>
        </Box>
    );
};

export default ChatItemSkeleton;