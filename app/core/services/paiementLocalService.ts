import { db } from "../database/sqlite";

export interface PaiementLocal {
  id?: number;
  montant: number;
  type_paiement?: string;
  date_paiement: string;
  motif?: string;
  marchand_id?: number;
  marchand_nom?: string;
  place_id?: number;
  session_id: number;
  agent_id: number;
  date_debut?: string;
  date_fin?: string;
  api_id?: number; // ID retourné par l'API après synchronisation
  synced: number; // 0 = non synchronisé, 1 = synchronisé
  created_at?: string;
  updated_at?: string;
}

export interface QuittanceLocal {
  id?: number;
  creation_date: string;
  date_utilisation?: string;
  nom: string;
  etat?: string;
  quittance_plage_id?: number;
  paiement_id?: number;
  created_at?: string;
  updated_at?: string;
}

class PaiementLocalService {
  private database: any = null;

  async initDatabase() {
    if (!this.database) {
      this.database = await db;
    }
    return this.database;
  }

  /**
   * Sauvegarde un paiement dans la base de données locale
   * Appelé APRÈS un enregistrement réussi via l'API
   */
  async savePaiement(
    paiement: Omit<PaiementLocal, "id" | "created_at" | "updated_at">,
  ): Promise<number> {
    const database = await this.initDatabase();

    try {
      const now = new Date().toISOString();

      const result = await database.runAsync(
        `INSERT INTO paiements (
          montant, type_paiement, date_paiement, motif, 
          marchand_id, marchand_nom, place_id, session_id, agent_id,
          date_debut, date_fin, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paiement.montant,
          paiement.type_paiement || null,
          paiement.date_paiement,
          paiement.motif || null,
          paiement.marchand_id || null,
          paiement.marchand_nom || null,
          paiement.place_id || null,
          paiement.session_id,
          paiement.agent_id,
          paiement.date_debut || null,
          paiement.date_fin || null,
          now,
          now,
        ],
      );

      console.log(
        "✅ Paiement sauvegardé localement, ID:",
        result.lastInsertRowId,
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error("❌ Erreur sauvegarde paiement local:", error);
      throw error;
    }
  }

  /**
   * Sauvegarde une quittance dans la base de données locale
   */
  async saveQuittance(
    quittance: Omit<QuittanceLocal, "id" | "created_at" | "updated_at">,
  ): Promise<number> {
    const database = await this.initDatabase();

    try {
      const now = new Date().toISOString();

      const result = await database.runAsync(
        `INSERT INTO quittances (
          creation_date, date_utilisation, nom, etat, 
          quittance_plage_id, paiement_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quittance.creation_date,
          quittance.date_utilisation || null,
          quittance.nom,
          quittance.etat || "utilisee",
          quittance.quittance_plage_id || null,
          quittance.paiement_id || null,
          now,
          now,
        ],
      );

      console.log(
        "✅ Quittance sauvegardée localement, ID:",
        result.lastInsertRowId,
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error("❌ Erreur sauvegarde quittance locale:", error);
      throw error;
    }
  }

  /**
   * Récupère tous les paiements d'une session
   */
  async getPaiementsBySession(sessionId: number): Promise<PaiementLocal[]> {
    const database = await this.initDatabase();

    try {
      const rows = await database.getAllAsync<PaiementLocal>(
        `SELECT * FROM paiements 
         WHERE session_id = ? 
         ORDER BY date_paiement DESC`,
        [sessionId],
      );
      return rows;
    } catch (error) {
      console.error("❌ Erreur récupération paiements:", error);
      return [];
    }
  }

  /**
   * Récupère les paiements non synchronisés (au cas où)
   */
  async getUnsyncedPaiements(): Promise<PaiementLocal[]> {
    const database = await this.initDatabase();

    try {
      const rows = await database.getAllAsync<PaiementLocal>(
        `SELECT * FROM paiements 
         WHERE synced = 0 
         ORDER BY created_at ASC`,
      );
      return rows;
    } catch (error) {
      console.error(
        "❌ Erreur récupération paiements non synchronisés:",
        error,
      );
      return [];
    }
  }

  /**
   * Calcule le total des paiements pour une session
   */
  async getTotalBySession(sessionId: number): Promise<number> {
    const database = await this.initDatabase();

    try {
      const result = await database.getFirstAsync<{ total: number }>(
        `SELECT COALESCE(SUM(montant), 0) as total 
         FROM paiements 
         WHERE session_id = ?`,
        [sessionId],
      );
      return result?.total || 0;
    } catch (error) {
      console.error("❌ Erreur calcul total session:", error);
      return 0;
    }
  }

  /**
   * Récupère un paiement par son ID API
   */
  async getPaiementByApiId(apiId: number): Promise<PaiementLocal | null> {
    const database = await this.initDatabase();

    try {
      const result = await database.getFirstAsync<PaiementLocal>(
        `SELECT * FROM paiements WHERE id = ?`,
        [apiId],
      );
      return result || null;
    } catch (error) {
      console.error("❌ Erreur récupération paiement par API ID:", error);
      return null;
    }
  }

  /**
   * Supprime un paiement
   */
  async deletePaiement(id: number): Promise<void> {
    const database = await this.initDatabase();

    try {
      await database.runAsync("DELETE FROM paiements WHERE id = ?", [id]);
      console.log("✅ Paiement supprimé");
    } catch (error) {
      console.error("❌ Erreur suppression paiement:", error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des paiements par session
   */
  async getSessionStats(sessionId: number): Promise<{
    total_paiements: number;
    montant_total: number;
  }> {
    const database = await this.initDatabase();

    try {
      const result = await database.getFirstAsync<{
        total_paiements: number;
        montant_total: number;
      }>(
        `SELECT 
          COUNT(*) as total_paiements,
          COALESCE(SUM(montant), 0) as montant_total
         FROM paiements 
         WHERE session_id = ?`,
        [sessionId],
      );

      return (
        result || {
          total_paiements: 0,
          montant_total: 0,
        }
      );
    } catch (error) {
      console.error("❌ Erreur récupération stats session:", error);
      return {
        total_paiements: 0,
        montant_total: 0,
      };
    }
  }

  /**
   * Récupère les quittances d'un paiement
   */
  async getQuittancesByPaiement(paiementId: number): Promise<QuittanceLocal[]> {
    const database = await this.initDatabase();

    try {
      const rows = await database.getAllAsync<QuittanceLocal>(
        `SELECT * FROM quittances 
         WHERE paiement_id = ? 
         ORDER BY creation_date DESC`,
        [paiementId],
      );
      return rows;
    } catch (error) {
      console.error("❌ Erreur récupération quittances:", error);
      return [];
    }
  }
}

export const paiementLocalService = new PaiementLocalService();
