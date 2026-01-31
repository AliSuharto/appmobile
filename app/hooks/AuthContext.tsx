import { useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../core/services/authService";

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  telephone?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Vérifie l'authentification au démarrage
   */
  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");

      if (token) {
        // Vérifier la validité du token
        const result = await authService.verifyToken(token);

        if (result.success && result.user) {
          setIsAuthenticated(true);
          setUser(result.user as User);
          console.log(
            "✅ Utilisateur authentifié au démarrage:",
            result.user.email,
          );
        } else {
          // Token invalide, nettoyer
          await clearAuth();
        }
      }
    } catch (error) {
      console.error("❌ Erreur vérification auth:", error);
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Connexion de l'utilisateur
   */
  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      console.log("🔐 Tentative de connexion pour:", email);
      const result = await authService.login({ email, password });
      console.log("🔐 Résultat de authService.login:", result);
      console.log("📊 Résultat de la connexion:", {
        success: result.success,
        hasToken: !!result.token,
        hasUser: !!result.user,
        message: result.message,
      });

      if (result.success && result.token && result.user) {
        // Stocker le token et les données utilisateur
        await SecureStore.setItemAsync("userToken", result.token);
        await SecureStore.setItemAsync("userData", JSON.stringify(result.user));

        console.log("💾 Token et données utilisateur stockés");

        // Mettre à jour l'état - IMPORTANT: cela déclenche la navigation
        setIsAuthenticated(true);
        setUser(result.user as User);

        console.log("✅ État d'authentification mis à jour");

        return { success: true, message: result.message };
      } else {
        return {
          success: false,
          message: result.message || "Échec de la connexion",
        };
      }
    } catch (error: any) {
      console.error("❌ Erreur lors de la connexion:", error);
      return {
        success: false,
        message: error.message || "Erreur lors de la connexion",
      };
    }
  };

  /**
   * Déconnexion de l'utilisateur
   */
  const logout = async () => {
    console.log("🚪 Déconnexion de l'utilisateur");
    await clearAuth();
    router.replace("/(auth)/login");
  };

  /**
   * Nettoie les données d'authentification
   */
  const clearAuth = async () => {
    try {
      await SecureStore.deleteItemAsync("userToken");
      await SecureStore.deleteItemAsync("userData");
    } catch (error) {
      console.error("❌ Erreur lors du nettoyage de l'auth:", error);
    }
    setIsAuthenticated(false);
    setUser(null);
  };

  /**
   * Rafraîchit les données utilisateur
   */
  const refreshUser = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");

      if (token) {
        const result = await authService.verifyToken(token);

        if (result.success && result.user) {
          setUser(result.user as User);
          await SecureStore.setItemAsync(
            "userData",
            JSON.stringify(result.user),
          );
          console.log("🔄 Données utilisateur rafraîchies");
        }
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors du rafraîchissement de l'utilisateur:",
        error,
      );
    }
  };

  /**
   * Navigation automatique basée sur l'authentification
   */
  useEffect(() => {
    if (isLoading) {
      console.log("⏳ Chargement en cours, navigation en attente...");
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    console.log("🧭 Navigation check:", {
      isAuthenticated,
      inAuthGroup,
      segments: segments.join("/"),
      user: user?.email,
    });

    if (!isAuthenticated && !inAuthGroup) {
      console.log("➡️ Redirection vers login (non authentifié)");
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      console.log("➡️ Redirection vers accueil (authentifié)");
      router.replace("/(tabs)/marchand");
    }
  }, [isAuthenticated, segments, isLoading]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        isLoading,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }
  return context;
};
