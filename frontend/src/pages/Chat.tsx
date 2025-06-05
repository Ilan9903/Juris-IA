// frontend_src/pages/Chat.tsx
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import red from "@mui/material/colors/red";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FaPlus, FaTimes } from "react-icons/fa";
import { IoMdSend } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import ChatItem from "../components/chat/ChatItem";
import { useAuth } from "../context/useAuth";
import {
  analyzeDocumentWithQuestion,
  deleteUserChats,
  getUserChats,
  sendChatRequest,
} from "../helpers/api-communicator";

type Message = {
  role: "user" | "assistant";
  content: string; // Assumons que content sera toujours une chaîne, même vide, après chargement/création
  isDocumentResponse?: boolean;
  documentName?: string;
};

const Chat = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null); // Peut toujours être utile pour .focus()
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const auth = useAuth();
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState(""); // Nouvel état pour le champ de saisie
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    if (!auth?.user) {
      navigate("/login");
    }
  }, [auth, navigate]);

  useLayoutEffect(() => {
    if (auth?.isLoggedIn && auth.user) {
      getUserChats()
        .then((data) => {
          if (data && data.chats) {
            setChatMessages([...data.chats.map((chat: any) => ({ ...chat, content: chat.content || '' }))]); // S'assurer que content est une chaîne
          }
        })
        .catch((err) => {
          console.log(err);
          toast.error("Erreur : Chargement des chats échoué.");
        });
    }
  }, [auth, auth?.isLoggedIn, auth?.user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const allowedTypes = ["text/plain", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Type de fichier non supporté: ${file.name}. Veuillez sélectionner un .txt, .pdf, .doc ou .docx.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error(`Le fichier "${file.name}" est trop volumineux (max 10MB).`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
      setInputValue(""); // Vider l'input texte quand un fichier est sélectionné pour la question sur le doc
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

  const handleSubmit = async () => {
    const content = inputValue.trim(); // Utiliser l'état inputValue
    // console.log("handleSubmit triggered. Content:", content, "SelectedFile:", selectedFile, "IsAnalyzing:", isAnalyzing);

    if (!selectedFile && !content) return;

    if (selectedFile) {
      if (!content) {
        toast.error("Veuillez poser une question concernant le document sélectionné.");
        return;
      }
      const questionForFile = content;
      setInputValue(""); // Vider l'input
      const userMessage: Message = { role: "user", content: `Question sur le document "${selectedFile.name}": ${questionForFile}` };
      setChatMessages((prev) => [...prev, userMessage]);
      setIsAnalyzing(true);
      const analysisToastId = toast.loading(`Analyse de "${selectedFile.name}" en cours...`);
      const currentFileForAnalysis = selectedFile;
      try {
        const analysisData = await analyzeDocumentWithQuestion(currentFileForAnalysis, questionForFile);
        const assistantMessage: Message = { role: "assistant", content: analysisData.answer || "Je n'ai pas pu trouver de réponse.", isDocumentResponse: true, documentName: analysisData.originalFilename || currentFileForAnalysis.name };
        setChatMessages((prev) => [...prev, assistantMessage]);
        toast.success("Analyse terminée.", { id: analysisToastId });
      } catch (error: unknown) {
        console.error("Erreur handleSubmit (analyse):", error);
        let errorMessage = "Erreur lors de l'analyse du document.";
        if (typeof error === "object" && error !== null) {
          if ("response" in error && typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === "string") {
            errorMessage = (error as { response: { data: { message: string } } }).response.data.message;
          } else if ("message" in error && typeof (error as { message?: string }).message === "string") {
            errorMessage = (error as { message: string }).message;
          }
        }
        const assistantErrorMessage: Message = { role: "assistant", content: `Erreur d'analyse (${currentFileForAnalysis.name}): ${errorMessage}`, isDocumentResponse: true, documentName: currentFileForAnalysis.name };
        setChatMessages((prev) => [...prev, assistantErrorMessage]);
        toast.error(errorMessage, { id: analysisToastId });
      } finally {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsAnalyzing(false);
      }
    } else if (content) {
      setInputValue(""); // Vider l'input
      const newMessage: Message = { role: "user", content };
      setChatMessages((prev) => [...prev, newMessage]);
      const loadingToastId = toast.loading("Envoi du message...");
      try {
        const chatData = await sendChatRequest(content);
        if (chatData && chatData.chats) {
          setChatMessages([...chatData.chats.map((chat: any) => ({ ...chat, content: chat.content || '' }))]); // S'assurer que content est une chaîne
        } else {
          setChatMessages((prev) => [...prev, { role: "assistant", content: "Réponse inattendue du serveur." }]);
        }
        toast.success("Message envoyé.", { id: loadingToastId });
      } catch (error) {
        console.error("Erreur handleSubmit (chat normal):", error);
        toast.error("Erreur : Message non envoyé.", { id: loadingToastId });
      }
    }
  };

  const handleDeleteChats = async () => {
    try {
      toast.loading("Suppression des chats...", { id: "deletechats" });
      await deleteUserChats();
      setChatMessages([]);
      toast.success("Succès : Chats effacés.", { id: "deletechats" });
    } catch (error) {
      console.log(error);
      toast.error("Erreur : Chats non effacés.", { id: "deletechats" });
    }
  };

  if (!auth || !auth.user) {
    return <Typography color="white">Chargement...</Typography>;
  }

  const userNameInitials = auth.user.name?.split(" ").map((n) => n[0]).join("") ?? "?";

  const chatContainerSx = {
    flexGrow: 1,
    overflowY: "auto",
    p: { xs: 1, sm: isMobile ? 1.5 : 2, md: 2 },
    bgcolor: "transparent",
    '&::-webkit-scrollbar': { width: '8px' },
    '&::-webkit-scrollbar-track': { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' },
    '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0, 255, 252, 0.3)', borderRadius: '4px', '&:hover': { backgroundColor: 'rgba(0, 255, 252, 0.5)' } },
  };

  const inputAreaSx = {
    p: { xs: 1.5, sm: 1.5 },
    backgroundColor: "transparent",
    mt: 1,
  };

  const textInputPaperSx = {
    display: "flex",
    alignItems: "center",
    p: "8px 12px",
    borderRadius: "28px",
    backgroundColor: "rgb(17,29,39)",
    boxShadow: "0px 2px 8px rgba(0,0,0,0.5)",
  };

  // Condition pour désactiver le bouton d'envoi
  const isSendButtonDisabled = isAnalyzing || (!selectedFile && !inputValue.trim());

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "100%",
        // pt: '80px',
        boxSizing: 'border-box',
        bgcolor: "#0b1929",
        overflow: 'hidden',
      }}
    >
      {/* Sidebar */}
      <Box
        sx={{
          display: { md: "flex", xs: "none", sm: "none" },
          flexDirection: "column",
          flexShrink: 0,
          width: "280px",
          height: "100%",
          marginTop: 2.2,
          p: 2,
          boxSizing: 'border-box',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            bgcolor: "rgb(17,29,39)",
            borderRadius: "16px",
            p: 2,
            boxShadow: "0px 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <Avatar
            sx={{
              mx: "auto", my: 2, bgcolor: "white", color: "black",
              fontWeight: 700, width: 60, height: 60, fontSize: "1.5rem",
              border: `2px solid ${auth.user.profileImage ? '#03a3c2' : 'transparent'}`
            }}
            src={auth.user.profileImage || undefined}
          >
            {!auth.user.profileImage && userNameInitials}
          </Avatar>
          <Typography variant="h6" sx={{ mx: "auto", fontFamily: "work sans", textAlign: "center", color: "#03a3c2", mb: 1, wordBreak: "break-word" }}>
            {auth.user.name}
          </Typography>
          <Typography sx={{ fontFamily: "work sans", my: 1, p: 1, textAlign: "center", fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>
            Posez vos questions juridiques. Évitez les informations personnelles.
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={handleDeleteChats} sx={{ width: "90%", mb: 1, color: "white", fontWeight: "600", borderRadius: "20px", mx: "auto", bgcolor: red[700], "&:hover": { bgcolor: red[800] } }}>
            Supprimer Chats
          </Button>
        </Paper>
      </Box>

      {/* Chat Main */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          height: "100%",
          overflow: 'hidden',
          minWidth: { md: "400px" },
          maxWidth: { md: "1300px" },
          mx: "auto",
          width: "100%",
          p: { xs: 1, sm: isMobile ? 1 : 1.5, md: 2 }
        }}
      >
        <Typography sx={{
          fontSize: isMobile ? "1.5rem" : "clamp(24px, 5vw, 36px)", // Taille de police du titre ajustée
          color: "white", mb: 1, marginTop: 1, mx: "auto", fontWeight: "600", textAlign: "center"
        }}>
          Juris IA - GPT 4.1-mini
        </Typography>

        <Box sx={chatContainerSx} > {/* Correction ici: sx={chatContainerSx} */}
          {chatMessages.map((chat, index) => (
            <ChatItem
              content={chat.content} // Assurez-vous que chat.content est toujours une chaîne ici
              role={chat.role}
              key={`${index}-${chat.role}-${(chat.content || '').substring(0, 10)}`} // Clé plus robuste
            />
          ))}
          <div ref={messagesEndRef} />
        </Box>

        <Box sx={inputAreaSx}>
          {selectedFile && !isAnalyzing && (
            <Box sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              p: "4px 12px", mb: 1, backgroundColor: 'rgb(28, 40, 51)', borderRadius: '16px',
              border: '1px solid #03a3c230', maxWidth: '100%', alignSelf: 'center',
            }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mr: 1 }}>
                {selectedFile.name}
              </Typography>
              <IconButton size="small" onClick={handleRemoveFile} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#03a3c2' }, p: 0.2 }} title="Retirer le document">
                <FaTimes />
              </IconButton>
            </Box>
          )}
          <Paper component="form" sx={textInputPaperSx} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <input
              type="file"
              hidden
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={isAnalyzing}
            />
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              sx={{ color: isAnalyzing ? "grey" : "#03a3c2", p: "10px" }}
              disabled={isAnalyzing}
              title="Joindre un document"
            >
              <FaPlus />
            </IconButton>
            <input
              ref={inputRef} // Garder la ref si besoin pour .focus()
              type="text"
              placeholder={isAnalyzing ? "Analyse en cours..." : (selectedFile ? "Question sur le document..." : "Envoyer un message...")}
              style={{
                flexGrow: 1,
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
                color: "white",
                fontSize: isMobile ? "0.9rem" : "1rem", // Taille de police de l'input ajustée
                padding: isMobile ? "8px" : "10px",
              }}
              value={inputValue} // Lier à l'état
              onChange={(e) => setInputValue(e.target.value)} // Mettre à jour l'état
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={isAnalyzing}
            />
            <IconButton
              type="submit"
              onClick={handleSubmit}
              sx={{ color: isSendButtonDisabled ? "grey" : "#03a3c2", p: "10px" }}
              disabled={isSendButtonDisabled} // Utiliser la variable pour l'état disabled
              title="Envoyer"
            >
              {isAnalyzing ? <CircularProgress size={24} sx={{ color: "#00fffc" }} /> : <IoMdSend />}
            </IconButton>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Chat;