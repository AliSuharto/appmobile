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
   * Vérifie l'authentification au démarrage.
   *
   * Stratégie "offline-first" (comme Facebook) :
   * 1. Si un token + userData sont stockés localement → on connecte
   *    l'utilisateur IMMÉDIATEMENT sans attendre le réseau.
   * 2. On vérifie le token en arrière-plan : si invalide/expiré,
   *    on déconnecte silencieusement.
   * 3. Si pas de token → écran de login.
   */
  const checkAuth = async () => {
    try {
      const [token, userDataStr] = await Promise.all([
        SecureStore.getItemAsync("userToken"),
        SecureStore.getItemAsync("userData"),
      ]);

      if (token && userDataStr) {
        // ✅ ÉTAPE 1 : Restauration immédiate depuis le stockage local
        // L'utilisateur entre directement dans l'app, pas besoin d'internet
        const cachedUser = JSON.parse(userDataStr) as User;
        setIsAuthenticated(true);
        setUser(cachedUser);
        console.log("✅ Session restaurée localement:", cachedUser.email);

        // ✅ ÉTAPE 2 : Vérification en arrière-plan (silencieuse)
        // On ne bloque PAS l'UI pour ça
        verifyTokenInBackground(token);
      } else {
        // Aucun token → login obligatoire
        console.log("ℹ️ Aucune session trouvée, redirection login");
      }
    } catch (error) {
      console.error("❌ Erreur vérification auth:", error);
      await clearAuth();
    } finally {
      // On débloque l'UI dans tous les cas
      setIsLoading(false);
    }
  };

  /**
   * Vérification du token côté serveur en arrière-plan.
   * Ne bloque jamais l'affichage. Déconnecte seulement si le serveur
   * confirme que le token est invalide (pas en cas d'erreur réseau).
   */
  const verifyTokenInBackground = async (token: string) => {
    try {
      const result = await authService.verifyToken(token);

      if (result.success && result.user) {
        // Token valide → mettre à jour les données utilisateur silencieusement
        setUser(result.user as User);
        await SecureStore.setItemAsync("userData", JSON.stringify(result.user));
        console.log("🔄 Session vérifiée et données à jour");
      } else if (
        result.success === false &&
        result.message?.includes("expiré")
      ) {
        // Token explicitement rejeté par le serveur → déconnexion
        console.log("⚠️ Token expiré, déconnexion");
        await clearAuth();
        router.replace("/(auth)/login");
      }
      // En cas d'erreur réseau (pas de réponse), on ne fait rien :
      // l'utilisateur reste connecté avec ses données en cache
    } catch (error) {
      // Pas de réseau ou serveur inaccessible → on garde la session locale
      console.log(
        "📡 Vérification arrière-plan échouée (réseau?), session conservée",
      );
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

      if (result.success && result.token && result.user) {
        await SecureStore.setItemAsync("userToken", result.token);
        await SecureStore.setItemAsync("userData", JSON.stringify(result.user));

        setIsAuthenticated(true);
        setUser(result.user as User);

        console.log("✅ Connexion réussie, session persistée");
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
   * Déconnexion explicite de l'utilisateur
   */
  const logout = async () => {
    console.log("🚪 Déconnexion volontaire");
    await clearAuth();
    router.replace("/(auth)/login");
  };

  /**
   * Nettoie toutes les données d'authentification
   */
  const clearAuth = async () => {
    try {
      await SecureStore.deleteItemAsync("userToken");
      await SecureStore.deleteItemAsync("userData");
    } catch (error) {
      console.error("❌ Erreur nettoyage auth:", error);
    }
    setIsAuthenticated(false);
    setUser(null);
  };

  /**
   * Rafraîchit les données utilisateur depuis le serveur
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
      console.error("❌ Erreur rafraîchissement utilisateur:", error);
    }
  };

  /**
   * Navigation automatique basée sur l'état d'authentification
   */
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)/marchand");
    }
  }, [isAuthenticated, segments, isLoading]);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, isLoading, refreshUser }}
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
