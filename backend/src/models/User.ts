// src/models/User.ts

import mongoose from "mongoose";
// randomUUID n'est pas nécessaire pour l'ID d'un sous-document Mongoose
// car Mongoose génère automatiquement un _id pour chaque élément de tableau.
// import { randomUUID } from "crypto";

// Interface pour un message de chat, aide TypeScript à comprendre la structure
export interface ChatMessage {
  role: "user" | "assistant" | "system"; // Les rôles spécifiques attendus par l'API OpenAI
  content: string;
  // Pas besoin d'un 'id' manuellement si Mongoose gère les sous-documents
}

const chatSchema = new mongoose.Schema({
  // Mongoose génère automatiquement un _id pour chaque élément dans un tableau de sous-documents.
  // Supprimer 'id' si tu n'as pas besoin d'un ID spécifique supplémentaire,
  // ou si tu en as besoin, assure-toi qu'il n'entre pas en conflit avec _id de Mongoose.
  // Pour la compatibilité avec OpenAI, 'role' et 'content' suffisent.
  // id: {
  //   type: String,
  //   default: randomUUID(), // randomUUID() est appelé une seule fois au chargement du module, pas à chaque création !
  // },
  role: {
    type: String,
    // C'est la CORRECTION CRUCIALE pour l'erreur de type !
    // On spécifie que 'role' ne peut être que l'une de ces valeurs.
    enum: ["user", "assistant", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
});

// NOUVEAU: Schéma pour une conversation
const conversationSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "Nouvelle Discussion", // Titre par défaut
  },
  messages: {
    type: [chatSchema], // Chaque conversation a son propre tableau de messages
    default: [],
  },
}, { timestamps: true }); // Ajoute createdAt et updatedAt à chaque conversation


const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Le tableau 'chats' est maintenant basé sur 'chatSchema' et est un tableau par défaut vide.
  conversations: { // NOUVEAU CHAMP
    type: [conversationSchema],
    default: [],
  },
  profileImage: { type: String, default: "" },
  status: { type: String, default: "" },

  role: {
    type: String,
    enum: ["user", "redacteur", "admin"],
    default: "user",
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission',
  }],
}, { timestamps: true }); // Mongoose ajoute automatiquement createdAt et updatedAt

export default mongoose.model("User", userSchema);