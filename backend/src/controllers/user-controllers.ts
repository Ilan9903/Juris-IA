import { compare, hash } from "bcrypt";
import { NextFunction, Request, Response } from "express";
import fs from "fs"; // Pour la suppression des fichiers temporaires après Cloudinary
import mongoose from "mongoose";
import User from "../models/User.js";
import cloudinary from "../utils/cloudinary.js";
import { COOKIE_NAME } from "../utils/constants.js"; // Assure-toi que COOKIE_NAME est correctement importé
import { createToken } from "../utils/token-manager.js"; // Assure-toi que le chemin est correct


// Cela indique à TypeScript la structure de res.locals.jwtData
declare module 'express-serve-static-core' {
  interface Locals {
    jwtData?: {
      id: string;
      email: string;
      iat: number; // Issued At
      exp: number; // Expiration
      [key: string]: any;
    };
  }
};

export const userSignup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`[${new Date().toISOString()}] --- userSignup Controller: Tentative d'inscription avec email existant: ${email}`);
      return res.status(409).send("Un utilisateur avec cet email existe déjà.");
    }
    const hashedPassword = await hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, status: "online" });
    await user.save();

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      signed: true,
      path: "/",
    });

    const token: string = createToken(user._id.toString(), user.email, user.role, user.name, "7d");
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    console.log(`[${new Date().toISOString()}] --- userSignup Controller: Tentative de définir le cookie ---`);
    console.log(`[${new Date().toISOString()}] --- userSignup Controller: COOKIE_NAME : ${COOKIE_NAME}`);
    console.log(`[${new Date().toISOString()}] --- userSignup Controller: Token généré (partiel) : ${token.substring(0, 30)}...`);
    console.log(`[${new Date().toISOString()}] --- userSignup Controller: Date d'expiration du cookie : ${expires.toISOString()}`);

    res.cookie(COOKIE_NAME, token, {
      path: "/",
      expires,
      httpOnly: true,
      signed: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'none' en minuscules
      secure: process.env.NODE_ENV === "production",
    });

    return res
      .status(201)
      .json({
        message: "OK",
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        status: user.status,
        role: user.role, // Assure-toi que le rôle est défini dans le modèle User
      });
  } catch (error) {
    console.log(`[${new Date().toISOString()}] --- userSignup Controller: ERREUR ---`, error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const userLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[${new Date().toISOString()}] --- userLogin Controller: Tentative de connexion avec email non enregistré: ${email}`);
      return res.status(404).send("Utilisateur non trouvé.");
    }
    const isPasswordCorrect = await compare(password, user.password);
    if (!isPasswordCorrect) {
      console.log(`[${new Date().toISOString()}] --- userLogin Controller: Mot de passe incorrect pour: ${email}`);
      return res.status(401).send("Mot de passe incorrect.");
    }

    if (user.status !== "online") {
      user.status = "online";
      await user.save();
      console.log(`[${new Date().toISOString()}] --- userLogin Controller: Statut utilisateur mis à jour à online pour: ${user.email}`);
    }

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      signed: true,
      path: "/",
    });

    const token: string = createToken(user._id.toString(), user.email, user.role, user.name, "7d");
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    console.log(`[${new Date().toISOString()}] --- userLogin Controller: Tentative de définir le cookie ---`);
    console.log(`[${new Date().toISOString()}] --- userLogin Controller: COOKIE_NAME : ${COOKIE_NAME}`);
    console.log(`[${new Date().toISOString()}] --- userLogin Controller: Token généré (partiel) : ${token.substring(0, 30)}...`);
    console.log(`[${new Date().toISOString()}] --- userLogin Controller: Date d'expiration du cookie : ${expires.toISOString()}`);

    res.cookie(COOKIE_NAME, token, {
      path: "/",
      expires,
      httpOnly: true,
      signed: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'none' en minuscules
      secure: process.env.NODE_ENV === "production",
    });

    return res
      .status(200)
      .json({
        message: "Connéxion réussie",
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        status: user.status
      });
  } catch (error) {
    console.log(`[${new Date().toISOString()}] --- userLogin Controller: ERREUR ---`, error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Utilise res.locals.jwtData car verifyToken y stocke le payload
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      console.log(`[${new Date().toISOString()}] --- verifyUser Controller: Utilisateur non trouvé ou Token défaillant pour ID: ${res.locals.jwtData.id}`);
      return res.status(401).send("Utilisateur non trouvé OU Token invalide.");
    }

    if (user.status !== "online") {
      user.status = "online";
      await user.save();
      console.log(`[${new Date().toISOString()}] --- verifyUser Controller: Statut utilisateur mis à jour à online pour: ${user.email}`);
    }

    return res.status(200).json({
      message: "Authentifié",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        status: user.status,
        role: user.role, // ✅ essentiel pour filtrer côté frontend
      },
    });
  } catch (error) {
    console.log(`[${new Date().toISOString()}] --- verifyUser Controller: ERREUR ---`, error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  // console.log(`[${new Date().toISOString()}] --- updateStatus Controller: Exécution commencée ---`);
  // console.log(`[${new Date().toISOString()}] --- updateStatus Controller: req.body:`, req.body);
  // console.log(`[${new Date().toISOString()}] --- updateStatus Controller: res.locals.jwtData:`, res.locals.jwtData);
  try {
    const { status } = req.body;
    if (!status || !["online", "idle", "offline"].includes(status)) {
      console.log(`[${new Date().toISOString()}] --- updateStatus Controller: Statut invalide fourni: ${status}`);
      return res.status(400).json({ message: "Statut invalide fourni." });
    }

    // Utilise res.locals.jwtData
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      console.log(`[${new Date().toISOString()}] --- updateStatus Controller: Utilisateur introuvable pour ID: ${res.locals.jwtData.id}`);
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    user.status = status;
    await user.save();
    console.log(`[${new Date().toISOString()}] --- updateStatus Controller: Statut utilisateur ${user.email} mis à jour avec succès à ${status}.`);

    return res.status(200).json({
      message: "Status utilisateur mis à jour.",
      user: {
        name: user.name,
        email: user.email,
        status: user.status,
        profileImage: user.profileImage,
      },
    });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] --- updateStatus Controller: ERREUR ---`, err);
    return res.status(500).json({ message: "Status utilisateur non mis à jour.", error: err.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  // console.log(`[${new Date().toISOString()}] --- updateProfile Controller: Exécution commencée ---`);
  // // @ts-ignore // Temporaire si multer ne type pas req.file
  // console.log(`[${new Date().toISOString()}] --- updateProfile Controller: req.body:`, req.body);
  // // @ts-ignore // Temporaire si multer ne type pas req.file
  // console.log(`[${new Date().toISOString()}] --- updateProfile Controller: req.file:`, req.file);
  // console.log(`[${new Date().toISOString()}] --- updateProfile Controller: res.locals.jwtData:`, res.locals.jwtData);
  try {
    const { name, status, email: newEmail } = req.body; // <-- Added newEmail extraction
    // Utilisation de res.locals.jwtData.id qui doit être défini par le middleware d'authentification
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      console.log(`[${new Date().toISOString()}] --- updateProfile Controller: Utilisateur introuvable pour ID: ${res.locals.jwtData.id}`);
      return res.status(404).json({ message: "Un utilisateur avec cet email existe déjà." });
    }

    if (name) user.name = name;
    if (status) user.status = status;

    // --- DÉBUT DE LA MODIFICATION: AJOUT DE LA LOGIQUE DE MISE À JOUR DE L'EMAIL ---
    if (newEmail && newEmail !== user.email) { // Check if newEmail is provided and different
      const existingUserWithNewEmail = await User.findOne({ email: newEmail });
      // If another user already has this email
      if (existingUserWithNewEmail && existingUserWithNewEmail._id.toString() !== user._id.toString()) {
        console.log(`[${new Date().toISOString()}] --- updateProfile Controller: Tentative de mise à jour vers un email déjà existant: ${newEmail}`);
        return res.status(409).json({ message: "Un utilisateur avec cet email existe déjà." });
      }
      user.email = newEmail; // Update the user's email
      console.log(`[${new Date().toISOString()}] --- updateProfile Controller: Email mis à jour de ${user.email} à ${newEmail}`);
    }
    // @ts-ignore
    const file = req.file;
    if (file) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "juris-ai-users",
      });
      if (user.profileImage && user.profileImage !== "/pdp_none.png") {
        const publicId = user.profileImage.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`juris-ai-users/${publicId}`);
          console.log(`[${new Date().toISOString()}] --- updateProfile Controller: Ancienne image Cloudinary supprimée: ${publicId}`);
        }
      }
      user.profileImage = result.secure_url;

      fs.unlinkSync(file.path);
      console.log(`[${new Date().toISOString()}] --- updateProfile Controller: Fichier temporaire supprimé: ${file.path}`);
    }

    await user.save();
    console.log(`[${new Date().toISOString()}] --- updateProfile Controller: Profil utilisateur ${user.email} sauvegardé avec succès.`);

    return res.status(200).json({
      message: "Profil utilisateur mis à jour.",
      user: {
        name: user.name,
        email: user.email, // <-- Ensure updated email is sent back
        status: user.status,
        profileImage: user.profileImage,
        role: user.role, // Assure-toi que le rôle est défini dans le modèle User
      },
    });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] --- updateProfile Controller: ERREUR ---`, err);
    // @ts-ignore
    if (req.file && fs.existsSync(req.file.path)) {
      // @ts-ignore
      fs.unlinkSync(req.file.path);
      // @ts-ignore
      console.log(`[${new Date().toISOString()}] --- updateProfile Controller: Fichier temporaire supprimé après erreur: ${req.file.path}`);
    }
    return res.status(500).json({ message: "Non mis à jour.", error: err.message });
  }
};

export const verifyPassword = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] --- verifyPassword Controller: Exécution commencée ---`);

  const { password } = req.body;
  console.log(`[${new Date().toISOString()}] --- verifyPassword Controller: Mot de passe reçu du frontend: ${password ? "******" : "UNDEFINED/NULL"}`);

  // === C'EST ICI QU'IL FAUT CHANGER : UTILISER res.locals.jwtData ===
  const userId = res.locals.jwtData?.id; // Corrected
  const userEmail = res.locals.jwtData?.email; // Corrected

  console.log(`[${new Date().toISOString()}] --- verifyPassword Controller: ID Utilisateur depuis res.locals.jwtData: ${userId}`); // Log corrected
  console.log(`[${new Date().toISOString()}] --- verifyPassword Controller: Email Utilisateur depuis res.locals.jwtData: ${userEmail}`); // Log corrected


  if (!password) {
    console.log(`[${new Date().toISOString()}] --- verifyPassword Controller: Erreur: Mot de passe manquant dans le corps de la requête.`);
    return res.status(400).json({ message: "Le mot de passe est requis." });
  }
  if (!userId) {
    // Le message d'erreur doit être cohérent avec l'origine de l'ID (res.locals.jwtData)
    console.log(`[${new Date().toISOString()}] --- verifyPassword Controller: Erreur: ID utilisateur manquant sur res.locals.jwtData. Non authentifié ?`);
    return res.status(401).json({ message: "Utilisateur non authentifié (ID manquant dans le token)." });
  }

  try {
    const user = await User.findById(userId);
    console.log(`[${new Date().toISOString()}] --- verifyPassword Controller: Utilisateur trouvé par ID (${userId}): ${user ? user.email : "NON TROUVÉ"}`);

    if (!user) {
      console.log(`[${new Date().toISOString()}] --- verifyPassword Controller: Erreur: Utilisateur avec l'ID ${userId} introuvable dans la base de données.`);
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    console.log(`[${new Date().toISOString()}] --- verifyPassword Controller: Comparaison du mot de passe fourni avec le haché dans la DB...`);
    const isMatch = await compare(password, user.password);
    console.log(`[${new Date().toISOString()}] --- verifyPassword Controller: Résultat de la comparaison de mot de passe: ${isMatch}`);

    if (!isMatch) {
      console.log(`[${new Date().toISOString()}] --- verifyPassword Controller: Erreur: Mot de passe fourni incorrect.`);
      return res.status(401).json({ message: "Mot de passe incorrect." });
    }

    console.log(`[${new Date().toISOString()}] --- verifyPassword Controller: Mot de passe vérifié avec succès.`);
    return res.status(200).json({ message: "Mot de passe vérifié avec succès." });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] --- verifyPassword Controller: Erreur lors de la vérification du mot de passe :`, error);
    return res.status(500).json({ message: "Erreur interne du serveur lors de la vérification du mot de passe." });
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  const { currentPassword, newPassword } = req.body;
  const userId = res.locals.jwtData.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // 1. Vérifier si l'ancien mot de passe est correct
    const isPasswordCorrect = await compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "L'ancien mot de passe est incorrect." });
    }

    // 2. Hasher et sauvegarder le nouveau mot de passe
    const hashedNewPassword = await hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    return res.status(200).json({ message: "Mot de passe mis à jour avec succès." });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] --- changePassword ERREUR ---`, error);
    return res.status(500).json({ message: "Erreur serveur lors de la mise à jour du mot de passe.", cause: error.message });
  }
};

export const userLogout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Utilise res.locals.jwtData
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) {
      console.log(`[${new Date().toISOString()}] --- userLogout Controller: Utilisateur non trouvé ou Token défaillant pour ID: ${res.locals.jwtData.id}`);
      return res.status(401).send("Utilisateur non trouvé OU Token invalide.");
    }

    if (user.status !== "offline") {
      user.status = "offline";
      await user.save();
      console.log(`[${new Date().toISOString()}] --- userLogout Controller: Statut utilisateur mis à jour à offline pour: ${user.email}`);
    }

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      signed: true,
      path: "/",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // 'none' en minuscules
      secure: process.env.NODE_ENV === "production",
    });
    console.log(`[${new Date().toISOString()}] --- userLogout Controller: Cookie ${COOKIE_NAME} effacé.`);

    return res
      .status(200)
      .json({ message: "Deconnexion", name: user.name, email: user.email, status: user.status });
  } catch (error) {
    console.log(`[${new Date().toISOString()}] --- userLogout Controller: ERREUR ---`, error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const deleteUserAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.jwtData.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Optionnel : Nettoyer les ressources externes (ex: images sur Cloudinary)
    if (user.profileImage && !user.profileImage.includes("pdp_none.png")) {
      const publicIdWithFolder = user.profileImage.split('/').slice(-2).join('/').split('.')[0];
      if (publicIdWithFolder) {
        await cloudinary.uploader.destroy(publicIdWithFolder);
        console.log(`[${new Date().toISOString()}] --- deleteUserAccount: Image Cloudinary supprimée: ${publicIdWithFolder}`);
      }
    }

    // Supprimer l'utilisateur de la base de données
    await User.findByIdAndDelete(userId);

    // Effacer le cookie d'authentification
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      signed: true,
      path: "/",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    console.log(`[${new Date().toISOString()}] --- deleteUserAccount: Utilisateur ${userId} (${user.email}) supprimé avec succès.`);
    return res.status(200).json({ message: "Compte supprimé avec succès." });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] --- deleteUserAccount ERREUR ---`, error);
    return res.status(500).json({ message: "Erreur serveur lors de la suppression du compte.", cause: error.message });
  }
};