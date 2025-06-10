// src/routes/admin-routes.ts

import { Request, Router } from "express";
import multer from "multer";
import {
    adminGetAllArticles,
    // prompt templates management
    createPromptTemplate,
    // user management
    createUserByAdmin,
    deletePromptTemplate,
    deleteUser,
    getAllPromptTemplates,
    getAllUsers,
    getPromptTemplateById,
    getUserById,
    updatePromptTemplate,
    updateUserByAdmin,
} from "../controllers/admin-controller.js";
import { checkPermission } from "../utils/checkRole.js"; // <-- IMPORTE checkPermission
import { verifyToken } from "../utils/token-manager.js";

const upload = multer({ dest: 'uploads/' });

// Interface locale pour étendre Request avec la propriété 'user'
interface AdminRequest extends Request {
    user?: {
        _id: string;
        name: string;
        email: string;
        role: "user" | "admin" | "redacteur";
        permissions?: string[]; // Ajoute les permissions ici aussi pour la cohérence
    };
}

const adminRoutes = Router();

// Exemple pour la route /auth-status
// Cette route nécessite la permission de voir le tableau de bord admin, par exemple
adminRoutes.get("/auth-status", verifyToken, checkPermission(["CAN_VIEW_ADMIN_DASHBOARD"]), (req: AdminRequest, res) => {
    const user = req.user;

    if (!user || !user.permissions || !user.permissions.includes("CAN_VIEW_ADMIN_DASHBOARD")) { // Tu peux laisser cette vérification ou la supprimer si checkPermission est suffisant
        return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    res.status(200).json({
        success: true,
        message: "Admin authentifié",
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions, // Envoie les permissions au frontend
        },
    });
});

// Exemple pour la route /dashboard
// Cette route nécessite la permission de voir le tableau de bord admin
adminRoutes.get("/dashboard", verifyToken, checkPermission(["CAN_VIEW_ADMIN_DASHBOARD"]), (req, res) => {
    res.json({ message: "Bienvenue sur le tableau de bord admin !" });
});

// --- ROUTES DE GESTION DES UTILISATEURS ---
adminRoutes.get("/users", verifyToken, checkPermission(["CAN_MANAGE_USERS"]), getAllUsers);
adminRoutes.post("/user", verifyToken, checkPermission(["CAN_MANAGE_USERS"]), createUserByAdmin);
adminRoutes.get("/user/:id", verifyToken, checkPermission(["CAN_MANAGE_USERS"]), getUserById);
adminRoutes.put("/user/:id", verifyToken, checkPermission(["CAN_MANAGE_USERS"]), upload.single('image'), updateUserByAdmin);
adminRoutes.delete("/user/:id", verifyToken, checkPermission(["CAN_MANAGE_USERS"]), deleteUser);


// --- ROUTES DE GESTION DES PROMPTS ---
adminRoutes.post("/prompt", verifyToken, checkPermission(["CAN_MANAGE_PROMPTS"]), createPromptTemplate);
adminRoutes.get("/prompts", verifyToken, checkPermission(["CAN_MANAGE_PROMPTS"]), getAllPromptTemplates);
adminRoutes.get("/prompt/:id", verifyToken, checkPermission(["CAN_MANAGE_PROMPTS"]), getPromptTemplateById);
adminRoutes.put("/prompt/:id", verifyToken, checkPermission(["CAN_MANAGE_PROMPTS"]), updatePromptTemplate);
adminRoutes.delete("/prompt/:id", verifyToken, checkPermission(["CAN_MANAGE_PROMPTS"]), deletePromptTemplate);

adminRoutes.get("/articles", verifyToken, checkPermission(["CAN_MANAGE_ARTICLES"]), adminGetAllArticles);

export default adminRoutes;