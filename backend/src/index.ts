// src/index.ts

import dotenv from "dotenv";
dotenv.config();

// Assure-toi d'importer tous tes modèles Mongoose ici
// CELA GARANTIT QUE LEURS SCHEMAS SONT ENREGISTRES AVANT QUE MOONGOOSE NE FASSE DES OPERATIONS DE DB
import "./models/LegalArticle.js"; // Importe le modèle LegalArticle
import "./models/Permission.js"; // <-- L'IMPORT CRUCIAL EST ICI
import "./models/PromptTemplate.js";
import "./models/User.js"; // Importe le modèle User (même si tu n'utilises pas directement la variable ici, l'import enregistre le schéma)

import app from "./app.js"; // Importe l'application Express configurée
import { connectToDatabase } from "./db/connection.js";

// Connections and listeners
const PORT = process.env.PORT || 5000;

// Connecte à la base de données puis démarre le serveur
connectToDatabase()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Server Open & Connected To Database 🤟 on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("Erreur de connexion à la base de données ou de démarrage du serveur:", err);
    process.exit(1); // Arrête l'application en cas d'échec de la connexion
  });