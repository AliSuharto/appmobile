// Configuration de l'API
import { sessionRepository } from "@/app/core/repositories/sessionRepository";
import { BASE_URL_API } from "@/app/utilitaire/api";
import * as SecureStore from "expo-secure-store";

interface CreateSessionData {
  nomSession: string;
  userId?: number | null;
  //   date_ouverture: string; // Format: YYYY-MM-DD
  //   description?: string;
  //   statut: 'OUVERT' | 'EN_VALIDATION' | 'VALIDEE' | 'FERMEE' | 'REJETEE';
}

interface SessionResponse {
  id: number;
  nom: string;
  date_ouverture: string;
  date_fermeture?: string;
  description?: string;
  statut: string;
  created_at: string;
  updated_at: string;
}

/**
 * Crée une nouvelle session via l'API
 * @param data Données de la session à créer
 * @returns La session créée
 */

export const createSession = async (
  data: CreateSessionData,
): Promise<SessionResponse> => {
  const token = await SecureStore.getItem("userToken");

  console.log("Token d'authentification:", token);

  try {
    const response = await fetch(`${BASE_URL_API}/sessions/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = "Erreur lors de la création de la session";

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = `Erreur ${response.status}: ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    const { sessionId, nomSession } = result.data;
    // ✅ CRÉATION DE LA SESSION LOCALE APRÈS SUCCÈS
    try {
      await sessionRepository.create({
        id: sessionId,
        nom: nomSession,
      });

      console.log("Session locale créée avec succès:", result.sessionId);
    } catch (localError) {
      console.error(
        "Erreur lors de la création de la session locale:",
        localError,
      );
      // Note: La session distante est créée, mais pas la locale
      // Vous pouvez décider si vous voulez throw l'erreur ou juste logger
      // throw new Error('Session créée sur le serveur mais erreur locale');
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Une erreur inattendue est survenue");
  }
};

/**
 * Met à jour une session existante
 * @param id ID de la session à mettre à jour
 * @param data Données à mettre à jour
 * @returns La session mise à jour
 */
export const updateSession = async (
  id: number,
  data: Partial<CreateSessionData>,
): Promise<SessionResponse> => {
  try {
    const response = await fetch(`${BASE_URL_API}/session/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Erreur lors de la mise à jour");
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Une erreur inattendue est survenue");
  }
};

/**
 * Supprime une session
 * @param id ID de la session à supprimer
 */
export const deleteSession = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${BASE_URL_API}/session/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Erreur lors de la suppression");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Une erreur inattendue est survenue");
  }
};
