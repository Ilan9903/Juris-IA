export interface User {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
    status?: "online" | "idle" | "offline";
    role?: "user" | "redacteur" | "admin"; // ✅ AJOUT ICI
}
