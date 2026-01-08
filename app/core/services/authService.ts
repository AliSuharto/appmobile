import { BASE_URL_API } from '@/app/utilitaire/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { db } from '../database/sqlite';
import { jwtService } from './jwtService';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResult {
  success: boolean;
  token?: string;
  user?: any;
  message?: string;
}

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  telephone?: string;
  password?: string;
}

/**
 * Hache le mot de passe pour le stockage local (SHA-256)
 * Note: On utilise SHA-256 en local car bcrypt n'est pas disponible côté mobile
 */
const hashPasswordLocal = async (password: string): Promise<string> => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + 'SALT_LOCAL_2025'
  );
};

/**
 * Vérifie si des données utilisateur existent en local
 */
const hasLocalData = async (): Promise<boolean> => {
  try {
    const database = await db;
    const result = await database.getAllAsync('SELECT COUNT(*) as count FROM users');
    return (result[0] as any).count > 0;
  } catch (error) {
    console.error('Erreur vérification données locales:', error);
    return false;
  }
};

/**
 * Effectue une synchronisation initiale silencieuse
 * Appelée automatiquement après la première connexion API
 * IMPORTANT: Ne synchronise PAS l'utilisateur (déjà géré par saveUserLocally)
 */
const performInitialSync = async (token: string): Promise<void> => {
  try {
    console.log('🔄 Début de la synchronisation initiale silencieuse...');
    
    const response = await fetch(`${BASE_URL_API}/public/sync/initial`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur HTTP:', response.status, errorText);
      throw new Error(`Erreur HTTP lors de la sync initiale: ${response.status}`);
    }

    const result = await response.json();
    console.log('📦 Réponse sync/initial reçue');
    
    const syncData = result.data || result;
    
    if (!syncData || typeof syncData !== 'object') {
      throw new Error('Structure de réponse invalide');
    }
    
    const database = await db;

    // 1. Marchés
    if (syncData.marchees && Array.isArray(syncData.marchees)) {
      for (const marchee of syncData.marchees) {
        await database.runAsync(
          `INSERT OR REPLACE INTO marchees (id, nom, adresse, description, updated_at)
           VALUES (?, ?, ?, ?, ?)`,
          [marchee.id, marchee.nom, marchee.adresse || null, marchee.description || null, new Date().toISOString()]
        );
      }
      console.log(`✅ ${syncData.marchees.length} marchés synchronisés`);
    }

    // 2. Zones
    if (syncData.zones && Array.isArray(syncData.zones)) {
      for (const zone of syncData.zones) {
        await database.runAsync(
          `INSERT OR REPLACE INTO zones (id, nom, marchee_id, marchee_name, description, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [zone.id, zone.nom, zone.marcheeId, zone.marcheeName || null, zone.description || null, new Date().toISOString()]
        );
      }
      console.log(`✅ ${syncData.zones.length} zones synchronisées`);
    }

    // 3. Halls
    if (syncData.halls && Array.isArray(syncData.halls)) {
      for (const hall of syncData.halls) {
        await database.runAsync(
          `INSERT OR REPLACE INTO halls (id, nom, numero, description, code_unique, nbr_place, marchee_id, zone_id, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            hall.id,
            hall.nom,
            hall.numero || null,
            hall.description || null,
            hall.codeUnique || null,
            hall.nbrPlace || null,
            hall.marcheeId || null,
            hall.zoneId || null,
            new Date().toISOString()
          ]
        );
      }
      console.log(`✅ ${syncData.halls.length} halls synchronisés`);
    }

    // 4. Marchands
    if (syncData.marchands && Array.isArray(syncData.marchands)) {
      for (const marchand of syncData.marchands) {
        await database.runAsync(
          `INSERT OR REPLACE INTO marchands (id, nom, prenom, telephone, cin, nif, stat, type_activite, statut_de_paiement, etat, date_inscription, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            marchand.id,
            marchand.nom,
            marchand.prenom || null,
            marchand.telephone || null,
            marchand.cin || null,
            marchand.Nif || null,
            marchand.Stat || null,
            marchand.typeActivite || null,
            marchand.statutDePaiement || null,
            marchand.etat || null,
            marchand.dateInscription || null,
            new Date().toISOString()
          ]
        );
      }
      console.log(`✅ ${syncData.marchands.length} marchands synchronisés`);
    }

    // 5. Places
    if (syncData.places && Array.isArray(syncData.places)) {
      for (const place of syncData.places) {
        await database.runAsync(
          `INSERT OR REPLACE INTO places (id, nom, statut, date_debut_occupation, droit_annuel, categorie, marchee_id, zone_id, hall_id, marchand_id, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            place.id,
            place.nom,
            place.statut || 'disponible',
            place.dateDebutOccupation || null,
            place.droitannuel || null,
            place.categorie || null,
            place.marcheeId || null,
            place.zoneId || null,
            place.hallId || null,
            place.marchandId || null,
            new Date().toISOString()
          ]
        );
      }
      console.log(`✅ ${syncData.places.length} places synchronisées`);
    }

    // 6. Sessions
    if (syncData.sessions && Array.isArray(syncData.sessions)) {
      for (const session of syncData.sessions) {
        await database.runAsync(
          `INSERT OR REPLACE INTO sessions (id, nom, montant, date_ouverture, date_fermeture, statut, regisseur_principal_id, validation_date, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            session.id,
            session.nom,
            session.montant || null,
            session.dateOuverture,
            session.dateFermeture || null,
            session.statut || 'active',
            session.regisseurPrincipalId || null,
            session.validation_date || null,
            new Date().toISOString()
          ]
        );
      }
      console.log(`✅ ${syncData.sessions.length} sessions synchronisées`);
    }

    // 7. Paiements
    if (syncData.paiements && Array.isArray(syncData.paiements)) {
      for (const paiement of syncData.paiements) {
        await database.runAsync(
          `INSERT OR REPLACE INTO paiements (id, montant, type_paiement, date_paiement, motif, marchand_id, place_id, session_id, agent_id, date_debut, date_fin, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            paiement.id,
            paiement.montant,
            paiement.typePaiement || null,
            paiement.datePaiement || new Date().toISOString(),
            paiement.motif || null,
            paiement.marchandId,
            paiement.placeId || null,
            paiement.sessionId,
            paiement.agentId,
            paiement.dateDebut || null,
            paiement.dateFin || null,
            new Date().toISOString()
          ]
        );
      }
      console.log(`✅ ${syncData.paiements.length} paiements synchronisés`);
    }

    // 8. Quittances
    if (syncData.quittances && Array.isArray(syncData.quittances)) {
      for (const quittance of syncData.quittances) {
        await database.runAsync(
          `INSERT OR REPLACE INTO quittances (id, creation_date, date_utilisation, nom, etat, quittance_plage_id, paiement_id, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            quittance.id,
            quittance.creationDate || new Date().toISOString(),
            quittance.dateUtilisation || null,
            quittance.nom,
            quittance.etat || null,
            quittance.QuittancePlageId || null,
            quittance.paiementId || null,
            new Date().toISOString()
          ]
        );
      }
      console.log(`✅ ${syncData.quittances.length} quittances synchronisées`);
    }

    // Mettre à jour les métadonnées de synchronisation
    await database.runAsync(
      `INSERT OR REPLACE INTO sync_metadata (id, last_sync_timestamp, sync_status, error_message)
       VALUES (1, ?, 'success', NULL)`,
      [syncData.syncTimestamp || new Date().toISOString()]
    );

    await AsyncStorage.setItem('last_sync_timestamp', syncData.syncTimestamp || new Date().toISOString());

    console.log('✅ Synchronisation initiale silencieuse terminée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation initiale silencieuse:', error);
    // Ne pas bloquer la connexion en cas d'échec de sync
  }
};

/**
 * Sauvegarde l'utilisateur dans la base de données locale
 * Le mot de passe est haché avec SHA-256 pour usage local uniquement
 */
const saveUserLocally = async (user: any, password: string): Promise<void> => {
  try {
    const database = await db;
    const hashedPassword = await hashPasswordLocal(password);
    
    console.log('💾 Sauvegarde utilisateur local:', user.email);
    
    // Vérifier si l'utilisateur existe déjà
    const existing = await database.getAllAsync(
      'SELECT id FROM users WHERE email = ?',
      [user.email]
    );

    if (existing.length > 0) {
      // Mise à jour de l'utilisateur existant
      await database.runAsync(
        `UPDATE users 
         SET nom = ?, prenom = ?, password = ?, role = ?, telephone = ?, updated_at = CURRENT_TIMESTAMP
         WHERE email = ?`,
        [user.nom, user.prenom, hashedPassword, user.role, user.telephone || null, user.email]
      );
      console.log('🔄 Utilisateur mis à jour localement:', user.email);
    } else {
      // Insertion d'un nouvel utilisateur
      await database.runAsync(
        `INSERT INTO users (id, nom, prenom, email, password, role, telephone, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [user.id, user.nom, user.prenom, user.email, hashedPassword, user.role, user.telephone || null]
      );
      console.log('➕ Nouvel utilisateur inséré localement:', user.email);
    }
  } catch (error) {
    console.error('❌ Erreur sauvegarde utilisateur local:', error);
    throw error;
  }
};

/**
 * Authentification via l'API distante
 */
const loginViaAPI = async (
  credentials: LoginCredentials
): Promise<AuthResult> => {
  try {
    console.log('🌐 Tentative de connexion via API:', credentials.email);

    const response = await fetch(`${BASE_URL_API}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    const apiResponse = await response.json();
    console.log('🌐 Réponse API reçue:', apiResponse);

    // Cas erreur HTTP ou métier
    if (!response.ok || !apiResponse.success) {
      return {
        success: false,
        message: apiResponse.message || 'Échec de la connexion',
      };
    }

    // Extraction correcte des données
    const authData = apiResponse.data;

    if (!authData?.token || !authData?.user) {
      return {
        success: false,
        message: 'Réponse serveur invalide (token ou utilisateur manquant)',
      };
    }

    const { token, user } = authData;

    // Vérifier s'il s'agit d'une première connexion AVANT de sauvegarder
    const isFirstLogin = !(await hasLocalData());

    // Sauvegarde utilisateur locale avec le mot de passe haché localement
    await saveUserLocally(user, credentials.password);
    console.log('✅ Utilisateur sauvegardé localement');

    // Lancer la synchronisation initiale silencieuse en arrière-plan si c'est la première connexion
    if (isFirstLogin) {
      console.log('🎯 Première connexion détectée - Lancement de la sync initiale silencieuse');
      // Ne pas attendre la fin de la sync pour ne pas bloquer la connexion
      performInitialSync(token).catch(err => {
        console.error('⚠️ La synchronisation initiale a échoué mais la connexion est maintenue:', err);
      });
    }

    return {
      success: true,
      token,
      user,
      message: apiResponse.message || 'Connexion réussie',
    };

  } catch (error: any) {
    console.error('❌ Erreur connexion API:', error);

    return {
      success: false,
      message:
        'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
    };
  }
};

/**
 * Authentification via la base de données locale
 * Utilisée en mode hors-ligne ou quand l'utilisateur a déjà été synchronisé
 */
const loginViaLocal = async (credentials: LoginCredentials): Promise<AuthResult> => {
  try {
    console.log('💾 Tentative de connexion locale:', credentials.email);
    
    const database = await db;
    const hashedPassword = await hashPasswordLocal(credentials.password);
    
    const result = await database.getAllAsync(
      `SELECT id, nom, prenom, email, role, telephone 
       FROM users 
       WHERE email = ? AND password = ?`,
      [credentials.email, hashedPassword]
    );

    if (result.length === 0) {
      return {
        success: false,
        message: 'Identifiants incorrects',
      };
    }

    const user = result[0] as User;
    
    // Mise à jour de la date de dernière connexion
    await database.runAsync(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );
    
    // Générer un token local simple
    const token = jwtService.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    console.log('✅ Connexion locale réussie:', user.email);

    return {
      success: true,
      token,
      user,
      message: 'Connexion locale réussie',
    };
  } catch (error: any) {
    console.error('❌ Erreur connexion locale:', error);
    return {
      success: false,
      message: 'Erreur lors de la connexion locale',
    };
  }
};

/**
 * Connexion principale (logique hybride)
 * 1. Si pas de données locales → connexion API obligatoire (+ sync silencieuse)
 * 2. Si données locales existent → essai local d'abord, puis API si échec
 */
const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
  try {
    // Vérifier si des données locales existent
    const hasLocal = await hasLocalData();
    
    if (!hasLocal) {
      // Première connexion : authentification via API obligatoire (+ sync silencieuse automatique)
      console.log('🆕 Première connexion détectée : authentification via API');
      return await loginViaAPI(credentials);
    } 
    else {
      // Données locales existent : essayer connexion locale d'abord
      console.log('📂 Données locales trouvées : tentative de connexion locale');
      const localResult = await loginViaLocal(credentials);
       
      if (localResult.success) {
        // Succès en local
        return localResult;
      }
      
      // Échec local : peut-être que le mot de passe a changé sur le serveur
      console.log('🔄 Échec connexion locale, tentative via API');
      const apiResult = await loginViaAPI(credentials);
      
      if (apiResult.success) {
        // Le mot de passe a changé, les données locales ont été mises à jour
        console.log('🔑 Mot de passe mis à jour depuis le serveur');
      }
      
      return apiResult;
    }
  } catch (error: any) {
    console.error('💥 Erreur critique lors de la connexion:', error);
    return {
      success: false,
      message: 'Erreur inattendue lors de la connexion',
    };
  }
};

/**
 * Vérification du token
 * Pour une app mobile, on fait une vérification simple locale
 */
const verifyToken = async (token: string): Promise<AuthResult> => {
  try {
    // Récupérer les données utilisateur stockées
    const userData = await AsyncStorage.getItem('userData');
    
    if (!userData) {
      return {
        success: false,
        message: 'Session expirée',
      };
    }
    
    const user = JSON.parse(userData);
    
    // Vérifier que l'utilisateur existe toujours en local
    const database = await db;
    const result = await database.getAllAsync(
      'SELECT id, nom, prenom, email, role, telephone FROM users WHERE id = ?',
      [user.id]
    );
    
    if (result.length === 0) {
      return {
        success: false,
        message: 'Utilisateur introuvable',
      };
    }

    return {
      success: true,
      user: result[0],
      token,
      message: 'Token valide',
    };
  } catch (error) {
    console.error('❌ Erreur vérification token:', error);
    return {
      success: false,
      message: 'Token invalide',
    };
  }
};

/**
 * Synchronisation manuelle forcée
 * À appeler explicitement quand l'utilisateur veut synchroniser
 */
const syncWithAPI = async (email: string, password: string): Promise<AuthResult> => {
  try {
    console.log('🔄 Synchronisation manuelle demandée...');
    const result = await loginViaAPI({ email, password });
    
    if (result.success) {
      const database = await db;
      await database.runAsync(
        `UPDATE sync_metadata 
         SET last_sync_timestamp = ?, sync_status = 'success', error_message = NULL 
         WHERE id = 1`,
        [new Date().toISOString()]
      );
      
      return {
        success: true,
        message: '✅ Synchronisation réussie',
      };
    }
    
    return result;
  } catch (error: any) {
    return {
      success: false,
      message: '❌ Erreur de synchronisation',
    };
  }
};

/**
 * Obtenir l'état de la dernière synchronisation
 */
const getSyncStatus = async (): Promise<{ lastSync: string; status: string; error?: string } | null> => {
  try {
    const database = await db;
    const result = await database.getAllAsync(
      'SELECT last_sync_timestamp, sync_status, error_message FROM sync_metadata WHERE id = 1'
    );
    
    if (result.length > 0) {
      const row = result[0] as any;
      return {
        lastSync: row.last_sync_timestamp,
        status: row.sync_status,
        error: row.error_message,
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erreur récupération statut sync:', error);
    return null;
  }
};

/**
 * Nettoie toutes les données utilisateur locales (utile pour le logout complet)
 */
const clearLocalData = async (): Promise<void> => {
  try {
    const database = await db;
    await database.runAsync('DELETE FROM users');
    console.log('🗑️ Données utilisateur locales supprimées');
  } catch (error) {
    console.error('❌ Erreur suppression données locales:', error);
  }
};

// Export des fonctions
export const authService = {
  login,
  verifyToken,
  syncWithAPI,
  hasLocalData,
  clearLocalData,
  getSyncStatus,
};