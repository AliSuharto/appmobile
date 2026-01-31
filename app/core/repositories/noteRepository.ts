import { db } from "../database/sqlite";

export interface Note {
  id: number;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export const noteRepository = {
  /**
   * Récupérer toutes les notes avec recherche optionnelle
   */
  async getAll(searchQuery?: string): Promise<Note[]> {
    const database = await db;
    let query = `SELECT * FROM notes WHERE 1=1`;
    const params: any[] = [];

    if (searchQuery) {
      query += ` AND (title LIKE ? OR content LIKE ?)`;
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    query += ` ORDER BY updated_at DESC`;

    const result = await database.getAllAsync<Note>(query, params);
    return result;
  },

  /**
   * Récupérer une note par ID
   */
  async getById(id: number): Promise<Note | null> {
    const database = await db;
    const query = `SELECT * FROM notes WHERE id = ?`;
    const result = await database.getAllAsync<Note>(query, [id]);
    return result.length > 0 ? result[0] : null;
  },

  /**
   * Créer une nouvelle note
   */
  async create(
    note: Omit<Note, "id" | "created_at" | "updated_at">,
  ): Promise<number> {
    const database = await db;
    const result = await database.runAsync(
      `INSERT INTO notes (title, content) VALUES (?, ?)`,
      [note.title, note.content],
    );
    return result.lastInsertRowId;
  },

  /**
   * Mettre à jour une note
   */
  async update(
    id: number,
    updates: Partial<Omit<Note, "id" | "created_at">>,
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
      `UPDATE notes SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
  },

  /**
   * Supprimer une note
   */
  async delete(id: number): Promise<void> {
    const database = await db;
    await database.runAsync(`DELETE FROM notes WHERE id = ?`, [id]);
  },

  /**
   * Obtenir les statistiques des notes
   */
  async getStats(): Promise<{
    total: number;
  }> {
    const database = await db;
    const result = await database.getAllAsync<{ count: number }>(`
      SELECT COUNT(*) as count FROM notes
    `);

    return {
      total: result[0]?.count || 0,
    };
  },
};
