// src/routes/chat-routes.ts
import { Router } from "express";
import {
  addMessageToConversation,
  createNewConversation,
  deleteConversation,
  getAllConversations,
  getMessagesForConversation,
} from "../controllers/chat-controllers.js";
import { verifyToken } from "../utils/token-manager.js";
import { chatCompletionValidator, validate } from "../utils/validators.js";

const chatRoutes = Router();

// NOUVELLES ROUTES POUR LES CONVERSATIONS
chatRoutes.get("/conversations", verifyToken, getAllConversations); // Obtenir la liste des conversations (titres/IDs)
chatRoutes.get("/conversations/:id", verifyToken, getMessagesForConversation); // Obtenir les messages d'une conversation spécifique
chatRoutes.post("/conversations", verifyToken, createNewConversation); // Créer une nouvelle conversation
chatRoutes.post("/conversations/:id/messages", validate(chatCompletionValidator), verifyToken, addMessageToConversation); // Ajouter un message à une conversation
chatRoutes.delete("/conversations/:id", verifyToken, deleteConversation); // Supprimer une conversation

export default chatRoutes;