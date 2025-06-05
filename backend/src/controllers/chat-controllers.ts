// src/controllers/chat-controller.ts

import { NextFunction, Request, Response } from "express";
// Importation du modèle User et du nouveau modèle PromptTemplate
import PromptTemplate from "../models/PromptTemplate.js"; // <-- NOUVEL IMPORT
import User from "../models/User.js";
// Configuration OpenAI
import OpenAI from "openai"; // Utilise le SDK v4+ pour 'openai'
import { configureOpenAI } from "../config/openai-config.js";

// Pour une meilleure clarté du typage dans le middleware verifyToken (si tu l'utilises)
// et pour accéder à req.user._id, etc.
// C'est mieux de s'appuyer sur l'interface définie dans token-manager.ts
// Si tu n'as pas de CustomRequest dans ce fichier, tu peux l'ajouter ou la modifier.
interface CustomRequest extends Request {
  body: {
    message: string;
    [key: string]: any;
  };
  user?: {
    _id: string;
    name: string;
    email: string;
    role: "user" | "admin" | "redacteur";
    permissions?: string[];
  };
  // Si tu utilises res.locals.jwtData.id, ton verifyToken doit le peupler ainsi:
  // res.locals.jwtData = { id: string };
  // Dans ce cas, tu peux aussi juste laisser Request et caster res.locals.jwtData
}


export const generateChatCompletion = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const { message } = req.body;

  // Accès à l'ID de l'utilisateur : Utilise req.user._id si verifyToken le set.
  // Si ton verifyToken met l'ID dans res.locals.jwtData.id, garde cette ligne:
  const userId = req.user?._id || res.locals.jwtData?.id;

  if (!userId) {
    return res.status(401).json({ message: "Utilisateur non authentifié ou ID manquant." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Utilisateur introuvable." });
    }

    // --- LOGIQUE D'INTÉGRATION DU PROMPT JURIDIQUE ---
    // 1. Récupérer le prompt juridique depuis la base de données
    // On cherche le prompt nommé "ASSISTANT_JURIDIQUE_GENERAL" avec le statut "published"
    const juridicalPrompt = await PromptTemplate.findOne({ name: "ASSISTANT_JURIDIQUE_GENERAL", status: "published" });

    // Initialise le tableau de messages pour l'API de l'IA
    // Utilise le type de message d'OpenAI pour une meilleure compatibilité
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    // Si un prompt juridique est trouvé et valide, l'ajouter comme message système initial
    if (juridicalPrompt && juridicalPrompt.content) {
      messages.push({ role: "system", content: juridicalPrompt.content });
      console.log(`[${new Date().toISOString()}] --- generateChatCompletion: Prompt juridique "${juridicalPrompt.name}" ajouté à la conversation.`);
    } else {
      console.warn(`[${new Date().toISOString()}] --- generateChatCompletion: Prompt juridique 'ASSISTANT_JURIDIQUE_GENERAL' non trouvé ou non publié. L'IA fonctionnera sans orientation spécifique.`);
      // Envisage ici d'ajouter un prompt système générique par défaut si aucun prompt spécifique n'est trouvé
      // messages.push({ role: "system", content: "You are a helpful assistant." });
    }

    // 2. Ajouter l'historique des chats de l'utilisateur
    // Assurez-vous que les chats de l'utilisateur sont au format { role: string, content: string }
    user.chats.forEach(chat => {
      // Filtrer les chats qui pourraient ne pas avoir un rôle ou contenu valide
      if (chat.role && chat.content) {
        messages.push({ role: chat.role, content: chat.content });
      }
    });

    // 3. Ajouter le nouveau message de l'utilisateur à la fin
    messages.push({ role: "user", content: message });

    // Sauvegarder le message de l'utilisateur dans son historique local AVANT l'appel à l'IA
    user.chats.push({ content: message, role: "user" });

    // Configurer et appeler l'API OpenAI
    const openai = configureOpenAI(); // Assurez-vous que configureOpenAI retourne une instance de OpenAI (SDK v4)

    // Obtenir la réponse de l'IA
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4.1-mini-2025-04-14", // Ou "gpt-4", ou le modèle Gemini que tu utilises
      messages: messages, // <-- ENVOIE LE TABLEAU DE MESSAGES COMPLÉTÉ
    });

    // Extraire et sauvegarder la réponse de l'IA
    const botResponse = chatResponse.choices[0]?.message?.content;

    if (botResponse) {
      user.chats.push({ role: "assistant", content: botResponse });
      await user.save();
      console.log(`[${new Date().toISOString()}] --- generateChatCompletion: Réponse de l'IA générée et sauvegardée.`);
      return res.status(200).json({ chats: user.chats });
    } else {
      console.error(`[${new Date().toISOString()}] --- generateChatCompletion: Réponse de l'IA vide ou inattendue.`);
      return res.status(500).json({ message: "L'IA n'a pas pu générer de réponse." });
    }

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] --- generateChatCompletion Controller: ERREUR ---`, error);
    return res.status(500).json({ message: "Quelque chose n'a pas fonctionné.", cause: error.message });
  }
};

export const sendChatsToUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Accès à l'ID de l'utilisateur via res.locals.jwtData, comme dans ton code original
    const userId = res.locals.jwtData.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).send("Utilisateur non trouvé OU Token invalide.");
    }
    // Cette vérification est redondante si res.locals.jwtData.id vient du token de l'utilisateur
    // if (user._id.toString() !== userId) {
    //   return res.status(401).send("Permission non accordée");
    // }
    return res.status(200).json({ message: "Chats envoyés !", chats: user.chats });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] --- sendChatsToUser Controller: ERREUR ---`, error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

export const deleteChats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Accès à l'ID de l'utilisateur via res.locals.jwtData
    const userId = res.locals.jwtData.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).send("Utilisateur non trouvé OU Token invalide.");
    }
    // Cette vérification est redondante
    // if (user._id.toString() !== userId) {
    //   return res.status(401).send("Permission manquante");
    // }
    user.chats.splice(0, user.chats.length); // Vide le tableau de chats
    await user.save();
    console.log(`[${new Date().toISOString()}] --- deleteChats: Chats de l'utilisateur ${userId} supprimés.`);
    return res.status(200).json({ message: "Chats Supprimés !" });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] --- deleteChats Controller: ERREUR ---`, error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};