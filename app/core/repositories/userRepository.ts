import { db } from '../database/sqlite';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  telephone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  totalPaiementsEnregistres: number;
  montantTotalCollecte: number;
  nombreSessionsActives: number;
  dernierPaiementDate: string | null;
}

export const userRepository = {
  /**
   * Récupérer tous les utilisateurs
   */
  async getAll(): Promise<User[]> {
    const database = await db;
    const result = await database.getAllAsync<User>(
      `SELECT * FROM users ORDER BY created_at DESC`
    );
    return result;
  },

  /**
   * Récupérer un utilisateur par ID
   */
  async getById(id: number): Promise<User | null> {
    const database = await db;
    const result = await database.getAllAsync<User>(
      `SELECT * FROM users WHERE id = ?`,
      [id]
    );
    return result.length > 0 ? result[0] : null;
  },

  /**
   * Récupérer un utilisateur par email
   */
  async getByEmail(email: string): Promise<User | null> {
    const database = await db;
    const result = await database.getAllAsync<User>(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );
    return result.length > 0 ? result[0] : null;
  },

  /**
   * Créer un nouvel utilisateur
   */
  async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const database = await db;
    const result = await database.runAsync(
      `INSERT INTO users (nom, prenom, email, role, telephone)
       VALUES (?, ?, ?, ?, ?)`,
      [user.nom, user.prenom, user.email, user.role, user.telephone]
    );
    return result.lastInsertRowId;
  },

  /**
   * Mettre à jour un utilisateur
   */
  async update(id: number, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<void> {
    const database = await db;
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'updated_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await database.runAsync(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  /**
   * Supprimer un utilisateur
   */
  async delete(id: number): Promise<void> {
    const database = await db;
    await database.runAsync(`DELETE FROM users WHERE id = ?`, [id]);
  },

  /**
   * Récupérer les statistiques d'un utilisateur (agent)
   */
  async getUserStats(userId: number): Promise<UserStats> {
    const database = await db;

    // Nombre de paiements enregistrés par cet agent
    const paiementsResult = await database.getAllAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM paiements WHERE agent_id = ?`,
      [userId]
    );

    // Montant total collecté
    const montantResult = await database.getAllAsync<{ total: number | null }>(
      `SELECT SUM(montant) as total FROM paiements WHERE agent_id = ?`,
      [userId]
    );

    // Nombre de sessions actives où l'utilisateur est régisseur principal
    const sessionsResult = await database.getAllAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sessions 
       WHERE regisseur_principal_id = ? AND statut = 'active'`,
      [userId]
    );

    // Date du dernier paiement enregistré
    const dernierPaiementResult = await database.getAllAsync<{ date: string | null }>(
      `SELECT MAX(date_paiement) as date FROM paiements WHERE agent_id = ?`,
      [userId]
    );

    return {
      totalPaiementsEnregistres: paiementsResult[0]?.count || 0,
      montantTotalCollecte: montantResult[0]?.total || 0,
      nombreSessionsActives: sessionsResult[0]?.count || 0,
      dernierPaiementDate: dernierPaiementResult[0]?.date || null,
    };
  },

  /**
   * Récupérer les derniers paiements enregistrés par un agent
   */
  async getRecentPaiements(userId: number, limit: number = 5) {
    const database = await db;
    const result = await database.getAllAsync<{
      id: number;
      montant: number;
      type_paiement: string;
      date_paiement: string;
      marchand_nom: string;
      marchand_prenom: string;
    }>(
      `SELECT 
        p.id,
        p.montant,
        p.type_paiement,
        p.date_paiement,
        m.nom as marchand_nom,
        m.prenom as marchand_prenom
       FROM paiements p
       INNER JOIN marchands m ON p.marchand_id = m.id
       WHERE p.agent_id = ?
       ORDER BY p.date_paiement DESC
       LIMIT ?`,
      [userId, limit]
    );
    return result;
  },

  /**
   * Compter le nombre d'utilisateurs par rôle
   */
  async countByRole(): Promise<{ role: string; count: number }[]> {
    const database = await db;
    const result = await database.getAllAsync<{ role: string; count: number }>(
      `SELECT role, COUNT(*) as count FROM users GROUP BY role`
    );
    return result;
  },
};