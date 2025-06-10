import { createContext } from "react";

// Type User (peut rester ici si tu veux, ou le bouger ailleurs pour les types globaux)
type User = {
    name: string;
    email: string;
    profileImage?: string;
    status?: "online" | "idle" | "offline";
    role?: "user" | "redacteur" | "admin"; // Rôle de l'utilisateur
};

// Exportation du type UserAuth
export type UserAuth = {
    isLoggedIn: boolean;
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (updatedUser: User) => void;
    setActivityStatus: (status: "online" | "idle" | "offline") => void;
};

// Exportation du contexte
export const AuthContext = createContext<UserAuth>({} as UserAuth);