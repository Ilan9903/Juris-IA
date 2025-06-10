import axios from "axios";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  checkAuthStatus,
  loginUser,
  logoutUser,
  signupUser,
  updateUserStatus,
} from "../helpers/api-communicator";

import { AuthContext, UserAuth } from "./authContextDef";

type User = {
  name: string;
  email: string;
  profileImage?: string;
  status?: "online" | "idle" | "offline";
  role?: "user" | "redacteur" | "admin";
};

const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const activityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setActivityStatus = useCallback(async (newStatus: "online" | "idle" | "offline") => {
    if (!isLoggedIn || !user || user.status === newStatus) return;

    const previousStatus = user.status;
    setUser((prevUser) => (prevUser ? { ...prevUser, status: newStatus } : null));

    try {
      await updateUserStatus(newStatus);
    } catch (error) {
      console.error("Erreur mise à jour statut :", error);
      setUser((prevUser) => (prevUser ? { ...prevUser, status: previousStatus } : null));
    }
  }, [isLoggedIn, user]);

  const resetActivityTimer = useCallback(() => {
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }

    if (isLoggedIn && user?.status === "idle") {
      setActivityStatus("online");
    }

    activityTimerRef.current = setTimeout(() => {
      setUser(currentActiveUser => {
        if (currentActiveUser && currentActiveUser.status === "online" && isLoggedIn) {
          setActivityStatus("idle");
        }
        return currentActiveUser;
      });
    }, INACTIVITY_TIMEOUT);
  }, [isLoggedIn, user?.status, setActivityStatus]);

  const handleActivity = useCallback(() => {
    resetActivityTimer();
  }, [resetActivityTimer]);

  useEffect(() => {
    if (isLoggedIn && user) {
      document.addEventListener("mousemove", handleActivity);
      document.addEventListener("keydown", handleActivity);
      document.addEventListener("click", handleActivity);
      document.addEventListener("scroll", handleActivity);

      if (user.status === "online") {
        resetActivityTimer();
      }
    }

    return () => {
      document.removeEventListener("mousemove", handleActivity);
      document.removeEventListener("keydown", handleActivity);
      document.removeEventListener("click", handleActivity);
      document.removeEventListener("scroll", handleActivity);
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
        activityTimerRef.current = null;
      }
    };
  }, [isLoggedIn, user, handleActivity, resetActivityTimer]);

  useEffect(() => {
    async function initialAuthCheck() {
      setLoading(true);
      try {
        const data = await checkAuthStatus(); // data est { message: string, user: UserDataFromServer }
        if (data && data.user) { // ✅ Vérifier data ET data.user
          setUser({
            email: data.user.email, // ✅ Utiliser data.user.email
            name: data.user.name,   // ✅ Utiliser data.user.name
            profileImage: data.user.profileImage, // ✅ Utiliser data.user.profileImage
            status: data.user.status || "offline",  // ✅ Utiliser data.user.status
            role: data.user.role, // ✅ Récupérer le rôle
          });
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          console.log("Non authentifié (401)");
        } else {
          console.error("Erreur authCheck:", error);
        }
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initialAuthCheck();
  }, []);

  useEffect(() => {
    if (isLoggedIn && user && user.status !== "online") {
      setActivityStatus("online");
    }
  }, [isLoggedIn, user, setActivityStatus]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginUser(email, password);
    if (data) {
      setUser({
        email: data.email,
        name: data.name,
        profileImage: data.profileImage,
        status: data.status || "online",
        role: data.role,
      });
      setIsLoggedIn(true);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const data = await signupUser(name, email, password);
    if (data) {
      setUser({
        email: data.email,
        name: data.name,
        profileImage: data.profileImage,
        status: data.status || "online",
        role: data.role,
      });
      setIsLoggedIn(true);
    }
  }, []);

  const logout = useCallback(async () => {
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
      activityTimerRef.current = null;
    }
    await logoutUser();
    setIsLoggedIn(false);
    setUser(null);
    window.location.reload();
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    //setUser({ ...updatedUser });
    setUser(prevUser => ({ ...prevUser, ...updatedUser } as User));
  }, []);

  const contextValue: UserAuth = useMemo(() => ({
    user,
    isLoggedIn,
    loading,
    login,
    logout,
    signup,
    updateUser,
    setActivityStatus,
  }), [user, isLoggedIn, loading, login, logout, signup, updateUser, setActivityStatus]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
