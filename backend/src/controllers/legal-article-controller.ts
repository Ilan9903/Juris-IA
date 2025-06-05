// controllers/legal-article-controller.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import { LegalArticle } from "../models/LegalArticle.js";

export const createArticle = async (req: Request, res: Response) => {
    try {
        const data = req.body;

        // Valeur par défaut pour isUniversal
        if (typeof data.isUniversal === "undefined") {
            data.isUniversal = false;
        }

        const newArticle = new LegalArticle(req.body);
        const saved = await newArticle.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ message: "Erreur création article.", error: err });
    }
};

export const getArticles = async (req: Request, res: Response) => {
    try {
        const { category, limit, page, search } = req.query;

        let filter: any = {}; // 'any' pour la flexibilité avec les filtres Mongoose

        // Filtre par catégorie
        if (category && typeof category === "string") {
            filter.category = category; // Recherche les articles qui ONT CETTE catégorie dans leur tableau de catégories
            // Si vous voulez conserver la logique "OU isUniversal", il faut l'adapter :
            // filter.$or = [{ category: category }, { isUniversal: true }];
            // Attention : combiner $or avec d'autres filtres nécessite parfois de structurer la requête différemment.
            // Pour l'instant, simplifions : si 'category' est là, on filtre sur cette catégorie.
            // Si vous avez besoin de la logique $or combinée au search, dites-le moi.
        }

        // Filtre par terme de recherche (sur title et content)
        if (search && typeof search === "string" && search.trim() !== "") {
            const searchRegex = new RegExp(search.trim(), 'i'); // 'i' pour insensible à la casse
            filter.$or = [ // Recherche dans le titre OU le contenu
                { title: { $regex: searchRegex } },
                { content: { $regex: searchRegex } },
            ];
            console.log(`[${new Date().toISOString()}] --- getArticles Controller: Application du filtre de recherche: "${search}"`);
        }

        // Si 'category' et 'search' sont tous les deux présents, ils seront combinés par un ET implicite
        // (sauf si l'un d'eux utilise $or, auquel cas la structure du filtre global doit être gérée avec $and si nécessaire)
        // Pour l'instant, si search est présent, il utilise $or pour title/content. Si category est aussi présent,
        // MongoDB cherchera les documents où (category = X) AND (title matches OR content matches). C'est généralement le comportement souhaité.


        const pageNum = parseInt(page as string, 10) || 1;
        const limitNum = parseInt(limit as string, 10) || 10;

        let articlesQuery = LegalArticle.find(filter)
            .sort({ createdAt: -1 });

        // Logique pour le carrousel (si SEULEMENT limit est fourni, et pas page, et pas de recherche)
        if (limit && !page && !search) { // On ne veut pas que le carrousel soit affecté par la recherche
            const carouselLimit = parseInt(limit as string, 10);
            if (!isNaN(carouselLimit) && carouselLimit > 0) {
                const articles = await articlesQuery.limit(carouselLimit).exec();
                console.log(`[${new Date().toISOString()}] --- getArticles Controller (Carousel): ${articles.length} articles récupérés avec limite ${carouselLimit}.`);
                return res.json(articles);
            }
        }

        // Logique pour la pagination et la recherche combinées
        const totalArticles = await LegalArticle.countDocuments(filter); // Le filtre inclut maintenant la recherche
        const totalPages = Math.ceil(totalArticles / limitNum);

        const articles = await articlesQuery
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .exec();

        if (articles.length === 0 && pageNum === 1) {
            console.log(`[${new Date().toISOString()}] --- getArticles Controller (Pagination/Search): Aucun article trouvé.`);
            return res.status(200).json({
                message: "Aucun article trouvé.",
                articles: [],
                currentPage: pageNum,
                totalPages: 0,
                totalArticles: 0,
            });
        }

        console.log(`[${new Date().toISOString()}] --- getArticles Controller (Pagination/Search): ${articles.length} articles récupérés pour la page ${pageNum}/${totalPages}. Total: ${totalArticles}.`);

        res.json({
            message: "Articles récupérés avec succès.",
            articles,
            currentPage: pageNum,
            totalPages,
            totalArticles,
        });

    } catch (err: any) {
        console.error(`[${new Date().toISOString()}] --- getArticles Controller: ERREUR ---`, err);
        res.status(500).json({ message: "Erreur récupération articles.", cause: err.message });
    }
};

export const getArticleById = async (req: Request, res: Response) => {
    try {
        const article = await LegalArticle.findById(req.params.id);
        if (!article) return res.status(404).json({ message: "Article non trouvé." });
        res.json(article);
    } catch (err) {
        res.status(500).json({ message: "Erreur" });
    }
};

export const getArticleCategories = async (req: Request, res: Response) => {
    console.log(`[${new Date().toISOString()}] --- Entrée dans getArticleCategories (version avec Mongoose) ---`);
    try {
        console.log(`[${new Date().toISOString()}] --- DEBUG: Type de LegalArticle: ${typeof LegalArticle}, distinct existe: ${LegalArticle && typeof LegalArticle.distinct === 'function'}`);

        // Ligne originale qui pourrait poser problème
        const categories = await LegalArticle.distinct("category");
        console.log(`[${new Date().toISOString()}] --- DEBUG: Résultat de distinct:`, categories);

        if (!categories || categories.length === 0) {
            console.log(`[${new Date().toISOString()}] --- getArticleCategories: Aucune catégorie trouvée.`);
            return res.status(200).json({ message: "Aucune catégorie trouvée.", categories: [] });
        }

        console.log(`[${new Date().toISOString()}] --- getArticleCategories: Catégories brutes: ${categories.join(', ')}`);
        const validCategories = categories.filter(cat => cat != null && typeof cat === 'string' && cat.trim() !== ''); // Assurez-vous que cat est une chaîne
        console.log(`[${new Date().toISOString()}] --- getArticleCategories: Catégories valides: ${validCategories.join(', ')}`);

        return res.status(200).json({ message: "Catégories récupérées avec succès.", categories: validCategories });

    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] --- getArticleCategories ERREUR DANS CATCH (version avec Mongoose) ---`, error);
        console.error(`[${new Date().toISOString()}] --- Stack Trace (version avec Mongoose): ---`, error.stack);
        return res.status(500).json({ message: "Erreur serveur (Mongoose) lors de la récupération des catégories.", cause: error.message });
    }
};

export const updateArticle = async (req: Request, res: Response) => {
    try {
        const updatedArticle = await LegalArticle.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedArticle) {
            return res.status(404).json({ message: "Article non trouvé." });
        }

        res.json(updatedArticle);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la mise à jour.", error: err });
    }
};

export const deleteArticle = async (req: Request, res: Response) => {
    try {
        const deletedArticle = await LegalArticle.findByIdAndDelete(req.params.id);
        if (!deletedArticle) return res.status(404).json({ message: "Article non trouvé." });
        res.json({ message: "Article supprimé avec succès !" });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la suppression.", error: err });
    }
};