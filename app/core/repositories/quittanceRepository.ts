import { db } from "../database/sqlite";

export interface Quittance {
  id: number;
  creation_date: string;
  date_utilisation: string | null;
  nom: string;
  etat: "DISPONIBLE" | "UTILISE";
  quittance_plage_id: number | null;
  paiement_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface QuittanceDetail extends Quittance {
  paiement_montant: number | null;
  paiement_type: string | null;
  paiement_date: string | null;
  marchand_nom: string | null;
  marchand_prenom: string | null;
  marchand_telephone: string | null;
  agent_nom: string | null;
  agent_prenom: string | null;
  place_nom: string | null;
}

export const quittanceRepository = {
  /**
   * Récupérer toutes les quittances avec filtres optionnels
   */
  async getAll(filters?: {
    etat?: "DISPONIBLE" | "UTILISE";
    searchQuery?: string;
  }): Promise<Quittance[]> {
    const database = await db;
    let query = `SELECT * FROM quittances WHERE 1=1`;
    const params: any[] = [];

    if (filters?.etat) {
      query += ` AND etat = ?`;
      params.push(filters.etat);
    }

    if (filters?.searchQuery) {
      query += ` AND nom LIKE ?`;
      params.push(`%${filters.searchQuery}%`);
    }

    query += ` ORDER BY creation_date DESC`;

    const result = await database.getAllAsync<Quittance>(query, params);
    return result;
  },

  /**
   * Récupérer une quittance par ID avec tous les détails
   */
  async getById(id: number): Promise<QuittanceDetail | null> {
    const database = await db;
    const query = `
      SELECT 
        q.*,
        p.montant as paiement_montant,
        p.type_paiement as paiement_type,
        p.date_paiement as paiement_date,
        m.nom as marchand_nom,
        m.prenom as marchand_prenom,
        m.telephone as marchand_telephone,
        u.nom as agent_nom,
        u.prenom as agent_prenom,
        pl.nom as place_nom
      FROM quittances q
      LEFT JOIN paiements p ON q.paiement_id = p.id
      LEFT JOIN marchands m ON p.marchand_id = m.id
      LEFT JOIN users u ON p.agent_id = u.id
      LEFT JOIN places pl ON p.place_id = pl.id
      WHERE q.id = ?
    `;

    const result = await database.getAllAsync<QuittanceDetail>(query, [id]);
    return result.length > 0 ? result[0] : null;
  },

  /**
   * Créer une nouvelle quittance
   */
  async create(
    quittance: Omit<Quittance, "id" | "created_at" | "updated_at">,
  ): Promise<number> {
    const database = await db;
    const result = await database.runAsync(
      `INSERT INTO quittances (creation_date, date_utilisation, nom, etat, quittance_plage_id, paiement_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        quittance.creation_date,
        quittance.date_utilisation,
        quittance.nom,
        quittance.etat,
        quittance.quittance_plage_id,
        quittance.paiement_id,
      ],
    );
    return result.lastInsertRowId;
  },

  /**
   * Mettre à jour une quittance
   */
  async update(
    id: number,
    updates: Partial<Omit<Quittance, "id" | "created_at">>,
  ): Promise<void> {
    const database = await db;
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      fields.push(`${key} = ?`);
      values.push(value);
    });

    if (fields.length === 0) return;

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    await database.runAsync(
      `UPDATE quittances SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
  },

  /**
   * Supprimer une quittance
   */
  async delete(id: number): Promise<void> {
    const database = await db;
    await database.runAsync(`DELETE FROM quittances WHERE id = ?`, [id]);
  },

  /**
   * Mettre à jour une quittance après utilisation
   */
  async markAsUsed(quittanceId: number, paiementId: number): Promise<boolean> {
    const database = await db;
    const now = new Date().toISOString();

    const result = await database.runAsync(
      `UPDATE quittances SET
        etat = 'UTILISE',
        date_utilisation = ?,
        paiement_id = ?,
        updated_at = ?
      WHERE id = ?`,
      [now, paiementId, now, quittanceId],
    );

    return result.changes > 0;
  },

  /**
   * Récupérer une quittance par ID
   */
  async findById(id: number): Promise<Quittance | null> {
    const database = await db;
    const quittance = await database.getFirstAsync<Quittance>(
      `SELECT * FROM quittances WHERE id = ?`,
      [id],
    );
    return quittance || null;
  },

  async findByName(nom: string): Promise<Quittance[]> {
    const database = await db;

    const quittance = await database.getAllAsync<Quittance>(
      `SELECT * FROM quittances WHERE nom = ?`,
      [nom],
    );

    return quittance || null;
  },

  /**
   * Récupérer une quittance disponible
   */
  async findAvailableQuittance(): Promise<Quittance | null> {
    const database = await db;
    const quittance = await database.getFirstAsync<Quittance>(
      `SELECT * FROM quittances WHERE etat = 'DISPONIBLE' ORDER BY id LIMIT 1`,
    );
    return quittance || null;
  },

  /**
   * Récupérer toutes les quittances disponibles
   */
  async findAllAvailable(): Promise<Quittance[]> {
    const database = await db;
    const quittances = await database.getAllAsync<Quittance>(
      `SELECT * FROM quittances WHERE etat = 'DISPONIBLE' ORDER BY nom`,
    );
    return quittances;
  },

  /**
   * Récupérer la quittance associée à un paiement
   */
  async findByPaiementId(paiementId: number): Promise<Quittance | null> {
    const database = await db;
    const quittance = await database.getFirstAsync<Quittance>(
      `SELECT * FROM quittances WHERE paiement_id = ?`,
      [paiementId],
    );
    return quittance || null;
  },

  /**
   * Obtenir les statistiques des quittances
   */
  async getStats(): Promise<{
    total: number;
    disponibles: number;
    utilises: number;
  }> {
    const database = await db;
    const result = await database.getAllAsync<{
      etat: string;
      count: number;
    }>(`
      SELECT etat, COUNT(*) as count
      FROM quittances
      GROUP BY etat
    `);

    const stats = {
      total: 0,
      disponibles: 0,
      utilises: 0,
    };

    result.forEach((row) => {
      stats.total += row.count;
      if (row.etat === "DISPONIBLE") {
        stats.disponibles = row.count;
      } else if (row.etat === "UTILISE") {
        stats.utilises = row.count;
      }
    });

    return stats;
  },
};
