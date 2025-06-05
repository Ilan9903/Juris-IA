// src/app.ts

// dotenv.config(); // ⚠️ C'est mieux de le faire une seule fois et au tout début dans index.ts

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
// import Permission from "./models/Permission.js"; // <-- SUPPRIME CET IMPORT !
import appRouter from "./routes/index.js";

const app = express();

// middlewares
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());

if (!process.env.COOKIE_SECRET) {
    console.error("ERREUR FATALE: COOKIE_SECRET n'est pas défini dans les variables d'environnement !");
    process.exit(1); // Arrête l'application si le secret est manquant
}
app.use(cookieParser(process.env.COOKIE_SECRET));

// remove it in production
app.use(morgan("dev"));

app.use("/api/v1", appRouter);

// Middleware global pour gérer les erreurs
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[${new Date().toISOString()}] ERREUR GLOBALE :`, err);
    res.status(err.status || 500).json({
        message: err.message || "Erreur interne du serveur",
        // optionnel: stack trace uniquement en dev
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
});

export default app;