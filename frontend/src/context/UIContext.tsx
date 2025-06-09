// frontend_src/context/UIContext.tsx
import { createContext, ReactNode, useContext, useState } from 'react';

// Définir la structure de notre contexte
interface UIContextType {
    isProfileModalOpen: boolean;
    isSettingsModalOpen: boolean;
    isCompactMode: boolean; // NOUVEAU
    openProfileModal: () => void;
    closeProfileModal: () => void;
    openSettingsModal: () => void;
    closeSettingsModal: () => void;
    navigateToSettings: () => void;
    navigateToProfile: () => void;
    toggleCompactMode: () => void; // NOUVEAU
}

// Créer le contexte
const UIContext = createContext<UIContextType | undefined>(undefined);

// Créer le fournisseur (Provider) qui englobera l'application
export const UIProvider = ({ children }: { children: ReactNode }) => {
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [isCompactMode, setCompactMode] = useState(false); // NOUVEAU état

    const openProfileModal = () => setProfileModalOpen(true);
    const closeProfileModal = () => setProfileModalOpen(false);

    const openSettingsModal = () => setSettingsModalOpen(true);
    const closeSettingsModal = () => setSettingsModalOpen(false);

    // Fonction pour naviguer du profil aux paramètres
    const navigateToSettings = () => {
        closeProfileModal();
        // On utilise un petit délai pour que la transition soit plus fluide
        setTimeout(() => openSettingsModal(), 200);
    };

    // Fonction pour naviguer des paramètres au profil
    const navigateToProfile = () => {
        closeSettingsModal();
        setTimeout(() => openProfileModal(), 200);
    };

    // NOUVELLE fonction pour basculer le mode compact
    const toggleCompactMode = () => setCompactMode(prev => !prev);

    const value = {
        isProfileModalOpen,
        isSettingsModalOpen,
        isCompactMode, // Exposer l'état
        openProfileModal,
        closeProfileModal,
        openSettingsModal,
        closeSettingsModal,
        navigateToSettings,
        navigateToProfile,
        toggleCompactMode, // Exposer la fonction
    };

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

// Créer le hook personnalisé pour utiliser facilement le contexte
export const useUI = (): UIContextType => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};