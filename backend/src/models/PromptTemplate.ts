// src/models/PromptTemplate.ts

import mongoose from 'mongoose';

const promptTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: false,
        trim: true,
    },
    category: { // Ex: "Legal Persona", "Specific Law", "Tone", "Style"
        type: String,
        required: false,
        trim: true,
    },
    status: { // Ex: "draft", "published", "archived"
        type: String,
        enum: ["draft", "published", "archived"],
        default: "draft",
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Référence à l'utilisateur qui a créé ce prompt
        required: false, // Peut être créé par le système au début
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Référence à l'utilisateur qui l'a mis à jour en dernier
        required: false,
    },
}, { timestamps: true }); // Ajoute des champs createdAt et updatedAt automatiquement

export default mongoose.model('PromptTemplate', promptTemplateSchema);