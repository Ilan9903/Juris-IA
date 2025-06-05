// src/utils/token-manager.ts

import { NextFunction, Request, Response } from "express"; // Assurez-vous que Request est importé
import jwt, { SignOptions } from "jsonwebtoken"; // Importez SignOptions explicitement
import User from "../models/User.js";
import { COOKIE_NAME } from "./constants.js";

export interface DecodedToken {
  id: string;
  email: string;
  role: "user" | "admin" | "redacteur";
  name: string;
  iat: number;
  exp: number;
}

// Interface locale pour étendre Request
interface AuthenticatedRequest extends Request {
  // Pour résoudre l'erreur TS2430:
  // Définir explicitement signedCookies comme requis si le type de base l'exige.
  // Record<string, any> est un type sûr et courant pour les cookies.
  signedCookies: Record<string, any>;

  user?: {
    _id: string;
    name: string;
    email: string;
    role: "user" | "admin" | "redacteur";
    permissions?: string[];
  };
}

export const createToken = (
  id: string,
  email: string,
  role: "user" | "admin" | "redacteur",
  name: string,
  expiresInValue: string // Renommé pour éviter la confusion avec la clé de l'objet options
) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error(`[${new Date().toISOString()}] --- createToken: JWT_SECRET n'est pas défini !`);
    throw new Error("JWT_SECRET is not defined in the environment variables");
  }

  const payload = { id, email, role, name };
  // Expliciter le type pour les options de jwt.sign
  const options: SignOptions = { expiresIn: expiresInValue };
  const token = jwt.sign(payload, JWT_SECRET, options);
  return token;
};

export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] --- verifyToken Middleware: Exécution commencée ---`);

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error(`[${new Date().toISOString()}] --- verifyToken Middleware: ERREUR FATALE - JWT_SECRET manquant !`);
    return res.status(500).json({ message: "Erreur de configuration serveur: JWT_SECRET manquant." });
  }

  // Accéder à req.signedCookies (maintenant explicitement défini dans AuthenticatedRequest)
  const token = req.signedCookies && req.signedCookies[COOKIE_NAME];
  console.log(`[${new Date().toISOString()}] --- verifyToken Middleware: Cookie '${COOKIE_NAME}' récupéré:`, token ? "Présent" : "Absent ou vide");

  if (!token || typeof token !== "string" || token.trim() === "") {
    console.log(`[${new Date().toISOString()}] --- verifyToken Middleware: Token non reçu ou vide. Accès refusé.`);
    return res.status(401).json({ message: "Token Not Received" });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err || typeof decoded !== "object" || decoded === null) {
      console.error(`[${new Date().toISOString()}] --- verifyToken Middleware: Token invalide ---`, err?.message);
      res.clearCookie(COOKIE_NAME, {
        path: "/",
        // domain: process.env.COOKIE_DOMAIN, // Décommentez si vous utilisez un domaine spécifique pour les cookies
        httpOnly: true,
        signed: true, // Important si vous utilisez des cookies signés
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
      return res.status(401).json({ message: "Token Expired or Invalid" });
    }

    const { id, email, role, name, iat, exp } = decoded as DecodedToken;

    try {
      const user = await User.findById(id).populate('permissions');

      if (!user) {
        console.error(`[${new Date().toISOString()}] --- verifyToken Middleware: Utilisateur ${id} non trouvé dans la DB.`);
        res.clearCookie(COOKIE_NAME, { /* ... options ... */ });
        return res.status(401).json({ message: "Utilisateur non trouvé ou compte supprimé." });
      }

      const userPermissions = user.permissions ? user.permissions.map((p: any) => p.name) : [];

      res.locals.jwtData = { id, email, role, name, iat, exp };
      req.user = {
        _id: id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: userPermissions,
      };

      console.log(`[${new Date().toISOString()}] --- verifyToken Middleware: Token OK. Utilisateur: ${email} (${role}). Permissions: ${userPermissions.join(', ')}`);
      return next();
    } catch (dbError) {
      console.error(`[${new Date().toISOString()}] --- verifyToken Middleware: Erreur DB lors du chargement de l'utilisateur:`, dbError);
      return res.status(500).json({ message: "Erreur serveur lors de la vérification du token." });
    }
  });
};