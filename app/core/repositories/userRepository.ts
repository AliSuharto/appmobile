import { db } from "../database/sqlite";
import { authRepository } from "./authRepository";

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

export interface PasswordResetData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
}

export interface PasswordResetResult {
  success: boolean;
  newPassword?: string;
  message?: string;
}

export const userRepository = {
  /**
   * Récupérer tous les utilisateurs
   */
  async getAll(): Promise<User[]> {
    const database = await db;
    const result = await database.getAllAsync<User>(
      `SELECT * FROM users ORDER BY created_at DESC`,
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
      [id],
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
      [email],
    );
    return result.length > 0 ? result[0] : null;
  },

  /**
   * Créer un nouvel utilisateur
   */
  async create(
    user: Omit<User, "id" | "created_at" | "updated_at">,
  ): Promise<number> {
    const database = await db;
    const result = await database.runAsync(
      `INSERT INTO users (nom, prenom, email, role, telephone)
       VALUES (?, ?, ?, ?, ?)`,
      [user.nom, user.prenom, user.email, user.role, user.telephone],
    );
    return result.lastInsertRowId;
  },

  /**
   * Mettre à jour un utilisateur
   */
  async update(
    id: number,
    updates: Partial<Omit<User, "id" | "created_at">>,
  ): Promise<void> {
    const database = await db;
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== "updated_at") {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    await database.runAsync(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values,
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
      [userId],
    );

    // Montant total collecté
    const montantResult = await database.getAllAsync<{ total: number | null }>(
      `SELECT SUM(montant) as total FROM paiements WHERE agent_id = ?`,
      [userId],
    );

    // Nombre de sessions actives où l'utilisateur est régisseur principal
    const sessionsResult = await database.getAllAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sessions 
       WHERE regisseur_principal_id = ? AND statut = 'VALIDEE'`,
      [userId],
    );

    // Date du dernier paiement enregistré
    const dernierPaiementResult = await database.getAllAsync<{
      date: string | null;
    }>(`SELECT MAX(date_paiement) as date FROM paiements WHERE agent_id = ?`, [
      userId,
    ]);

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
    }>(
      `SELECT 
        p.id,
        p.montant,
        p.type_paiement,
        p.date_paiement,
        m.marchandnom as marchand_nom,        
       FROM paiements p
       WHERE p.agent_id = ?
       ORDER BY p.date_paiement DESC
       LIMIT ?`,
      [userId, limit],
    );
    return result;
  },

  /**
   * Compter le nombre d'utilisateurs par rôle
   */
  async countByRole(): Promise<{ role: string; count: number }[]> {
    const database = await db;
    const result = await database.getAllAsync<{ role: string; count: number }>(
      `SELECT role, COUNT(*) as count FROM users GROUP BY role`,
    );
    return result;
  },

  /**
   * Génère un mot de passe aléatoire sécurisé
   */
  generateRandomPassword(length: number = 12): string {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";

    const allChars = uppercase + lowercase + numbers + symbols;
    let password = "";

    // S'assurer qu'on a au moins un de chaque type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Remplir le reste
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Mélanger les caractères
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  },

  /**
   * Vérifie les informations de l'utilisateur et réinitialise le mot de passe
   */
  async resetPasswordWithVerification(
    data: PasswordResetData,
  ): Promise<PasswordResetResult> {
    try {
      const database = await db;

      // Normaliser les données pour la comparaison
      const normalizedData = {
        nom: data.nom.trim().toLowerCase(),
        prenom: data.prenom.trim().toLowerCase(),
        email: data.email.trim().toLowerCase(),
        telephone: data.telephone.trim(),
        role: data.role.trim().toLowerCase(),
      };

      console.log("🔍 Recherche d'utilisateur avec:", normalizedData);

      // Chercher l'utilisateur avec TOUS les critères
      const user = await database.getFirstAsync<User>(
        `SELECT * FROM users 
         WHERE LOWER(TRIM(nom)) = ? 
         AND LOWER(TRIM(prenom)) = ? 
         AND LOWER(TRIM(email)) = ? 
         AND TRIM(telephone) = ? 
         AND LOWER(TRIM(role)) = ?
         LIMIT 1`,
        [
          normalizedData.nom,
          normalizedData.prenom,
          normalizedData.email,
          normalizedData.telephone,
          normalizedData.role,
        ],
      );

      if (!user) {
        console.log("❌ Aucun utilisateur trouvé avec ces informations");
        return {
          success: false,
          message:
            "Aucun compte ne correspond à ces informations. Veuillez vérifier vos données.",
        };
      }

      console.log("✅ Utilisateur trouvé:", user.email);

      // Générer un nouveau mot de passe
      const newPassword = this.generateRandomPassword(12);
      console.log("🔑 Nouveau mot de passe généré");

      // Hasher le nouveau mot de passe
      const hashedPassword = await authRepository.hashPassword(newPassword);

      // Mettre à jour le mot de passe dans la base de données
      await database.runAsync(
        "UPDATE users SET password = ?, updated_at = ? WHERE id = ?",
        [hashedPassword, new Date().toISOString(), user.id],
      );

      console.log("💾 Mot de passe mis à jour dans la base de données");

      return {
        success: true,
        newPassword: newPassword,
        message: "Mot de passe réinitialisé avec succès",
      };
    } catch (error) {
      console.error(
        "❌ Erreur lors de la réinitialisation du mot de passe:",
        error,
      );
      throw new Error("Erreur lors de la réinitialisation du mot de passe");
    }
  },
};
