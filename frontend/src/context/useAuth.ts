// src/context/useAuth.ts
import { useContext } from "react";
// Importe AuthContext et UserAuth depuis le fichier de DÉFINITION du contexte
import { AuthContext, UserAuth } from "./authContextDef";

export const useAuth = (): UserAuth => useContext(AuthContext);