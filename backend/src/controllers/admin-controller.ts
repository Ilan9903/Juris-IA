// src/controllers/admin-controller.ts

import { compare, hash } from "bcrypt";
import { NextFunction, Request, Response } from "express";
import fs from "fs";
import mongoose from "mongoose";
import PromptTemplate from "../models/PromptTemplate.js";
import User from "../models/User.js";
import cloudinary from "../utils/cloudinary.js";

// Interface locale pour étendre Request avec les propriétés Multer et 'user'
// AJOUTE LE CHAMP 'permissions' ICI
interface CustomRequest extends Request {
    body: any; // <-- Ajouté pour corriger l'erreur de propriété 'body'
    file?: Express.Multer.File; // <-- MODIFIÉ ICI
    files?: Express.Multer.File[]; // <-- MODIFIÉ ICI (si vous utilisez req.files pour plusieurs uploads)
    user?: {
        _id: string;
        name: string;
        email: string;
        role: "user" | "admin" | "redacteur";
        permissions?: string[];
    };
    params: {
        [key: string]: string;
    };
}


// Users

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await User.find().select("-password -__v");
        return res.status(200).json({ message: "Utilisateurs trouvés !", users });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] --- getAllUsers Controller: ERREUR ---`, error);
        return res.status(500).json({ message: "ERROR", cause: error.message });
    }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.log(`[${new Date().toISOString()}] --- getUserById Controller: ID invalide: ${userId}`);
        return res.status(400).json({ message: "ID utilisateur invalide." });
    }

    try {
        const user = await User.findById(userId).select("-password -__v");
        if (!user) {
            console.log(`[${new Date().toISOString()}] --- getUserById Controller: Utilisateur non trouvé pour ID: ${userId}`);
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        console.log(`[${new Date().toISOString()}] --- getUserById Controller: Utilisateur trouvé pour ID: ${userId} - ${user.email}`);
        return res.status(200).json({ message: "Utilisateur trouvé !", user });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] --- getUserById Controller: ERREUR ---`, error);
        return res.status(500).json({ message: "ERROR", cause: error.message });
    }
};

export const createUserByAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "Tous les champs (nom, email, mot de passe, rôle) sont requis." });
    }

    const allowedRoles = ["user", "redacteur", "admin"];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Rôle invalide. Rôles autorisés : user, redacteur, admin." });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Un utilisateur avec cet email existe déjà." });
        }

        const hashedPassword = await hash(password, 10);
        const user = new User({ name, email, password: hashedPassword, role });
        await user.save();

        console.log(`[${new Date().toISOString()}] --- createUserByAdmin Controller: Nouvel utilisateur créé par admin: ${user.email} avec rôle ${user.role}`);
        return res.status(201).json({ message: "Utilisateur créé avec succès !", user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] --- createUserByAdmin Controller: ERREUR ---`, error);
        return res.status(500).json({ message: "Erreur serveur lors de la création de l'utilisateur.", cause: error.message });
    }
};

export const updateUserByAdmin = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const { name, email, role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "ID utilisateur invalide." });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        // req.user est maintenant reconnu ici grâce à CustomRequest
        const requesterId = req.user?._id;

        if (requesterId === userId && role && role !== "admin") {
            return res.status(403).json({ message: "Vous ne pouvez pas vous retirer les droits d'admin." });
        }

        if (email && email !== user.email) {
            const existingUserWithEmail = await User.findOne({ email });
            if (existingUserWithEmail && String(existingUserWithEmail._id) !== userId) {
                return res.status(409).json({ message: "Cet email est déjà utilisé par un autre utilisateur." });
            }
        }

        const updateFields: any = {};
        if (name) updateFields.name = name;
        if (email) updateFields.email = email;
        if (role) {
            const allowedRoles = ["user", "redacteur", "admin"];
            if (!allowedRoles.includes(role)) {
                return res.status(400).json({ message: "Rôle invalide. Rôles autorisés : user, redacteur, admin." });
            }
            updateFields.role = role;
        }

        // req.file est maintenant reconnu ici grâce à CustomRequest
        if (req.file) {
            try {
                if (user.profileImage && user.profileImage !== "/pdp_none.png") {
                    const publicId = user.profileImage.split('/').pop()?.split('.')[0];
                    if (publicId) {
                        await cloudinary.uploader.destroy(`juris-ai-users/${publicId}`);
                        console.log(`[${new Date().toISOString()}] --- updateUserByAdmin Controller: Ancienne image Cloudinary supprimée: ${publicId}`);
                    }
                }

                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: "juris-ai-users",
                });
                updateFields.profileImage = result.secure_url;
                console.log(`[${new Date().toISOString()}] --- updateUserByAdmin Controller: Nouvelle image Cloudinary uploadée: ${result.secure_url}`);
            } catch (uploadError) {
                console.error(`[${new Date().toISOString()}] --- updateUserByAdmin Controller: Erreur lors de l'upload Cloudinary:`, uploadError);
            } finally {
                fs.unlinkSync(req.file.path);
                console.log(`[${new Date().toISOString()}] --- updateUserByAdmin Controller: Fichier temporaire supprimé: ${req.file.path}`);
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select("-password -__v");

        if (!updatedUser) {
            return res.status(404).json({ message: "Utilisateur non trouvé après mise à jour (ceci ne devrait pas arriver)." });
        }

        console.log(`[${new Date().toISOString()}] --- updateUserByAdmin Controller: Utilisateur ${userId} mis à jour par admin. Champs modifiés: ${JSON.stringify(updateFields)}`);
        return res.status(200).json({ message: "Utilisateur mis à jour avec succès !", user: updatedUser });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] --- updateUserByAdmin Controller: ERREUR ---`, error);
        return res.status(500).json({ message: "Erreur serveur lors de la mise à jour de l'utilisateur.", cause: error.message });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        // Cast pour accéder à req.user qui vient du middleware verifyToken
        const requesterId = (req as CustomRequest).user?._id;

        if (requesterId === userId) {
            return res.status(403).json({ message: "Vous ne pouvez pas supprimer votre propre compte." });
        }

        if (!user) {
            console.log(`[${new Date().toISOString()}] --- deleteUser Controller: Utilisateur non trouvé pour ID: ${userId}`);
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        } else {
            console.log(`[${new Date().toISOString()}] --- deleteUser Controller: Utilisateur trouvé pour ID: ${userId} - ${user.email}`);
        }

        if (user.profileImage && user.profileImage !== "/pdp_none.png") {
            const publicId = user.profileImage.split('/').pop()?.split('.')[0];
            if (publicId) {
                await cloudinary.uploader.destroy(`juris-ai-users/${publicId}`);
                console.log(`[${new Date().toISOString()}] --- deleteUser Controller: Ancienne image Cloudinary supprimée: ${publicId}`);
            }
        }

        await User.findByIdAndDelete(userId);
        console.log(`[${new Date().toISOString()}] --- deleteUser Controller: Utilisateur avec ID ${userId} supprimé avec succès par l'admin ${requesterId}.`);

        return res.status(200).json({ message: "User supprimé avec succès !" });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] --- deleteUser Controller: ERREUR ---`, error);
        return res.status(500).json({ message: "ERROR", cause: error.message });
    }
};



// Prompt Templates

export const createPromptTemplate = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { name, content, description, category, status } = req.body;
    const createdBy = req.user?._id; // L'ID de l'utilisateur qui crée le prompt

    if (!name || !content) {
        return res.status(400).json({ message: "Le nom et le contenu du prompt sont requis." });
    }

    try {
        const existingPrompt = await PromptTemplate.findOne({ name });
        if (existingPrompt) {
            return res.status(409).json({ message: "Un prompt avec ce nom existe déjà." });
        }

        const promptTemplate = new PromptTemplate({
            name,
            content,
            description,
            category,
            status,
            createdBy,
            lastUpdatedBy: createdBy, // Initialement créé par est aussi le dernier à mettre à jour
        });

        await promptTemplate.save();
        console.log(`[${new Date().toISOString()}] --- createPromptTemplate Controller: Nouveau prompt créé: ${promptTemplate.name} par ${createdBy}`);
        return res.status(201).json({ message: "Prompt créé avec succès", promptTemplate });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] --- createPromptTemplate Controller: ERREUR ---`, error);
        return res.status(500).json({ message: "Erreur serveur lors de la création du prompt.", cause: error.message });
    }
};

export const getAllPromptTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const prompts = await PromptTemplate.find().populate('createdBy', 'name email').populate('lastUpdatedBy', 'name email');
        console.log(`[${new Date().toISOString()}] --- getAllPromptTemplates Controller: Récupération de tous les prompts. Nombre: ${prompts.length}`);
        return res.status(200).json({ message: "OK", prompts });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] --- getAllPromptTemplates Controller: ERREUR ---`, error);
        return res.status(500).json({ message: "ERROR", cause: error.message });
    }
};

export const getPromptTemplateById = async (req: Request, res: Response, next: NextFunction) => {
    const promptId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(promptId)) {
        return res.status(400).json({ message: "ID de prompt invalide." });
    }

    try {
        const prompt = await PromptTemplate.findById(promptId).populate('createdBy', 'name email').populate('lastUpdatedBy', 'name email');
        if (!prompt) {
            console.log(`[${new Date().toISOString()}] --- getPromptTemplateById Controller: Prompt non trouvé pour ID: ${promptId}`);
            return res.status(404).json({ message: "Prompt non trouvé." });
        }
        console.log(`[${new Date().toISOString()}] --- getPromptTemplateById Controller: Prompt trouvé pour ID: ${promptId} - ${prompt.name}`);
        return res.status(200).json({ message: "OK", prompt });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] --- getPromptTemplateById Controller: ERREUR ---`, error);
        return res.status(500).json({ message: "ERROR", cause: error.message });
    }
};

export const updatePromptTemplate = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const promptId = req.params.id;
    const { name, content, description, category, status } = req.body;
    const lastUpdatedBy = req.user?._id; // L'ID de l'utilisateur qui met à jour le prompt

    if (!mongoose.Types.ObjectId.isValid(promptId)) {
        return res.status(400).json({ message: "ID de prompt invalide." });
    }

    try {
        const updateFields: any = { lastUpdatedBy }; // Commence par l'utilisateur qui met à jour
        if (name) updateFields.name = name;
        if (content) updateFields.content = content;
        if (description) updateFields.description = description;
        if (category) updateFields.category = category;
        if (status) {
            const allowedStatuses = ["draft", "published", "archived"];
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({ message: `Statut invalide. Statuts autorisés : ${allowedStatuses.join(', ')}.` });
            }
            updateFields.status = status;
        }

        // Vérifier si le nouveau nom est déjà pris par un autre prompt
        if (name) {
            const existingPromptWithNewName = await PromptTemplate.findOne({ name });
            if (existingPromptWithNewName && String(existingPromptWithNewName._id) !== promptId) {
                return res.status(409).json({ message: "Un autre prompt avec ce nom existe déjà." });
            }
        }

        const updatedPrompt = await PromptTemplate.findByIdAndUpdate(
            promptId,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).populate('createdBy', 'name email').populate('lastUpdatedBy', 'name email');

        if (!updatedPrompt) {
            console.log(`[${new Date().toISOString()}] --- updatePromptTemplate Controller: Prompt non trouvé pour ID: ${promptId}`);
            return res.status(404).json({ message: "Prompt non trouvé." });
        }

        console.log(`[${new Date().toISOString()}] --- updatePromptTemplate Controller: Prompt ${promptId} mis à jour: ${updatedPrompt.name} par ${lastUpdatedBy}.`);
        return res.status(200).json({ message: "Prompt mis à jour avec succès", prompt: updatedPrompt });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] --- updatePromptTemplate Controller: ERREUR ---`, error);
        return res.status(500).json({ message: "Erreur serveur lors de la mise à jour du prompt.", cause: error.message });
    }
};

export const deletePromptTemplate = async (req: Request, res: Response, next: NextFunction) => {
    const promptId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(promptId)) {
        return res.status(400).json({ message: "ID de prompt invalide." });
    }

    try {
        const deletedPrompt = await PromptTemplate.findByIdAndDelete(promptId);

        if (!deletedPrompt) {
            console.log(`[${new Date().toISOString()}] --- deletePromptTemplate Controller: Prompt non trouvé pour ID: ${promptId}`);
            return res.status(404).json({ message: "Prompt non trouvé." });
        }

        console.log(`[${new Date().toISOString()}] --- deletePromptTemplate Controller: Prompt ${promptId} (${deletedPrompt.name}) supprimé avec succès.`);
        return res.status(200).json({ message: "Prompt supprimé avec succès." });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] --- deletePromptTemplate Controller: ERREUR ---`, error);
        return res.status(500).json({ message: "Erreur serveur lors de la suppression du prompt.", cause: error.message });
    }
};