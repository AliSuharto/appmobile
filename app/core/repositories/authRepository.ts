import bcrypt from 'bcryptjs';
import { db } from '../database/sqlite';
import { jwtService } from '../services/jwtService'; // Ton service qui utilise expo-jwt

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role: string;
  telephone?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: Omit<User, 'password'>;
  token?: string;
  message?: string;
}

class AuthRepository {
  private readonly SALT_ROUNDS = 10;

  // ... (tes méthodes getUserByEmail, getUserById, etc. restent inchangées)

  async getUserByEmail(email: string): Promise<User | null> {
    // J'ai modifié pour retourner le password aussi (plus simple pour le login)
    try {
      const database = await db;
      const result = await database.getFirstAsync<User>(
        'SELECT * FROM users WHERE email = ? LIMIT 1',
        [email]
      );
      return result || null;
    } catch (error) {
      console.error('Erreur getUserByEmail:', error);
      throw error;
    }
  }

  async getUserByIdWithPassword(id: number): Promise<User | null> {
    // Identique à getUserByEmail mais par ID
    try {
      const database = await db;
      const result = await database.getFirstAsync<User>(
        'SELECT * FROM users WHERE id = ? LIMIT 1',
        [id]
      );
      return result || null;
    } catch (error) {
      console.error('Erreur getUserByIdWithPassword:', error);
      throw error;
    }
  }

  async getUserById(id: number): Promise<Omit<User, 'password'> | null> {
    try {
      const database = await db;
      const result = await database.getFirstAsync<Omit<User, 'password'>>(
        'SELECT id, nom, prenom, email, role, telephone, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
        [id]
      );
      return result || null;
    } catch (error) {
      console.error('Erreur getUserById:', error);
      throw error;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Erreur verifyPassword:', error);
      return false;
    }
  }

  /**
   * GÉNÈRE UN VRAI JWT (avec points) → plus de btoa ni JSON.stringify !
   */
  async generateToken(user: Omit<User, 'password'>): Promise<string> {
    try {
      // Passe directement les champs nécessaires à jwtService
      return jwtService.generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      console.error('Erreur generateToken:', error);
      throw error;
    }
  }

  /**
   * VÉRIFIE LE JWT (signature + expiration)
   */
  async verifyToken(token: string): Promise<any> {
    try {
      return jwtService.isTokenValid(token, token); // ou passe l'email attendu si tu veux
      // Si tu veux juste décoder sans vérifier la signature (moins sécurisé) :
      // return jwtService.decodeToken(token);
    } catch (error) {
      console.error('Erreur verifyToken:', error);
      throw new Error('Token invalide ou expiré');
    }
  }

  async updateLastLogin(userId: number): Promise<void> {
    try {
      const database = await db;
      await database.runAsync(
        'UPDATE users SET updated_at = ? WHERE id = ?',
        [new Date().toISOString(), userId]
      );
    } catch (error) {
      console.error('Erreur updateLastLogin:', error);
    }
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    try {
      const database = await db;
      await database.runAsync(
        'UPDATE users SET password = ?, updated_at = ? WHERE id = ?',
        [hashedPassword, new Date().toISOString(), userId]
      );
    } catch (error) {
      console.error('Erreur updatePassword:', error);
      throw error;
    }
  }
}

export const authRepository = new AuthRepository();