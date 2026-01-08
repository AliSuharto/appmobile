// Configuration de l'API
import { BASE_URL_API } from "@/app/utilitaire/api";
import * as SecureStore from 'expo-secure-store';


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


export const createSession = async (data: CreateSessionData): Promise<SessionResponse> => {
    const token = await SecureStore.getItem('userToken');// Récupérer le token d'authentification
                                                           // Récupérer l'ID de l'utilisateur
  
  
    console.log('Token d\'authentification:', token);
    try {
    
    const response = await fetch(`${BASE_URL_API}/sessions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Ajoutez ici vos headers d'authentification si nécessaire
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // Essayer de récupérer le message d'erreur de l'API
      let errorMessage = 'Erreur lors de la création de la session';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Si la réponse n'est pas en JSON, utiliser le message par défaut
        errorMessage = `Erreur ${response.status}: ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Une erreur inattendue est survenue');
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
  data: Partial<CreateSessionData>
): Promise<SessionResponse> => {
  try {
    const response = await fetch(`${BASE_URL_API}/session/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erreur lors de la mise à jour');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Une erreur inattendue est survenue');
  }
};

/**
 * Supprime une session
 * @param id ID de la session à supprimer
 */
export const deleteSession = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${BASE_URL_API}/session/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erreur lors de la suppression');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Une erreur inattendue est survenue');
  }
};