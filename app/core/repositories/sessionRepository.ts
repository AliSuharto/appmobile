import { db } from "../database/sqlite";

/* =========================
   INTERFACES
========================= */

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
export interface CreateSessionDTO {
  id: number;
  nom: string;
}
export interface PaiementWithMarchand {
  id: number;
  montant: number;
  type_paiement: string | null;
  date_paiement: string;
  motif: string | null;

  marchand_id: number | null;
  marchand_nom: string | null;
  marchand_prenom: string | null;

  place_id: number | null;
  agent_id: number;
  date_debut: string | null;
  date_fin: string | null;
  numero_quittance: string | null;
  mode_paiement: string | null;

  is_paiement_manuel: boolean;
}

/* =========================
   REPOSITORY
========================= */

export const sessionRepository = {
  /* ---------- SESSIONS ---------- */

  getAllWithStats: async (): Promise<SessionWithStats[]> => {
    const database = await db;

    return database.getAllAsync<SessionWithStats>(`
      SELECT 
        s.*,
        COALESCE(SUM(p.montant), 0) AS total_paiements,
        COUNT(p.id) AS nombre_paiements
      FROM sessions s
      LEFT JOIN paiements p ON s.id = p.session_id
      GROUP BY s.id
      ORDER BY s.date_ouverture DESC
    `);
  },

  getById: async (id: number): Promise<Session | null> => {
    const database = await db;

    const session = await database.getFirstAsync<Session>(
      `SELECT * FROM sessions WHERE id = ?`,
      [id],
    );

    return session || null;
  },

  hasOpenSession: async (): Promise<boolean> => {
    const database = await db;

    const result = await database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM sessions WHERE statut = 'OUVERT'`,
    );

    return (result?.count ?? 0) > 0;
  },

  getOpenSession: async (): Promise<Session | null> => {
    const database = await db;

    const session = await database.getFirstAsync<Session>(
      `SELECT * FROM sessions 
       WHERE statut = 'OUVERT' 
       ORDER BY date_ouverture DESC 
       LIMIT 1`,
    );

    return session || null;
  },

  getOpenSessionWithStats: async (): Promise<SessionWithStats | null> => {
    const database = await db;

    const session = await database.getFirstAsync<SessionWithStats>(`
      SELECT 
        s.*,
        COALESCE(SUM(p.montant), 0) AS total_paiements,
        COUNT(p.id) AS nombre_paiements
      FROM sessions s
      LEFT JOIN paiements p ON s.id = p.session_id
      WHERE s.statut = 'OUVERTE'
      GROUP BY s.id
      ORDER BY s.date_ouverture DESC
      LIMIT 1
    `);

    return session || null;
  },

  /* ---------- PAIEMENTS ---------- */

  getPaiementsBySessionId: async (
    sessionId: number,
  ): Promise<PaiementWithMarchand[]> => {
    const database = await db;

    return database.getAllAsync<PaiementWithMarchand>(
      `
      SELECT 
        p.*,

        -- Nom marchand : priorité au marchand enregistré, sinon ambulant
        COALESCE(m.nom, p.marchandnom) AS marchand_nom,
        m.prenom AS marchand_prenom,

        CASE 
          WHEN p.marchand_id IS NULL THEN 1
          ELSE 0
        END AS is_paiement_manuel

      FROM paiements p
      LEFT JOIN marchands m ON p.marchand_id = m.id
      WHERE p.session_id = ?
      ORDER BY p.date_paiement DESC
    `,
      [sessionId],
    );
  },

  getPaiementsManuels: async (
    sessionId: number,
  ): Promise<PaiementWithMarchand[]> => {
    const database = await db;

    return database.getAllAsync<PaiementWithMarchand>(
      `
      SELECT 
        p.*,
        p.marchand_nom AS marchand_nom,
        NULL AS marchand_prenom,
        1 AS is_paiement_manuel
      FROM paiements p
      WHERE p.session_id = ?
        AND p.marchand_id IS NULL
      ORDER BY p.date_paiement DESC
    `,
      [sessionId],
    );
  },

  /* ---------- STATISTIQUES ---------- */

  getSessionStatsDetailed: async (sessionId: number) => {
    const database = await db;

    return database.getFirstAsync<{
      total_paiements: number;
      nombre_paiements: number;
      nombre_marchands: number;
      total_paiements_manuels: number;
      nombre_paiements_manuels: number;
      total_paiements_marchands: number;
      nombre_paiements_marchands: number;
    }>(
      `
      SELECT 
        COALESCE(SUM(p.montant), 0) AS total_paiements,
        COUNT(p.id) AS nombre_paiements,

        COUNT(DISTINCT CASE 
          WHEN p.marchand_id IS NOT NULL THEN p.marchand_id 
        END) AS nombre_marchands,

        COALESCE(SUM(CASE 
          WHEN p.marchand_id IS NULL THEN p.montant 
          ELSE 0 
        END), 0) AS total_paiements_manuels,

        COUNT(CASE 
          WHEN p.marchand_id IS NULL THEN 1 
        END) AS nombre_paiements_manuels,

        COALESCE(SUM(CASE 
          WHEN p.marchand_id IS NOT NULL THEN p.montant 
          ELSE 0 
        END), 0) AS total_paiements_marchands,

        COUNT(CASE 
          WHEN p.marchand_id IS NOT NULL THEN 1 
        END) AS nombre_paiements_marchands

      FROM paiements p
      WHERE p.session_id = ?
    `,
      [sessionId],
    );
  },

  getSessionStats: async (sessionId: number) => {
    const database = await db;

    return database.getFirstAsync<{
      total_paiements: number;
      nombre_paiements: number;
      nombre_marchands: number;
    }>(
      `
      SELECT 
        COALESCE(SUM(p.montant), 0) AS total_paiements,
        COUNT(p.id) AS nombre_paiements,
        COUNT(DISTINCT p.marchand_id) AS nombre_marchands
      FROM paiements p
      WHERE p.session_id = ?
    `,
      [sessionId],
    );
  },

  /* ---------- CRUD SESSION ---------- */

  /* ---------- CRUD SESSION ---------- */

  create: async (data: CreateSessionDTO): Promise<Session> => {
    const database = await db;

    const query = `
          INSERT INTO sessions (
            id, 
            nom, 
            date_ouverture, 
            statut
          ) VALUES (?, ?, datetime('now'), 'OUVERTE')
        `;

    try {
      await database.runAsync(query, [data.id, data.nom]);

      // Récupérer la session créée
      const session = await database.getFirstAsync<Session>(
        `SELECT * FROM sessions WHERE id = ?`,
        [data.id],
      );

      if (!session) {
        throw new Error("Session créée mais introuvable");
      }

      return session;
    } catch (error: any) {
      throw new Error(
        `Erreur lors de la création de la session: ${error.message}`,
      );
    }
  },

  update: async (id: number, session: Partial<Session>): Promise<void> => {
    const database = await db;

    const fields = Object.keys(session).filter(
      (key) => key !== "id" && key !== "created_at",
    );

    if (fields.length === 0) return;

    const values = fields.map((key) => session[key as keyof Session]);
    const setClause = fields.map((f) => `${f} = ?`).join(", ");

    await database.runAsync(
      `UPDATE sessions 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [...values, id],
    );
  },

  delete: async (id: number): Promise<void> => {
    const database = await db;
    await database.runAsync(`DELETE FROM sessions WHERE id = ?`, [id]);
  },

  closeSession: async (id: number): Promise<void> => {
    const database = await db;

    await database.runAsync(
      `UPDATE sessions 
       SET statut = 'FERMEE', date_fermeture = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [id],
    );
  },
};
