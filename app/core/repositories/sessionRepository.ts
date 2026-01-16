import { db } from "../database/sqlite";


export interface Session {
  id: number;
  nom: string;
  montant: number | null;
  date_ouverture: string | null;
  date_fermeture: string | null;
  statut: string;
  regisseur_principal_id: number | null;
  validation_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionWithStats extends Session {
  total_paiements: number;
  nombre_paiements: number;
}

export interface PaiementWithMarchand {
  id: number;
  montant: number;
  type_paiement: string | null;
  date_paiement: string;
  motif: string | null;
  marchand_id: number;
  marchand_nom: string;
  marchand_prenom: string | null;
  place_id: number | null;
  agent_id: number;
  date_debut: string | null;
  date_fin: string | null;
}

export const sessionRepository = {
  // Récupérer toutes les sessions avec statistiques
  getAllWithStats: async (): Promise<SessionWithStats[]> => {
    const database = await db;
    const sessions = await database.getAllAsync<SessionWithStats>(`
      SELECT 
        s.*,
        COALESCE(SUM(p.montant), 0) as total_paiements,
        COUNT(p.id) as nombre_paiements
      FROM sessions s
      LEFT JOIN paiements p ON s.id = p.session_id
      GROUP BY s.id
      ORDER BY s.date_ouverture DESC
    `);
   
    return sessions;
  },

  // Récupérer une session par ID
  getById: async (id: number): Promise<Session | null> => {
    const database = await db;
    const session = await database.getFirstAsync<Session>(
      `SELECT * FROM sessions WHERE id = ?`,
      [id]
    );
    return session || null;
  },

  // Vérifier s'il existe une session ouverte
  hasOpenSession: async (): Promise<boolean> => {
    const database = await db;
    const result = await database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sessions WHERE statut = 'OUVERT'`
    );
    return (result?.count ?? 0) > 0;
  },

  // Récupérer la session ouverte (s'il y en a une)
  getOpenSession: async (): Promise<Session | null> => {
    const database = await db;
    const session = await database.getFirstAsync<Session>(
      `SELECT * FROM sessions WHERE statut = 'OUVERT' ORDER BY date_ouverture DESC LIMIT 1`
    );
    return session || null;
  },

  // Récupérer la session ouverte avec ses statistiques
  getOpenSessionWithStats: async (): Promise<SessionWithStats | null> => {
    const database = await db;
    const session = await database.getFirstAsync<SessionWithStats>(`
      SELECT 
        s.*,
        COALESCE(SUM(p.montant), 0) as total_paiements,
        COUNT(p.id) as nombre_paiements
      FROM sessions s
      LEFT JOIN paiements p ON s.id = p.session_id
      WHERE s.statut = 'OUVERTE'
      GROUP BY s.id
      ORDER BY s.date_ouverture DESC
      LIMIT 1
    `);
    return session || null;
  },

  // Récupérer tous les paiements d'une session avec les infos du marchand
  getPaiementsBySessionId: async (sessionId: number): Promise<PaiementWithMarchand[]> => {
    const database = await db;
    const paiements = await database.getAllAsync<PaiementWithMarchand>(`
      SELECT 
        p.*,
        m.nom as marchand_nom,
        m.prenom as marchand_prenom
      FROM paiements p
      INNER JOIN marchands m ON p.marchand_id = m.id
      WHERE p.session_id = ?
      ORDER BY p.date_paiement DESC
    `, [sessionId]);
    return paiements;
  },

  // Récupérer les statistiques d'une session
  getSessionStats: async (sessionId: number) => {
    const database = await db;
    const stats = await database.getFirstAsync<{
      total_paiements: number;
      nombre_paiements: number;
      nombre_marchands: number;
    }>(`
      SELECT 
        COALESCE(SUM(p.montant), 0) as total_paiements,
        COUNT(p.id) as nombre_paiements,
        COUNT(DISTINCT p.marchand_id) as nombre_marchands
      FROM paiements p
      WHERE p.session_id = ?
    `, [sessionId]);
    return stats;
  },

  // Créer une nouvelle session
  create: async (session: Omit<Session, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
    const database = await db;
    const result = await database.runAsync(
      `INSERT INTO sessions (nom, montant, date_ouverture, date_fermeture, statut, regisseur_principal_id, validation_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        session.nom,
        session.date_ouverture,
        session.date_fermeture,
        session.statut,
        session.regisseur_principal_id,
        session.validation_date
      ]
    );
    return result.lastInsertRowId;
  },

  // Mettre à jour une session
  update: async (id: number, session: Partial<Session>): Promise<void> => {
    const database = await db;
    const fields = Object.keys(session).filter(key => key !== 'id' && key !== 'created_at');
    const values = fields.map(key => session[key as keyof Session]);
    
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    // await database.runAsync(
    //   `UPDATE sessions SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    //   [...values, id]
    // );
  },

  // Supprimer une session
  delete: async (id: number): Promise<void> => {
    const database = await db;
    await database.runAsync(`DELETE FROM sessions WHERE id = ?`, [id]);
  },

  // Fermer une session
  closeSession: async (id: number): Promise<void> => {
    const database = await db;
    await database.runAsync(
      `UPDATE sessions SET statut = 'FERMEE', date_fermeture = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
  }
};
  