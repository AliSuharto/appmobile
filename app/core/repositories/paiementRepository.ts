import { db } from "../database/sqlite";

// Interface pour créer un paiement
export interface CreatePaiementDTO {
  id: number; // ID optionnel (fourni par l'API ou auto-généré)
  montant: number;
  type_paiement: string;
  date_paiement?: string;
  motif?: string;
  marchand_id?: number;
  marchandnom?: string;
  place_id?: number;
  session_id: number;
  agent_id: number;
  quittance_id: number;
  date_debut?: string;
  date_fin?: string;
}

export interface LastPaiementAgent {
  id: number;
  marchandnom: string | null;
  motif: string | null;
  montant: number;
  numeroquittance: string | null;
  date_paiement: string;
}

// Interface pour un paiement complet
export interface Paiement {
  id: number;
  montant: number;
  type_paiement: string;
  date_paiement: string;
  motif?: string;
  marchand_id?: number;
  marchand_nom?: string;
  place_id?: number;
  session_id: number;
  agent_id: number;
  date_debut?: string;
  date_fin?: string;
  created_at: string;
  updated_at: string;
}
export class PaiementRepository {
  /**
   * Créer un nouveau paiement
   */
  async create(paiement: CreatePaiementDTO): Promise<number> {
    const database = await db;
    const now = new Date().toISOString();

    const result = await database.runAsync(
      `INSERT INTO paiements (
        montant,
        type_paiement,
        date_paiement,
        motif,
        marchand_id,
        marchand_nom,
        place_id,
        session_id,
        agent_id,
        date_debut,
        date_fin,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paiement.montant,
        paiement.type_paiement,
        now,
        paiement.motif || null,
        paiement.marchand_id || null,
        paiement.marchandnom || null,
        paiement.place_id || null,
        paiement.session_id,
        paiement.agent_id,
        paiement.date_debut || null,
        paiement.date_fin || null,
        now,
        now,
      ],
    );

    return result.lastInsertRowId;
  }

  /**
   * Récupérer un paiement par ID
   */
  async findById(id: number): Promise<Paiement | null> {
    const database = await db;
    const paiement = await database.getFirstAsync<Paiement>(
      `SELECT * FROM paiements WHERE id = ?`,
      [id],
    );
    return paiement || null;
  }

  /**
   * Récupérer tous les paiements d'un marchand
   */
  async findByMarchandId(marchandId: number): Promise<Paiement[]> {
    const database = await db;
    const paiements = await database.getAllAsync<Paiement>(
      `SELECT * FROM paiements WHERE marchand_id = ? ORDER BY date_paiement DESC`,
      [marchandId],
    );
    return paiements;
  }

  /**
   * Récupérer tous les paiements d'une session
   */
  async findBySessionId(sessionId: number): Promise<Paiement[]> {
    const database = await db;
    const paiements = await database.getAllAsync<Paiement>(
      `SELECT * FROM paiements WHERE session_id = ? ORDER BY date_paiement DESC`,
      [sessionId],
    );
    return paiements;
  }

  /**
   * Récupérer tous les paiements d'un agent
   */
  async findByAgentId(agentId: number): Promise<Paiement[]> {
    const database = await db;
    const paiements = await database.getAllAsync<Paiement>(
      `SELECT * FROM paiements WHERE agent_id = ? ORDER BY date_paiement DESC`,
      [agentId],
    );
    return paiements;
  }

  /**
   * Récupérer tous les paiements
   */
  async findAll(): Promise<Paiement[]> {
    const database = await db;
    const paiements = await database.getAllAsync<Paiement>(
      `SELECT * FROM paiements ORDER BY date_paiement DESC`,
    );
    return paiements;
  }

  /**
   * Mettre à jour un paiement
   */
  async update(id: number, paiement: Partial<Paiement>): Promise<boolean> {
    const database = await db;
    const now = new Date().toISOString();

    const result = await database.runAsync(
      `UPDATE paiements SET
        montant = COALESCE(?, montant),
        type_paiement = COALESCE(?, type_paiement),
        motif = COALESCE(?, motif),
        marchand_id = COALESCE(?, marchand_id),
        marchand_nom = COALESCE(?, marchand_nom),
        place_id = COALESCE(?, place_id),
        date_debut = COALESCE(?, date_debut),
        date_fin = COALESCE(?, date_fin),
        updated_at = ?
      WHERE id = ?`,
      [
        paiement.montant || null,
        paiement.type_paiement || null,
        paiement.motif || null,
        paiement.marchand_id || null,
        paiement.marchand_nom || null,
        paiement.place_id || null,
        paiement.date_debut || null,
        paiement.date_fin || null,
        now,
        id,
      ],
    );

    return result.changes > 0;
  }

  /**
   * Supprimer un paiement
   */
  async delete(id: number): Promise<boolean> {
    const database = await db;
    const result = await database.runAsync(
      `DELETE FROM paiements WHERE id = ?`,
      [id],
    );
    return result.changes > 0;
  }

  /**
   * Calculer le total des paiements pour une session
   */
  async getTotalBySession(sessionId: number): Promise<number> {
    const database = await db;
    const result = await database.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(montant), 0) as total FROM paiements WHERE session_id = ?`,
      [sessionId],
    );
    return result?.total || 0;
  }

  /**
   * Calculer le total des paiements pour un marchand
   */
  async getTotalByMarchand(marchandId: number): Promise<number> {
    const database = await db;
    const result = await database.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(montant), 0) as total FROM paiements WHERE marchand_id = ?`,
      [marchandId],
    );
    return result?.total || 0;
  }
  /**
   * Récupérer les 5 derniers paiements d'un agent
   * avec le numéro de quittance
   */
  async findLastFiveByAgent(agentId: number): Promise<LastPaiementAgent[]> {
    const database = await db;

    return await database.getAllAsync<LastPaiementAgent>(
      `
    SELECT
      p.id,
      p.marchandnom,
      p.motif,
      p.montant,
      q.nom AS numeroquittance,
      p.date_paiement
    FROM paiements p
    LEFT JOIN quittances q ON q.id = p.quittance_id
    WHERE p.agent_id = ?
    ORDER BY p.date_paiement DESC
    LIMIT 5
    `,
      [agentId],
    );
  }
}

export const paiementRepository = new PaiementRepository();
