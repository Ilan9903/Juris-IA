// models/LegalArticle.ts
import mongoose from "mongoose";

const LegalArticleSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        category: [{ type: String }],
        isUniversal: { type: Boolean, default: false },
        pdfUrl: { type: String, default: "" }  // ✅ champ facultatif pour un PDF
    },
    {
        timestamps: true
    }
);

export const LegalArticle = mongoose.model("LegalArticle", LegalArticleSchema);