
import type { SQLiteDatabase } from 'expo-sqlite';
import { db } from '../database/sqlite';

export interface Marchand {
  id: number;
  nom: string;
  prenom?: string;
  telephone?: string;
  cin?: string;
  nif?: string;
  stat?: string;
  type_activite?: string;
  statut_de_paiement?: string;
  etat?: string;
  date_inscription?: string;
  created_at: string;
  updated_at: string;
}

export interface MarchandWithPlace extends Marchand {
  place_id?: number;
  place_nom?: string;
  place_statut?: string;
}

export interface MarchandEndette extends Marchand {
  total_droit_annuel: number;
  total_paye: number;
  dette: number;
  nombre_places: number;
}

class MarchandsRepository {
  private database: SQLiteDatabase | null = null;

  private async getDb(): Promise<SQLiteDatabase> {
    if (!this.database) {
      this.database = await db;
    }
    return this.database;
  }

  /**
   * Récupérer un marchand par son ID
   */
  async getMarchandById(id: number): Promise<Marchand | null> {
    try {
      const database = await this.getDb();
      const result = await database.getFirstAsync<Marchand>(
        `SELECT * FROM marchands WHERE id = ?`,
        [id]
      );
      return result || null;
    } catch (error) {
      console.error('Erreur getMarchandById:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les marchands
   */
  async getAllMarchands(): Promise<Marchand[]> {
    try {
      const database = await this.getDb();
      const result = await database.getAllAsync<Marchand>(
        `SELECT * FROM marchands ORDER BY nom, prenom`
      );
      return result;
    } catch (error) {
      console.error('Erreur getAllMarchands:', error);
      throw error;
    }
  }

  /**
   * Récupérer les marchands endettés
   * Un marchand est endetté si le total de ses droits annuels > total payé
   */
  async getMarchandsEndettes(): Promise<MarchandEndette[]> {
    try {
      const database = await this.getDb();
      const query = `
        SELECT 
          m.*,
          COALESCE(SUM(p.droit_annuel), 0) as total_droit_annuel,
          COALESCE(SUM(pa.montant), 0) as total_paye,
          COALESCE(SUM(p.droit_annuel), 0) - COALESCE(SUM(pa.montant), 0) as dette,
          COUNT(DISTINCT p.id) as nombre_places
        FROM marchands m
        LEFT JOIN places p ON p.marchand_id = m.id
        LEFT JOIN paiements pa ON pa.marchand_id = m.id
        GROUP BY m.id
        HAVING dette > 0
        ORDER BY dette DESC
      `;
      
      const result = await database.getAllAsync<MarchandEndette>(query);
      return result;
    } catch (error) {
      console.error('Erreur getMarchandsEndettes:', error);
      throw error;
    }
  }

  /**
   * Récupérer les marchands sans place
   */
  async getMarchandsSansPlace(): Promise<Marchand[]> {
    try {
      const database = await this.getDb();
      const query = `
        SELECT m.*
        FROM marchands m
        LEFT JOIN places p ON p.marchand_id = m.id
        WHERE p.id IS NULL
        ORDER BY m.nom, m.prenom
      `;
      
      const result = await database.getAllAsync<Marchand>(query);
      return result;
    } catch (error) {
      console.error('Erreur getMarchandsSansPlace:', error);
      throw error;
    }
  }

  /**
   * Créer un nouveau marchand
   */
  async createMarchand(marchand: Omit<Marchand, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    try {
      const database = await this.getDb();
      const result = await database.runAsync(
        `INSERT INTO marchands (
          nom, prenom, telephone, cin, nif, stat, 
          type_activite, statut_de_paiement, etat, date_inscription
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          marchand.nom,
          marchand.prenom || null,
          marchand.telephone || null,
          marchand.cin || null,
          marchand.nif || null,
          marchand.stat || null,
          marchand.type_activite || null,
          marchand.statut_de_paiement || null,
          marchand.etat || null,
          marchand.date_inscription || null,
        ]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Erreur createMarchand:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un marchand
   */
  async updateMarchand(id: number, marchand: Partial<Omit<Marchand, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
    try {
      const database = await this.getDb();
      const fields: string[] = [];
      const values: any[] = [];

      Object.entries(marchand).forEach(([key, value]) => {
        fields.push(`${key} = ?`);
        values.push(value);
      });

      if (fields.length === 0) return;

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const query = `UPDATE marchands SET ${fields.join(', ')} WHERE id = ?`;
      await database.runAsync(query, values);
    } catch (error) {
      console.error('Erreur updateMarchand:', error);
      throw error;
    }
  }

  /**
   * Supprimer un marchand
   */
  async deleteMarchand(id: number): Promise<void> {
    try {
      const database = await this.getDb();
      await database.runAsync(`DELETE FROM marchands WHERE id = ?`, [id]);
    } catch (error) {
      console.error('Erreur deleteMarchand:', error);
      throw error;
    }
  }

  /**
   * Rechercher des marchands par nom ou prénom
   */
  async searchMarchands(searchTerm: string): Promise<Marchand[]> {
    try {
      const database = await this.getDb();
      const term = `%${searchTerm}%`;
      const result = await database.getAllAsync<Marchand>(
        `SELECT * FROM marchands 
         WHERE nom LIKE ? OR prenom LIKE ? OR telephone LIKE ?
         ORDER BY nom, prenom`,
        [term, term, term]
      );
      return result;
    } catch (error) {
      console.error('Erreur searchMarchands:', error);
      throw error;
    }
  }

  /**
   * Compter le nombre total de marchands
   */
  async countMarchands(): Promise<number> {
    try {
      const database = await this.getDb();
      const result = await database.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM marchands`
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Erreur countMarchands:', error);
      throw error;
    }
  }
}

export const marchandsRepository = new MarchandsRepository();