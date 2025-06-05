import { Router } from "express";
import multer from "multer";
import { analyzeDocumentController } from "../controllers/document-analysis-controller.js"; // Nous créerons ce contrôleur ensuite
import { verifyToken } from "../utils/token-manager.js";

// Configuration de Multer pour le stockage temporaire des fichiers uploadés
// Vous pouvez affiner la destination et le nom du fichier si nécessaire
const upload = multer({ dest: "uploads/documents/" });

const documentAnalysisRoutes = Router();

// Route pour l'upload et l'analyse de document
// L'utilisateur enverra le fichier et sa question.
// 'documentFile' sera le nom du champ dans la requête FormData pour le fichier.
documentAnalysisRoutes.post(
    "/analyze",
    verifyToken, // S'assurer que l'utilisateur est connecté
    upload.single('documentFile'), // Middleware Multer pour gérer un seul fichier nommé 'documentFile'
    analyzeDocumentController
);

export default documentAnalysisRoutes;