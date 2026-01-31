import { db } from "../database/sqlite";
import {
  CreatePaiementDTO,
  Paiement,
  paiementRepository,
} from "../repositories/paiementRepository";
import {
  Quittance,
  quittanceRepository,
} from "../repositories/quittanceRepository";

export interface EffectuerPaiementDTO {
  id: number; // ID fourni par l'API (obligatoire)
  montant: number;
  type_paiement: string;
  date_paiement?: string;
  motif?: string;
  marchand_id?: number;
  marchandnom?: string;
  place_id?: number;
  session_id: number;
  agent_id: number;
  date_debut?: string;
  date_fin?: string;
  quittance_id: number; // ID de la quittance fourni par l'API
}

export interface PaiementResult {
  success: boolean;
  paiement?: Paiement;
  quittance?: Quittance;
  error?: string;
}

export class PaiementService {
  /**
   * Créer un paiement avec un ID spécifique (fourni par l'API)
   */
  async createWithId(data: CreatePaiementDTO): Promise<boolean> {
    const database = await db;
    const now = new Date().toISOString();

    try {
      await database.runAsync(
        `INSERT INTO paiements (
          id, montant, type_paiement, date_paiement, motif, marchand_id, 
          marchandnom, place_id, session_id, agent_id, quittance_id,
          date_debut, date_fin, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id, // ID fourni par l'API
          data.montant,
          data.type_paiement,
          data.date_paiement || now,
          data.motif || null,
          data.marchand_id || null,
          data.marchandnom || null,
          data.place_id || null,
          data.session_id,
          data.agent_id,
          data.quittance_id || null,
          data.date_debut || null,
          data.date_fin || null,
          now,
          now,
        ],
      );

      return true;
    } catch (error) {
      console.error("Erreur création paiement avec ID:", error);
      return false;
    }
  }

  /**
   * Effectuer un paiement avec les données de l'API
   * Cette méthode utilise une transaction pour garantir la cohérence des données
   */
  async effectuerPaiement(data: EffectuerPaiementDTO): Promise<PaiementResult> {
    const database = await db;

    try {
      // Démarrer une transaction
      await database.execAsync("BEGIN TRANSACTION");

      // 1. Vérifier que la quittance existe
      const quittance = await quittanceRepository.findById(data.quittance_id);

      if (!quittance) {
        await database.execAsync("ROLLBACK");
        return {
          success: false,
          error: `Quittance avec l'ID ${data.quittance_id} introuvable`,
        };
      }

      // 2. Vérifier que la quittance est disponible
      if (quittance.etat !== "DISPONIBLE") {
        await database.execAsync("ROLLBACK");
        return {
          success: false,
          error: `La quittance ${data.quittance_id} n'est pas disponible (état actuel: ${quittance.etat})`,
        };
      }

      // 3. Créer le paiement avec l'ID fourni par l'API
      const paiementData: CreatePaiementDTO = {
        id: data.id, // ID fourni par l'API
        montant: data.montant,
        type_paiement: data.type_paiement,
        date_paiement: data.date_paiement,
        motif: data.motif,
        marchand_id: data.marchand_id,
        marchandnom: data.marchandnom,
        place_id: data.place_id,
        session_id: data.session_id,
        agent_id: data.agent_id,
        quittance_id: data.quittance_id,
        date_debut: data.date_debut,
        date_fin: data.date_fin,
      };

      const success = await this.createWithId(paiementData);

      if (!success) {
        await database.execAsync("ROLLBACK");
        return {
          success: false,
          error: "Échec de la création du paiement",
        };
      }

      // 4. Mettre à jour la quittance (marquer comme UTILISE)
      const now = new Date().toISOString();
      await database.runAsync(
        `UPDATE quittances SET
          etat = 'UTILISE',
          date_utilisation = ?,
          paiement_id = ?,
          updated_at = ?
        WHERE id = ?`,
        [now, data.id, now, data.quittance_id],
      );

      // 5. Valider la transaction
      await database.execAsync("COMMIT");

      // 6. Récupérer les données complètes
      const paiementCreated = await paiementRepository.findById(data.id);
      const quittanceUpdatedData = await quittanceRepository.findById(
        data.quittance_id,
      );

      return {
        success: true,
        paiement: paiementCreated || undefined,
        quittance: quittanceUpdatedData || undefined,
      };
    } catch (error) {
      // En cas d'erreur, annuler la transaction
      await database.execAsync("ROLLBACK");

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur inconnue lors du paiement",
      };
    }
  }

  /**
   * Récupérer un paiement avec sa quittance
   */
  async getPaiementAvecQuittance(paiementId: number): Promise<{
    paiement: Paiement | null;
    quittance: Quittance | null;
  }> {
    const paiement = await paiementRepository.findById(paiementId);
    const quittance = paiement
      ? await quittanceRepository.findByPaiementId(paiementId)
      : null;

    return { paiement, quittance };
  }

  /**
   * Récupérer tous les paiements d'un marchand
   */
  async getPaiementsByMarchand(marchandId: number): Promise<Paiement[]> {
    return await paiementRepository.findByMarchandId(marchandId);
  }

  /**
   * Récupérer tous les paiements d'une session
   */
  async getPaiementsBySession(sessionId: number): Promise<Paiement[]> {
    return await paiementRepository.findBySessionId(sessionId);
  }

  /**
   * Récupérer le total des paiements pour une session
   */
  async getTotalSession(sessionId: number): Promise<number> {
    return await paiementRepository.getTotalBySession(sessionId);
  }

  /**
   * Récupérer le total des paiements pour un marchand
   */
  async getTotalMarchand(marchandId: number): Promise<number> {
    return await paiementRepository.getTotalByMarchand(marchandId);
  }

  /**
   * Récupérer toutes les quittances disponibles
   */
  async getQuittancesDisponibles(): Promise<Quittance[]> {
    return await quittanceRepository.findAllAvailable();
  }

  /**
   * Annuler un paiement (libérer la quittance)
   * ATTENTION: Cette opération doit être utilisée avec précaution
   */
  async annulerPaiement(paiementId: number): Promise<PaiementResult> {
    const database = await db;

    try {
      await database.execAsync("BEGIN TRANSACTION");

      // 1. Récupérer le paiement
      const paiement = await paiementRepository.findById(paiementId);
      if (!paiement) {
        await database.execAsync("ROLLBACK");
        return {
          success: false,
          error: "Paiement introuvable",
        };
      }

      // 2. Récupérer la quittance associée
      const quittance = await quittanceRepository.findByPaiementId(paiementId);
      if (!quittance) {
        await database.execAsync("ROLLBACK");
        return {
          success: false,
          error: "Quittance associée introuvable",
        };
      }

      // 3. Supprimer le paiement
      const paiementDeleted = await paiementRepository.delete(paiementId);
      if (!paiementDeleted) {
        await database.execAsync("ROLLBACK");
        return {
          success: false,
          error: "Échec de la suppression du paiement",
        };
      }

      // 4. Libérer la quittance (remettre à DISPONIBLE)
      const now = new Date().toISOString();
      await database.runAsync(
        `UPDATE quittances SET
          etat = 'DISPONIBLE',
          date_utilisation = NULL,
          paiement_id = NULL,
          updated_at = ?
        WHERE id = ?`,
        [now, quittance.id],
      );

      // 5. Valider la transaction
      await database.execAsync("COMMIT");

      return {
        success: true,
      };
    } catch (error) {
      await database.execAsync("ROLLBACK");
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'annulation",
      };
    }
  }
}

export const paiementService = new PaiementService();
