// src/components/chat/ChatItem.tsx

import { Avatar, Box, Paper, Typography } from "@mui/material";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useUI } from "../../context/UIContext";
import { useAuth } from "../../context/useAuth";

function extractCodeFromString(message: string | undefined | null): string[] | null {
  if (typeof message === 'string' && message.includes("```")) {
    const blocks = message.split("```");
    return blocks;
  }
  return null;
}

function isCodeBlock(str: string) {
  if (typeof str !== 'string') {
    return false;
  }
  if (
    str.includes("=") ||
    str.includes(";") ||
    str.includes("[") ||
    str.includes("]") ||
    str.includes("{") ||
    str.includes("}") ||
    str.includes("#") ||
    str.includes("//") ||
    str.includes("<") ||
    str.includes(">") ||
    str.includes("function") ||
    str.includes("const") ||
    str.includes("let") ||
    str.includes("var")
  ) {
    return true;
  }
  return false;
}

const ChatItem = ({
  content,
  role,
}: {
  content: string;
  role: "user" | "assistant";
}) => {
  const { isCompactMode } = useUI(); // Obtenir l'état du mode compact
  const messageBlocks = extractCodeFromString(content);
  const auth = useAuth();

  const getUserInitials = () => {
    if (auth?.user?.name) {
      const nameParts = auth.user.name.split(" ");
      let initials = nameParts[0]?.[0] || '';
      if (nameParts.length > 1) {
        initials += nameParts[nameParts.length - 1]?.[0] || '';
      }
      return initials.toUpperCase();
    }
    return "?";
  };

  const isUser = role === "user";

  // Déterminer les props de l'Avatar en dehors du sx
  const avatarProps: any = {
    sx: {
      color: "white",
      width: 36, height: 36,
      fontSize: "1rem",
      ml: isUser ? 1.5 : 0,
      mr: isUser ? 0 : 1.5,
      alignSelf: "flex-end",
      mt: 0.5,
    }
  };

  if (isUser) {
    if (auth?.user?.profileImage) {
      avatarProps.src = auth.user.profileImage;
      avatarProps.sx.bgcolor = "transparent"; // Fond transparent si image
    } else {
      avatarProps.children = getUserInitials();
      avatarProps.sx.bgcolor = "#005A6E"; // Couleur de fond pour les initiales utilisateur
    }
  } else { // Assistant
    avatarProps.children = <img src="/logo.png" alt="openai" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />;
    avatarProps.sx.bgcolor = "#0a2833"; // Couleur de fond pour avatar IA
  }

  return (
    <Box
      sx={{
        display: "flex",
        p: 0,
        flexDirection: isUser ? "row-reverse" : "row",
        mb: isCompactMode ? 1 : 2,
        alignItems: "flex-end",
      }}
    >
      <Avatar {...avatarProps} /> {/* Appliquer les props conditionnelles ici */}
      <Paper
        elevation={2}
        sx={{
          py: isCompactMode ? "6px" : "10px",
          px: "14px",
          bgcolor: isUser ? "#005A6E" : "rgb(28, 40, 51)",
          borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
          maxWidth: "75%",
          display: "inline-block",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <Box>
          {messageBlocks && messageBlocks.length > 0 ? (
            messageBlocks.map((block, index) =>
              isCodeBlock(block) ? (
                <SyntaxHighlighter
                  style={coldarkDark}
                  language="javascript"
                  key={index}
                  customStyle={{
                    margin: "8px 0",
                    borderRadius: "8px",
                    // padding: "12px",
                    fontSize: "0.875rem",
                  }}
                  showLineNumbers={(block || '').split('\n').length > 3}
                  wrapLines={true}
                  lineNumberStyle={{ color: '#03a3c2', fontSize: '0.75rem' }}
                >
                  {(block || '').trim()}
                </SyntaxHighlighter>
              ) : (
                <Typography sx={{ fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.95)", wordBreak: 'break-word' }} key={index}>
                  {block || ''}
                </Typography>
              )
            )
          ) : (
            <Typography sx={{ fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.95)", wordBreak: 'break-word' }}>
              {content || ''}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatItem;