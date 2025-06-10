// frontend_src/pages/Chat.tsx

// --- Imports de React et des librairies ---
// CORRECTION 1: 'useLayoutEffect' est retiré car il a été remplacé par 'useEffect' pour le scroll.
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// --- Imports des icônes ---
import AddCommentIcon from '@mui/icons-material/AddComment';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import { FaPlus, FaTimes } from "react-icons/fa";
import { IoMdSend } from "react-icons/io";

// --- Imports de Material-UI ---
import {
  Avatar, Box, Button, CircularProgress, Divider,
  Drawer, IconButton, List,
  ListItem, ListItemButton, ListItemText, Paper,
  TextField,
  Tooltip, Typography
} from "@mui/material";
import red from "@mui/material/colors/red";

// --- Imports des composants et helpers locaux ---
import ChatItem from "../components/chat/ChatItem";
import ChatItemSkeleton from "../components/chat/ChatItemSkeleton";
import ConfirmationModal from "../components/modals/ConfirmationModal";
import { useUI } from "../context/UIContext"; // Import du contexte UI pour le Drawer
import { useAuth } from "../context/useAuth";
import {
  analyzeDocumentWithQuestion,
  deleteConversation,
  getConversationMessages,
  getConversationsList,
  sendChatMessage,
  startNewConversation,
  updateConversationTitle,
} from "../helpers/api-communicator";

// --- Définition des types pour plus de clarté ---
type ConversationSnippet = {
  _id: string;
  title: string;
  createdAt: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

// Le composant Chat reçoit maintenant les props pour le Drawer
const Chat = ({ isDrawerOpen, setDrawerOpen }: { isDrawerOpen: boolean, setDrawerOpen: (isOpen: boolean) => void }) => {
  // --- Hooks et États ---
  const navigate = useNavigate();
  const auth = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [conversations, setConversations] = useState<ConversationSnippet[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const { openSettingsModal } = useUI();

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  // --- Effets (useEffect) ---
  useEffect(() => {
    if (!auth?.user) {
      navigate("/login");
    }
  }, [auth, navigate]);

  useEffect(() => {
    if (auth?.isLoggedIn && auth.user) {
      setIsLoadingConversations(true);
      getConversationsList()
        .then((data) => {
          const sortedConversations = data.conversations?.sort((a: ConversationSnippet, b: ConversationSnippet) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
          setConversations(sortedConversations);
          if (sortedConversations.length > 0) {
            setActiveConversationId(sortedConversations[0]._id);
          }
        })
        .catch((err) => {
          console.error(err);
          toast.error("Erreur : Chargement de l'historique échoué.");
        })
        .finally(() => {
          setIsLoadingConversations(false);
        });
    }
  }, [auth]);

  useEffect(() => {
    if (activeConversationId) {
      setIsLoadingMessages(true);
      setChatMessages([]);
      getConversationMessages(activeConversationId)
        .then((data) => {
          setChatMessages(data.messages || []);
        })
        .catch((err) => {
          console.error(err);
          setChatMessages([]);
          toast.error("Impossible de charger cette conversation.");
        })
        .finally(() => {
          setIsLoadingMessages(false);
        });
    } else {
      setChatMessages([]);
    }
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // --- Gestionnaires d'événements ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const allowedTypes = ["text/plain", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Type de fichier non supporté: ${file.name}.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
      setInputValue("");
      toast.success(`Fichier "${file.name}" prêt. Posez votre question.`);
      inputRef.current?.focus();
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Fichier désélectionné.");
  };

  const handleNewConversation = async () => {
    try {
      const data = await startNewConversation();
      setConversations(prev => [data.conversation, ...prev]);
      setActiveConversationId(data.conversation._id);
      setDrawerOpen(false); // Fermer le drawer après la création
    } catch (error) {
      toast.error("Impossible de démarrer une nouvelle discussion.");
    }
  };

  const handleStartEdit = (conv: ConversationSnippet) => {
    setEditingConvId(conv._id);
    setEditingTitle(conv.title);
  };

  const handleCancelEdit = () => {
    setEditingConvId(null);
    setEditingTitle("");
  };

  const handleTitleUpdate = async (conversationId: string) => {
    if (!editingTitle.trim()) {
      toast.error("Le titre ne peut pas être vide.");
      return;
    }

    // Optimistic UI update
    const originalConversations = [...conversations];
    const newConversations = conversations.map(c =>
      c._id === conversationId ? { ...c, title: editingTitle } : c
    );
    setConversations(newConversations);
    handleCancelEdit(); // Quitte le mode édition immédiatement

    try {
      await updateConversationTitle(conversationId, editingTitle);
    } catch (error) {
      toast.error("Erreur, impossible de renommer.");
      setConversations(originalConversations); // Revert en cas d'erreur
    }
  };

  // MODIFICATION : Cette fonction va maintenant préparer la suppression et ouvrir la modale
  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation(); // Empêche de cliquer sur l'item de liste en même temps
    setConversationToDelete(conversationId); // On stocke l'ID de la conversation à supprimer
    setConfirmModalOpen(true); // On ouvre la modale de confirmation
  };

  // NOUVELLE FONCTION : Cette fonction sera appelée si l'utilisateur clique sur "Confirmer" dans la modale
  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return; // Sécurité au cas où

    try {
      await deleteConversation(conversationToDelete);
      toast.success("Discussion supprimée.");

      const updatedConversations = conversations.filter(c => c._id !== conversationToDelete);
      setConversations(updatedConversations);

      // Si la conversation supprimée était l'active, on passe à la suivante ou à rien
      if (activeConversationId === conversationToDelete) {
        setActiveConversationId(updatedConversations.length > 0 ? updatedConversations[0]._id : null);
      }
    } catch (error) {
      toast.error("Impossible de supprimer la discussion.");
    } finally {
      // Quoi qu'il arrive, on ferme la modale et on réinitialise l'ID
      setConfirmModalOpen(false);
      setConversationToDelete(null);
    }
  };

  const handleSubmit = async () => {
    const content = inputValue.trim();

    if (selectedFile) {
      if (!content) {
        toast.error("Veuillez poser une question concernant le document sélectionné.");
        return;
      }
      const questionForFile = content;
      setInputValue("");
      const userMessage: Message = { role: "user", content: `Question sur le document "${selectedFile.name}": ${questionForFile}` };
      setChatMessages(prev => [...prev, userMessage]);
      setIsAnalyzing(true);
      const analysisToastId = toast.loading(`Analyse de "${selectedFile.name}"...`);
      const currentFileForAnalysis = selectedFile;
      try {
        const analysisData = await analyzeDocumentWithQuestion(currentFileForAnalysis, questionForFile);
        const assistantMessage: Message = { role: "assistant", content: analysisData.answer || "Je n'ai pas pu trouver de réponse." };
        setChatMessages(prev => [...prev, assistantMessage]);
        toast.success("Analyse terminée.", { id: analysisToastId });
      } catch (error) {
        const assistantErrorMessage: Message = { role: "assistant", content: `Désolé, une erreur est survenue lors de l'analyse.` };
        setChatMessages(prev => [...prev, assistantErrorMessage]);
        toast.error("Erreur d'analyse.", { id: analysisToastId });
      } finally {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsAnalyzing(false);
      }
      return;
    }

    if (!content) return;
    let conversationIdToUse = activeConversationId;
    if (!conversationIdToUse) {
      try {
        const data = await startNewConversation();
        const newConv = data.conversation;
        setConversations(prev => [newConv, ...prev]);
        setActiveConversationId(newConv._id);
        conversationIdToUse = newConv._id;
      } catch (error) {
        toast.error("Erreur lors de la création de la discussion.");
        return;
      }
    }

    if (conversationIdToUse) {
      setInputValue("");
      const newMessage: Message = { role: "user", content };
      setChatMessages(prev => [...prev, newMessage]);
      try {
        const data = await sendChatMessage(conversationIdToUse, content);
        setChatMessages(data.messages);
        if (data.updatedTitle) {
          // Mettre à jour la liste des conversations dans la sidebar
          setConversations(prevConvos =>
            prevConvos.map(conv =>
              conv._id === conversationIdToUse
                ? { ...conv, title: data.updatedTitle } // Remplacer le titre de la conversation active
                : conv
            )
          );
        }
      } catch (error) {
        toast.error("Erreur : Message non envoyé.");
        setChatMessages(prev => prev.slice(0, prev.length - 1));
      }
    }
  };

  if (!auth?.user) {
    return <Typography color="white">Chargement...</Typography>;
  }

  const userNameInitials = auth.user.name?.split(" ").map((n) => n[0]).join("") ?? "?";
  const isSendButtonDisabled = isAnalyzing || (!selectedFile && !inputValue.trim());

  // --- JSX pour la Sidebar (pour éviter la duplication) ---
  const SidebarContent = () => (
    <Paper
      elevation={0}
      sx={{
        display: "flex", flexDirection: "column", width: "88.5%", height: "100%",
        bgcolor: "#172331", borderRadius: { xs: 0, md: "16px" }, p: 2,
        boxShadow: "none", marginTop: "18px", overflowX: "hidden", overflowY: "auto",
      }}
    >
      <Button
        variant="outlined" startIcon={<AddCommentIcon />} onClick={handleNewConversation}
        sx={{ borderColor: '#03a3c2', color: 'white', '&:hover': { borderColor: 'white', bgcolor: "rgba(0, 0, 0, 0.05)", color: '#03a3c2' } }}
      >
        Nouveau Chat
      </Button>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', my: 2 }} />
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {isLoadingConversations ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}><CircularProgress /></Box>
        ) : (
          <List sx={{ p: 0, bgcolor: 'transparent', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {conversations.map((conv) => (
              <ListItem key={conv._id} disablePadding secondaryAction={
                <>
                  <Tooltip title="Renommer">
                    <IconButton edge="end" sx={{ mr: 0 }} onClick={() => handleStartEdit(conv)}>
                      <EditIcon sx={{
                        mr: -1.5, fontSize: '1rem', color: 'rgba(255, 255, 255, 0.4)', '&:hover': { color: 'white' }
                      }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton edge="end" onClick={(e) => handleDeleteConversation(e, conv._id)}>
                      <DeleteIcon sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', '&:hover': { color: red[500] } }} />
                    </IconButton>
                  </Tooltip>
                </>
              }>
                {editingConvId === conv._id ? (
                  // AFFICHER LE CHAMP DE TEXTE EN MODE ÉDITION
                  <TextField
                    variant="standard"
                    fullWidth
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleTitleUpdate(conv._id)} // Sauvegarde quand on clique ailleurs
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleUpdate(conv._id);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    sx={{ px: 2, '& .MuiInput-underline:before': { borderBottomColor: '#03a3c2' } }}
                    InputProps={{ style: { color: "white", fontSize: '0.875rem' } }}
                  />
                ) : (
                  <ListItemButton
                    selected={activeConversationId === conv._id}
                    onClick={() => {
                      setActiveConversationId(conv._id);
                      setDrawerOpen(false); // Fermer le drawer après sélection
                    }}
                    // Ajouter un peu de style aux items
                    sx={{
                      borderRadius: '8px',
                      mb: 0.5,
                      '&.Mui-selected': { bgcolor: 'rgba(0, 255, 255, 0.05)', '&:hover': { bgcolor: 'rgba(0, 255, 252, 0.1)' } }
                    }}
                  >
                    <ListItemText
                      primary={conv.title}
                      primaryTypographyProps={{
                        noWrap: true,
                        sx: { fontSize: '0.875rem', color: activeConversationId === conv._id ? '#00fffc' : 'white' }
                      }}
                    />
                  </ListItemButton>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', my: 1 }} />
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Conteneur cliquable pour le profil */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, borderRadius: '8px', p: 1 }}
        >
          <Avatar
            sx={{ bgcolor: "white", color: "black", fontWeight: 700, width: 40, height: 40 }}
            src={auth.user?.profileImage || undefined}
          >
            {(!auth.user?.profileImage) && userNameInitials}
          </Avatar>
          <Typography sx={{ color: 'white', fontWeight: 600, wordBreak: "break-word" }}>
            {auth.user?.name}
          </Typography>
        </Box>

        {/* CORRECTION : Le bouton ouvre maintenant la modale */}
        <Tooltip title="Paramètres">
          <IconButton onClick={openSettingsModal}> {/* <--- MODIFICATION ICI */}
            <SettingsIcon sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );

  // C'est cet objet de style qui cible la bonne zone
  const chatContainerSx = {
    flexGrow: 1, // Pour qu'il prenne l'espace vertical disponible
    overflowY: 'auto', // Pour activer le défilement vertical si besoin
    p: { xs: 1, sm: 2, md: 2 },
    bgcolor: "transparent",

    // --- C'est ici que la magie opère, uniquement pour cet élément ---
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'rgb(23, 35, 49)', // Fond sombre et discret
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(0, 255, 252, 0.4)', // Poignée avec votre couleur d'accent
      borderRadius: '4px',
      '&:hover': {
        backgroundColor: 'rgba(0, 255, 252, 0.7)', // Plus visible au survol
      }
    },
  };

  return (
    <>
      {/* Conteneur principal du chat */}
      <Box
        sx={{
          display: "flex", flexDirection: "row", width: "100%", height: "100%",
          boxSizing: 'border-box', bgcolor: "#0b1929", overflow: 'hidden'
        }}
      >
        {/* Sidebar Fixe pour Desktop */}
        <Box
          sx={{
            display: { md: "flex", xs: "none", sm: "none" }, flexDirection: "column",
            flexShrink: 0, width: "280px", height: "100%", p: 2, boxSizing: 'border-box',
          }}
        >
          <SidebarContent />
        </Box>

        {/* Sidebar en "Tiroir" (Drawer) pour Mobile */}
        <Drawer
          anchor="left"
          open={isDrawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: { width: "280px", bgcolor: "rgb(17,29,39)" }
          }}
        >
          <SidebarContent />
        </Drawer>

        {/* Chat Main */}
        <Box
          sx={{
            display: "flex", flexDirection: "column", flexGrow: 1, height: "100%",
            overflow: 'hidden', maxWidth: { md: "900px" }, mx: "auto", width: "100%",
            p: { xs: 1, sm: 1, md: 2 }
          }}
        >
          <Typography sx={{ fontSize: "clamp(24px, 5vw, 36px)", color: "white", mb: 1, marginTop: "2px", fontWeight: "600", textAlign: "center" }}>
            Juris IA - GPT 4.1-mini
          </Typography>

          <Box sx={chatContainerSx}>
            {isLoadingMessages ? (
              <Box>
                <ChatItemSkeleton role="assistant" />
                <ChatItemSkeleton role="user" />
                <ChatItemSkeleton role="assistant" />
              </Box>
            ) : chatMessages.length > 0 ? (
              chatMessages.map((chat, index) => <ChatItem key={`${activeConversationId}-${index}`} content={chat.content} role={chat.role} />)
            ) : (
              <Typography sx={{ textAlign: 'center', color: 'grey.500', mt: 4 }}>
                Commencez une nouvelle discussion ou sélectionnez-en une dans l'historique.
              </Typography>
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{ p: { xs: 1.5, sm: 2 }, backgroundColor: "transparent", mt: 1 }}>
            {selectedFile && !isAnalyzing && (
              <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: "4px 12px", mb: 1,
                backgroundColor: 'rgb(28, 40, 51)', borderRadius: '16px', border: '1px solid #00fffc30',
                maxWidth: '100%', alignSelf: 'center',
              }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mr: 1 }}>
                  {selectedFile.name}
                </Typography>
                <IconButton size="small" onClick={handleRemoveFile} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#00fffc' }, p: 0.2 }} title="Retirer le document">
                  <FaTimes />
                </IconButton>
              </Box>
            )}
            <Paper component="form" sx={{ display: "flex", alignItems: "center", p: "8px 12px", borderRadius: "28px", backgroundColor: "rgb(23, 35, 49)" }} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <input
                type="file"
                hidden
                ref={fileInputRef}
                onChange={handleFileChange} // CORRECTION : Connecter l'événement ici
                accept=".txt,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                disabled={isAnalyzing}
              />
              <IconButton onClick={() => fileInputRef.current?.click()} sx={{ color: isAnalyzing ? "grey" : "#00fffc", p: "10px" }} disabled={isAnalyzing} title="Joindre un document">
                <FaPlus />
              </IconButton>
              <input
                ref={inputRef} type="text"
                placeholder={isAnalyzing ? "Analyse en cours..." : ("Envoyer un message...")}
                style={{
                  flexGrow: 1, backgroundColor: "transparent", border: "none", outline: "none",
                  color: "white", fontSize: "1rem", padding: "10px"
                }}
                value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                disabled={isAnalyzing}
              />
              <IconButton type="submit" sx={{ color: isSendButtonDisabled ? "grey" : "#00fffc", p: "10px" }} disabled={isSendButtonDisabled} title="Envoyer">
                {isAnalyzing ? <CircularProgress size={24} sx={{ color: "#00fffc" }} /> : <IoMdSend />}
              </IconButton>
            </Paper>
          </Box>
        </Box>
      </Box>
      <ConfirmationModal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmer la suppression"
        message="Voulez-vous vraiment supprimer cette discussion ? Cette action est irréversible."
      />
    </>
  );
};

export default Chat;