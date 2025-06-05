// backend_src/routes/legal-articles.ts
import express from "express";
import {
    createArticle,
    deleteArticle,
    getArticleById,
    getArticleCategories,
    getArticles,
    updateArticle,
} from "../controllers/legal-article-controller.js";
import { checkPermission } from "../utils/checkRole.js"; // <-- Assurez-vous que cet import est là
import { verifyToken } from "../utils/token-manager.js";
import { getArticlesValidator, validate } from "../utils/validators.js";

const router = express.Router();

router.get("/", validate(getArticlesValidator), getArticles);
router.get("/categories", getArticleCategories);
router.get("/:id", getArticleById); // La lecture d'un article peut rester publique ou être protégée par verifyToken seul

// Protéger les routes de création, modification, suppression
router.post(
    "/",
    verifyToken, // D'abord vérifier que l'utilisateur est connecté
    checkPermission(["CAN_MANAGE_ARTICLES"]), // Ensuite, vérifier s'il a la permission
    // validate(createArticleValidator), // Vous ajouterez un validateur pour le corps ici plus tard
    createArticle
);

router.put(
    "/:id",
    verifyToken,
    checkPermission(["CAN_MANAGE_ARTICLES"]),
    // validate(updateArticleValidator), // Validateur pour le corps et l'ID
    updateArticle
);

router.delete(
    "/:id",
    verifyToken,
    checkPermission(["CAN_MANAGE_ARTICLES"]),
    deleteArticle
);

export default router;