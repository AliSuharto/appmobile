import { BASE_URL_API } from "@/app/utilitaire/api";
import {
  CreateSessionDTO,
  PaiementWithMarchand,
  Session,
  sessionRepository,
  SessionWithStats,
} from "../repositories/sessionRepository";

export const sessionService = {
  // Récupérer toutes les sessions avec leurs statistiques
  getAllSessions: async (): Promise<SessionWithStats[]> => {
    try {
      return await sessionRepository.getAllWithStats();
    } catch (error) {
      console.error("Erreur lors de la récupération des sessions:", error);
      throw new Error("Impossible de récupérer les sessions");
    }
  },

  // Récupérer une session spécifique
  getSessionById: async (id: number): Promise<Session | null> => {
    try {
      return await sessionRepository.getById(id);
    } catch (error) {
      console.error(
        `Erreur lors de la récupération de la session ${id}:`,
        error,
      );
      throw new Error("Impossible de récupérer la session");
    }
  },

  // Vérifier s'il existe une session ouverte
  hasOpenSession: async (): Promise<boolean> => {
    try {
      return await sessionRepository.hasOpenSession();
    } catch (error) {
      console.error(
        "Erreur lors de la vérification de session ouverte:",
        error,
      );
      throw new Error("Impossible de vérifier la session ouverte");
    }
  },

  // Récupérer la session ouverte
  getOpenSession: async (): Promise<Session | null> => {
    try {
      return await sessionRepository.getOpenSession();
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la session ouverte:",
        error,
      );
      throw new Error("Impossible de récupérer la session ouverte");
    }
  },

  // Récupérer la session ouverte avec statistiques
  getOpenSessionWithStats: async (): Promise<SessionWithStats | null> => {
    try {
      return await sessionRepository.getOpenSessionWithStats();
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la session ouverte avec stats:",
        error,
      );
      throw new Error("Impossible de récupérer la session ouverte");
    }
  },

  // Récupérer les paiements d'une session
  getSessionPaiements: async (
    sessionId: number,
  ): Promise<PaiementWithMarchand[]> => {
    try {
      return await sessionRepository.getPaiementsBySessionId(sessionId);
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des paiements de la session ${sessionId}:`,
        error,
      );
      throw new Error("Impossible de récupérer les paiements");
    }
  },

  // Récupérer les statistiques d'une session
  getSessionStatistics: async (sessionId: number) => {
    try {
      return await sessionRepository.getSessionStats(sessionId);
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des statistiques de la session ${sessionId}:`,
        error,
      );
      throw new Error("Impossible de récupérer les statistiques");
    }
  },

  // Créer une nouvelle session
  async createSession(data: CreateSessionDTO): Promise<Session> {
    // Validation
    if (!data.id) {
      throw new Error("L'ID de la session est requis");
    }

    if (!data.nom || data.nom.trim() === "") {
      throw new Error("Le nom de la session est requis");
    }

    // Vérifier si l'ID existe déjà
    const existingSession = await sessionRepository.getById(data.id);
    if (existingSession) {
      throw new Error(`Une session avec l'ID ${data.id} existe déjà`);
    }

    // Vérifier qu'il n'y a pas déjà une session ouverte
    const hasOpen = await sessionRepository.hasOpenSession();
    if (hasOpen) {
      throw new Error(
        "Une session est déjà ouverte. Veuillez la fermer avant d'en créer une nouvelle",
      );
    }

    // Créer la session
    return await sessionRepository.create(data);
  },

  // Fermer une session
  closeSession: async (id: number): Promise<void> => {
    try {
      await sessionRepository.closeSession(id);
    } catch (error) {
      console.error(`Erreur lors de la fermeture de la session ${id}:`, error);
      throw new Error("Impossible de fermer la session");
    }
  },

  // Supprimer une session
  deleteSession: async (id: number): Promise<void> => {
    try {
      await sessionRepository.delete(id);
    } catch (error) {
      console.error(
        `Erreur lors de la suppression de la session ${id}:`,
        error,
      );
      throw new Error("Impossible de supprimer la session");
    }
  },

  // Formater le montant en Ariary
  formatMontant: (montant: number): string => {
    return new Intl.NumberFormat("fr-MG", {
      style: "currency",
      currency: "MGA",
      minimumFractionDigits: 0,
    }).format(montant);
  },

  // Formater la date
  formatDate: (date: string | null): string => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  // Obtenir le badge de statut
  getStatusBadge: (statut: string): { color: string; label: string } => {
    switch (statut.toLowerCase()) {
      case "active":
      case "ouvert":
        return { color: "green", label: "Ouverte" };
      case "fermée":
      case "fermee":
        return { color: "gray", label: "Fermée" };
      case "en attente":
        return { color: "yellow", label: "En attente" };
      default:
        return { color: "blue", label: statut };
    }
  },

  /**
   * Met une session en validation via l'API
   * @param sessionId - L'ID de la session à mettre en validation
   */
  validateSession: async (sessionId: number): Promise<void> => {
    try {
      const response = await fetch(
        `${BASE_URL_API}/sessions/${sessionId}/close`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erreur lors de la mise en validation:", error);
      throw error;
    }
  },
};
