// src/utils/checkRole.ts
import { NextFunction, Request, Response } from "express";

// Interface locale pour étendre Request avec la propriété 'user', y compris les permissions
// C'est la même interface que celle utilisée dans token-manager.ts et admin-routes.ts
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        name: string;
        email: string;
        role: "user" | "admin" | "redacteur";
        permissions?: string[]; // Maintenant, nous nous basons sur CE tableau
    };
}

// La fonction checkPermission prend un tableau de permissions requises
export const checkPermission = (requiredPermissions: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        console.log(`[${new Date().toISOString()}] --- checkPermission Middleware: Exécution commencée.`);

        // 1. Vérifier si req.user existe (devrait être le cas si verifyToken est passé)
        if (!req.user) {
            // Ce cas ne devrait théoriquement pas arriver si verifyToken est exécuté avant et est strict.
            console.log(`[${new Date().toISOString()}] --- checkPermission Middleware: req.user non défini. Non authentifié.`);
            return res.status(401).json({ message: "Utilisateur non authentifié." });
        }

        const userPermissions = req.user.permissions || []; // Garantit que userPermissions est un tableau, même si req.user.permissions est undefined
        console.log(`[${new Date().toISOString()}] --- checkPermission Middleware: Utilisateur: ${req.user.email}, Permissions: [${userPermissions.join(', ')}]. Permissions requises: [${requiredPermissions.join(', ')}]`);

        // 2. Vérifier si l'utilisateur possède AU MOINS UNE des permissions requises
        const hasPermission = requiredPermissions.some(rp => userPermissions.includes(rp));

        if (!hasPermission) {
            console.log(`[${new Date().toISOString()}] --- checkPermission Middleware: Accès refusé pour ${req.user.email}. Aucune des permissions requises [${requiredPermissions.join(', ')}] n'est présente dans [${userPermissions.join(', ')}].`);
            // Ici, l'utilisateur est authentifié mais n'a pas les droits. C'est un 403.
            return res.status(403).json({ message: "Accès refusé: Permissions insuffisantes." });
        }

        console.log(`[${new Date().toISOString()}] --- checkPermission Middleware: Accès accordé pour ${req.user.email}.`);
        next();
    };
};

// Renomme l'ancienne fonction checkRole (si elle existe toujours)
// export const checkRole = (allowedRoles: Array<"user" | "redacteur" | "admin">) => { /* ... */ };
// Tu peux supprimer l'ancienne implémentation de checkRole si tu ne l'utilises plus.