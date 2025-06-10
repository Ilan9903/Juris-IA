// frontend_src/pages/admin/AdminDashboard.tsx
import ArticleIcon from '@mui/icons-material/Article';
import PeopleIcon from '@mui/icons-material/People';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper } from "@mui/material";
import { NavLink, Outlet } from "react-router-dom";

const adminMenuItems = [
    { text: 'Utilisateurs', icon: <PeopleIcon />, path: 'users' },
    { text: 'Articles', icon: <ArticleIcon />, path: 'articles' },
    { text: 'Prompts IA', icon: <PsychologyIcon />, path: 'prompts' },
];

const AdminDashboard = () => {
    return (
        <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
            {/* Menu de navigation latéral */}
            <Paper elevation={3} sx={{ width: 240, flexShrink: 0, bgcolor: 'rgb(17,29,39)' }}>
                <List>
                    {adminMenuItems.map((item) => (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                component={NavLink}
                                to={item.path}
                                // Le style de l'élément actif est géré par NavLink
                                sx={{
                                    '&.active': {
                                        bgcolor: 'rgba(0, 255, 252, 0.1)',
                                        borderRight: '3px solid #00fffc',
                                        color: '#00fffc',
                                    },
                                    '&.active .MuiListItemIcon-root': {
                                        color: '#00fffc',
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Paper>

            {/* Zone de contenu principale */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
                <Outlet /> {/* Affiche le composant de la sous-route active */}
            </Box>
        </Box>
    );
};

export default AdminDashboard;