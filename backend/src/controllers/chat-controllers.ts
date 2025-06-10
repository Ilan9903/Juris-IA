// src/controllers/chat-controllers.ts
import { NextFunction, Request, Response } from "express";
import OpenAI from "openai";
import { configureOpenAI } from "../config/openai-config.js";
import PromptTemplate from "../models/PromptTemplate.js";
import User from "../models/User.js";

// Obtenir la liste de toutes les conversations (sans les messages)
export const getAllConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) return res.status(401).send("Utilisateur non trouvé.");

    const conversationsList = user.conversations.map(conv => ({
      _id: conv._id,
      title: conv.title,
      createdAt: conv.createdAt,
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Trier par date de création, la plus récente en premier

    return res.status(200).json({ conversations: conversationsList });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

// Obtenir les messages pour une conversation spécifique
export const getMessagesForConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) return res.status(401).send("Utilisateur non trouvé.");

    const conversation = user.conversations.id(req.params.id);
    if (!conversation) return res.status(404).send("Conversation non trouvée.");

    return res.status(200).json({ messages: conversation.messages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

// Créer une nouvelle conversation vide
export const createNewConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) return res.status(401).send("Utilisateur non trouvé.");

    const newConversation = { title: "Nouvelle Discussion", messages: [] };
    user.conversations.push(newConversation);
    await user.save();

    const savedConversation = user.conversations[user.conversations.length - 1]; // Récupérer la conversation qui vient d'être sauvée pour avoir son _id

    return res.status(201).json({
      message: "Nouvelle conversation créée",
      conversation: {
        _id: savedConversation._id,
        title: savedConversation.title,
        createdAt: savedConversation.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

// Ajouter un message à une conversation existante et obtenir la réponse de l'IA
export const addMessageToConversation = async (req: Request, res: Response, next: NextFunction) => {
  const { message } = req.body;
  const conversationId = req.params.id;
  const openai = configureOpenAI();

  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) return res.status(401).send("Utilisateur non trouvé.");

    const conversation = user.conversations.id(conversationId);
    if (!conversation) return res.status(404).send("Conversation non trouvée.");

    // Variable pour stocker le nouveau titre s'il est généré
    let newTitle = null;

    // Si c'est le premier message de l'utilisateur dans cette conversation
    if (conversation.messages.length === 0) {
      // Prompt spécifique pour demander à l'IA de créer un titre
      const titlePrompt = `Résume la question suivante en un titre court et pertinent de 5 mots maximum. Ne retourne que le titre, rien d'autre. Question: "${message}"`;

      try {
        const titleResponse = await openai.chat.completions.create({
          model: "gpt-4.1-mini-2025-04-14", // Un modèle rapide et peu coûteux est parfait pour ça
          messages: [{ role: "user", content: titlePrompt }],
          max_tokens: 15,
          temperature: 0.3, // Pour un résultat plus prévisible
        });

        // Nettoyer le titre reçu de l'IA (enlever les guillemets, etc.)
        const generatedTitle = titleResponse.choices[0]?.message?.content?.trim().replace(/"/g, "") || "";

        if (generatedTitle) {
          conversation.title = generatedTitle;
          newTitle = generatedTitle; // On sauvegarde le nouveau titre pour le renvoyer au frontend
        }
      } catch (titleError) {
        console.error("Erreur lors de la génération du titre par l'IA:", titleError);
        // En cas d'erreur, on utilise l'ancienne méthode (tronquer le message)
        conversation.title = message.substring(0, 40) + (message.length > 40 ? "..." : "");
        newTitle = conversation.title;
      }
    }

    // Logique existante pour le prompt système
    const juridicalPrompt = await PromptTemplate.findOne({ name: "ASSISTANT_JURIDIQUE_GENERAL", status: "published" });
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    if (juridicalPrompt) {
      messages.push({ role: "system", content: juridicalPrompt.content });
    }

    // Ajouter l'historique de la conversation ACTUELLE
    conversation.messages.forEach(chat => {
      messages.push({ role: chat.role, content: chat.content });
    });
    messages.push({ role: "user", content: message });

    // Sauvegarder le message utilisateur
    conversation.messages.push({ role: "user", content: message });

    // Si c'est le premier message de l'utilisateur, utiliser son contenu pour le titre de la conversation
    if (conversation.messages.length === 1) {
      conversation.title = message.substring(0, 40) + (message.length > 40 ? "..." : "");
    }

    // Appel à l'IA
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4.1-mini-2025-04-14",
      messages: messages,
    });
    const botResponse = chatResponse.choices[0]?.message?.content;

    if (botResponse) {
      conversation.messages.push({ role: "assistant", content: botResponse });
    } else {
      conversation.messages.push({ role: "assistant", content: "Désolé, je n'ai pas pu générer de réponse." });
    }

    await user.save();
    // Renvoyer les messages ET le nouveau titre si il a été créé
    return res.status(200).json({
      messages: conversation.messages,
      updatedTitle: newTitle // Sera null si ce n'est pas le premier message
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};

// Supprimer une conversation
export const deleteConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(res.locals.jwtData.id);
    if (!user) return res.status(401).send("Utilisateur non trouvé.");

    // Utilise .pull() pour retirer le sous-document de l'array
    user.conversations.pull({ _id: req.params.id });
    await user.save();

    return res.status(200).json({ message: "Conversation supprimée" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "ERROR", cause: error.message });
  }
};