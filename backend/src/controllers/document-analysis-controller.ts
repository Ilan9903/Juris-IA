import { NextFunction, Request, Response } from "express";
import fs from "fs";
import mammoth from 'mammoth'; // npm install mammoth
import pdfParse from 'pdf-parse'; // npm install pdf-parse @types/pdf-parse
// Pour @types/mammoth, s'il n'existe pas, vous pourriez devoir créer un fichier de déclaration .d.ts
// ou l'utiliser sans types stricts pour cette bibliothèque au début.

import { configureOpenAI } from "../config/openai-config.js"; //

// Limite de caractères pour le contexte envoyé à l'IA (à ajuster selon le modèle et vos tests)
// GPT-4o a un contexte large, mais envoyer des documents entiers peut être coûteux et lent.
// Pour GPT-4o mini, la limite sera plus petite. Par exemple, 16k tokens pour GPT-3.5-turbo-16k.
// Un token est environ 3/4 d'un mot. 4000 tokens ~ 3000 mots.
// 15000 caractères ~ 3000-4000 mots (très approximatif).
const MAX_CONTEXT_CHARS = 15000;

export const analyzeDocumentController = async (req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] --- analyzeDocumentController: Réception d'une requête d'analyse.`);
    try {
        if (!req.file) {
            console.log(`[${new Date().toISOString()}] --- analyzeDocumentController: Aucun fichier fourni.`);
            return res.status(400).json({ message: "Aucun fichier fourni." });
        }

        const { originalname, path: filePath, mimetype } = req.file;
        // La question de l'utilisateur pourrait venir du corps de la requête (req.body)
        // si elle est envoyée en même temps que le fichier dans un FormData.
        const userQuestion = req.body.question || "Fais un résumé de ce document."; // Question par défaut

        console.log(`[${new Date().toISOString()}] --- analyzeDocumentController: Fichier: ${originalname}, Type: ${mimetype}, Question: "${userQuestion}"`);

        let extractedText = "";

        if (mimetype === 'text/plain') {
            extractedText = fs.readFileSync(filePath, 'utf8');
        } else if (mimetype === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdfParse(dataBuffer);
            extractedText = pdfData.text;
        } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { // .docx
            const result = await mammoth.extractRawText({ path: filePath });
            extractedText = result.value;
        } else if (mimetype === 'application/msword') { // .doc (support basique, peut échouer)
            try {
                // Mammoth peut tenter de lire certains .doc mais c'est moins fiable
                const result = await mammoth.extractRawText({ path: filePath });
                extractedText = result.value;
                if (!extractedText.trim()) throw new Error(".doc text extraction yielded empty result with mammoth");
            } catch (docError) {
                console.warn(`[${new Date().toISOString()}] --- analyzeDocumentController: Mammoth a échoué pour .doc, tentative avec textract (si installé et configuré).`);
                // Vous pourriez ici essayer une autre lib ou renvoyer une erreur plus spécifique pour .doc
                // Pour l'instant, on le traite comme non supporté si mammoth échoue.
                fs.unlinkSync(filePath);
                return res.status(400).json({ message: `Le format .doc est difficile à traiter. Essayez de convertir en .docx ou .pdf.` });
            }
        }
        else {
            fs.unlinkSync(filePath); // Supprimer le fichier non supporté
            console.log(`[${new Date().toISOString()}] --- analyzeDocumentController: Format de fichier non supporté: ${mimetype}`);
            return res.status(400).json({ message: `Format de fichier non supporté: ${mimetype}. Essayez TXT, PDF, ou DOCX.` });
        }

        // Supprimer le fichier temporaire après extraction
        fs.unlinkSync(filePath);
        console.log(`[${new Date().toISOString()}] --- analyzeDocumentController: Fichier temporaire ${filePath} supprimé.`);

        if (!extractedText.trim()) {
            console.log(`[${new Date().toISOString()}] --- analyzeDocumentController: Impossible d'extraire du texte du document.`);
            return res.status(400).json({ message: "Impossible d'extraire du texte du document." });
        }

        // Tronquer le texte si trop long (stratégie de chunking très basique)
        let documentContext = extractedText;
        if (documentContext.length > MAX_CONTEXT_CHARS) {
            console.warn(`[${new Date().toISOString()}] --- analyzeDocumentController: Texte extrait tronqué de ${documentContext.length} à ${MAX_CONTEXT_CHARS} caractères.`);
            documentContext = documentContext.substring(0, MAX_CONTEXT_CHARS);
            // TODO: Implémenter une meilleure stratégie de chunking pour les longs documents
            // (ex: diviser en morceaux, vectoriser, et faire du RAG)
        }

        console.log(`[${new Date().toISOString()}] --- analyzeDocumentController: Envoi du contexte (longueur: ${documentContext.length}) et de la question à l'IA.`);
        const openai = configureOpenAI();
        const prompt = `Contexte fourni (extrait d'un document utilisateur):\n"""\n${documentContext}\n"""\n\nEn te basant STRICTEMENT sur le contexte ci-dessus, réponds à la question suivante de l'utilisateur:\nQuestion: "${userQuestion}"\n\nSi la réponse ne se trouve pas dans le contexte fourni, indique que l'information n'est pas présente dans le document. Ne fais pas d'hypothèses et ne cherche pas d'informations en dehors du contexte.`;

        const chatResponse = await openai.chat.completions.create({
            model: "gpt-4.1-mini-2025-04-14", // Ou le modèle de votre choix
            messages: [{ role: "user", content: prompt }], // Ou un rôle "system" pour le contexte et "user" pour la question
        });

        const aiResponse = chatResponse.choices[0]?.message?.content;
        console.log(`[${new Date().toISOString()}] --- analyzeDocumentController: Réponse de l'IA reçue.`);
        return res.status(200).json({ answer: aiResponse, originalFilename: originalname });

    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] --- analyzeDocumentController: ERREUR SERVEUR ---`, error);
        if (req.file && fs.existsSync(req.file.path)) { // S'assurer que le fichier temporaire est supprimé en cas d'erreur
            try {
                fs.unlinkSync(req.file.path);
                console.log(`[${new Date().toISOString()}] --- analyzeDocumentController: Fichier temporaire ${req.file.path} supprimé après erreur.`);
            } catch (unlinkErr) {
                console.error(`[${new Date().toISOString()}] --- analyzeDocumentController: ERREUR lors de la suppression du fichier temporaire après erreur:`, unlinkErr);
            }
        }
        return res.status(500).json({ message: "Erreur serveur lors de l'analyse du document.", cause: error.message });
    }
};