import axios from "axios";

// Configure Axios pour inclure les cookies dans chaque requête
const api = axios.create({
  baseURL: "http://localhost:5000/api/v1",
  withCredentials: true, // ✅ nécessaire pour les cookies
});

export interface GetArticlesParams {
  page?: number;
  limit?: number;
  category?: string | null; // Peut être null si aucune catégorie n'est sélectionnée
  search?: string | null;   // Peut être null si aucun terme de recherche
}

export const loginUser = async (email: string, password: string) => {
  const res = await api.post("/user/login", { email, password });
  if (res.status !== 200) throw new Error("Unable to login");
  return res.data;
};

export const signupUser = async (name: string, email: string, password: string) => {
  const res = await api.post("/user/signup", { name, email, password });
  if (res.status !== 201) throw new Error("Unable to Signup");
  return res.data;
};

export const checkAuthStatus = async () => {
  const res = await api.get("/user/auth-status");
  if (res.status !== 200) throw new Error("Unable to authenticate");
  return res.data;
};

// export const sendChatRequest = async (message: string) => {
//   const res = await api.post("/chat/new", { message });
//   if (res.status !== 200) throw new Error("Unable to send chat");
//   return res.data;
// };

// export const getUserChats = async () => {
//   const res = await api.get("/chat/all-chats");
//   if (res.status !== 200) throw new Error("Unable to get chats");
//   return res.data;
// };

// export const deleteUserChats = async () => {
//   const res = await api.delete("/chat/delete");
//   if (res.status !== 200) throw new Error("Unable to delete chats");
//   return res.data;
// };

// Récupère la liste des titres de conversations pour la sidebar
export const getConversationsList = async () => {
  const res = await axios.get("/chat/conversations");
  if (res.status !== 200) throw new Error("Impossible de récupérer la liste des conversations");
  return res.data;
};

// Récupère les messages d'une conversation spécifique
export const getConversationMessages = async (conversationId: string) => {
  const res = await axios.get(`/chat/conversations/${conversationId}`);
  if (res.status !== 200) throw new Error("Impossible de récupérer les messages de la conversation");
  return res.data;
};

// Démarre une nouvelle conversation vide
export const startNewConversation = async () => {
  const res = await axios.post("/chat/conversations");
  if (res.status !== 201) throw new Error("Impossible de démarrer une nouvelle conversation");
  return res.data;
};

// Envoie un message dans une conversation existante
export const sendChatMessage = async (conversationId: string, message: string) => {
  const res = await axios.post(`/chat/conversations/${conversationId}/messages`, { message });
  if (res.status !== 200) throw new Error("Impossible d'envoyer le message");
  return res.data;
};

// Supprime une conversation
export const deleteConversation = async (conversationId: string) => {
  const res = await axios.delete(`/chat/conversations/${conversationId}`);
  if (res.status !== 200) throw new Error("Impossible de supprimer la conversation");
  return res.data;
};

export const logoutUser = async () => {
  const res = await api.get("/user/logout");
  if (res.status !== 200) throw new Error("Unable to logout");
  return res.data;
};

export const updateUser = async (formData: FormData) => {
  const res = await api.put("/user/updateprofile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (res.status !== 200) throw new Error("Unable to update profile");
  return res.data;
};

export const changeUserPassword = async (currentPassword: string, newPassword: string) => {
  const res = await axios.put("/user/change-password", { currentPassword, newPassword });
  if (res.status !== 200) throw new Error("Impossible de changer le mot de passe");
  return res.data;
};

export const deleteCurrentUserAccount = async () => {
  const res = await axios.delete("/user/delete-account");
  if (res.status !== 200) throw new Error("Impossible de supprimer le compte");
  return res.data;
};

// NOUVELLE FONCTION : Mettre à jour le statut de l'utilisateur
export const updateUserStatus = async (status: "online" | "idle" | "offline") => {
  const res = await api.put("/user/update-status", { status });
  if (res.status !== 200) throw new Error("Unable to update user status");
  return res.data;
};

export const getAllUsers = async () => {
  const res = await api.get("/admin/users");
  if (res.status !== 200) throw new Error("Unable to fetch users");
  return res.data;
};

export const getRecentArticles = async (limit: number = 5) => { // Limite par défaut à 5 articles
  try {
    const res = await api.get(`/articles?limit=${limit}`);
    if (res.status !== 200) {
      console.error("Erreur lors de la récupération des articles récents:", res);
      throw new Error("Impossible de récupérer les articles récents");
    }
    return res.data; // Le backend renvoie directement un tableau d'articles pour cette requête
  } catch (error) {
    console.error("Erreur détaillée lors de la récupération des articles récents:", error);
    throw error; // Relance l'erreur pour que le composant appelant puisse la gérer
  }
};

export const getArticleCategoriesList = async () => {
  try {
    const res = await api.get("/articles/categories"); // L'endpoint que nous avons corrigé
    if (res.status !== 200) {
      console.error("Erreur lors de la récupération des catégories d'articles:", res);
      throw new Error("Impossible de récupérer les catégories d'articles");
    }
    // Le backend renvoie { message: "...", categories: [...] }
    return res.data.categories; // Nous ne renvoyons que le tableau des catégories
  } catch (error) {
    console.error("Erreur détaillée lors de la récupération des catégories d'articles:", error);
    throw error;
  }
};

export const getPagedArticles = async (params: GetArticlesParams = {}) => {
  try {
    // Construit les paramètres de requête dynamiquement
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = queryString ? `/articles?${queryString}` : '/articles';

    const res = await api.get(url);
    if (res.status !== 200) {
      console.error("Erreur lors de la récupération des articles paginés:", res);
      throw new Error("Impossible de récupérer les articles paginés");
    }
    // Le backend renvoie { message: "...", articles: [...], currentPage: X, totalPages: Y, totalArticles: Z }
    return res.data;
  } catch (error) {
    console.error("Erreur détaillée lors de la récupération des articles paginés:", error);
    throw error;
  }
};

export const getArticleDetailsById = async (articleId: string) => {
  try {
    const res = await api.get(`/articles/${articleId}`);
    if (res.status !== 200) {
      console.error(`Erreur lors de la récupération de l'article ${articleId}:`, res);
      throw new Error(`Impossible de récupérer l'article ${articleId}`);
    }
    // Le backend renvoie directement l'objet article
    return res.data;
  } catch (error) {
    console.error(`Erreur détaillée lors de la récupération de l'article ${articleId}:`, error);
    throw error; // Relance l'erreur pour que le composant appelant puisse la gérer
  }
};

// NOUVELLE FONCTION pour envoyer un document et une question pour analyse
export const analyzeDocumentWithQuestion = async (file: File, question: string) => {
  const formData = new FormData();
  formData.append('documentFile', file); // Correspond au nom attendu par multer
  formData.append('question', question);   // Correspond à req.body.question attendu par le contrôleur

  try {
    const res = await api.post("/document-analysis/analyze", formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Important pour l'envoi de fichiers
      },
    });
    if (res.status !== 200) {
      console.error("Erreur lors de l'analyse du document:", res);
      throw new Error("Impossible d'analyser le document");
    }
    // Le backend renvoie { answer: "...", originalFilename: "..." }
    return res.data;
  } catch (error) {
    console.error("Erreur détaillée lors de l'analyse du document:", error);
    throw error;
  }
};