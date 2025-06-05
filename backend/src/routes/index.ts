import { Router } from "express";
import adminRoutes from "./admin-routes.js";
import chatRoutes from "./chat-routes.js";
import documentAnalysisRoutes from "./document-analysis-routes.js";
import legalArticleRoutes from "./legal-articles.js";
import userRoutes from "./user-routes.js";

const appRouter = Router();

appRouter.use("/user", userRoutes); //domain/api/v1/user
appRouter.use("/chat", chatRoutes); //domain/api/v1/chats
appRouter.use("/document-analysis", documentAnalysisRoutes); //domain/api/v1/document-analysis
appRouter.use("/articles", legalArticleRoutes); //domain/api/v1/articles
appRouter.use("/admin", adminRoutes); //domain/api/v1/admin

export default appRouter;
