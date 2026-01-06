import { BASE_URL_API } from '@/app/utilitaire/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { db } from '../database/sqlite';

// Configuration
 // Remplacez par votre URL
const AUTH_TOKEN = SecureStore.getItem('userToken');

interface SyncDataResponse {
  user: UserSyncData;
  marchees: MarcheeData[];
  zones: ZoneData[];
  halls: HallData[];
  places: PlaceData[];
  marchands: MarchandData[];
  paiements: PaiementData[];
  quittances: QuittanceData[];
  sessions: SessionData[];
  syncTimestamp: string;
}

interface UserSyncData {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  telephone?: string;
}

interface MarcheeData {
  id: number;
  nom: string;
  description?: string;
  adresse?: string;
}

interface ZoneData {
  id: number;
  nom: string;
  description?: string;
  marcheeId: number;
  marcheeName?: string;
}

interface HallData {
  id: number;
  nom: string;
  numero?: number;
  description?: string;
  codeUnique?: string;
  nbrPlace?: number;
  marcheeId?: number;
  zoneId?: number;
}

interface PlaceData {
  id: number;
  nom: string;
  statut?: string;
  dateDebutOccupation?: string;
  droitannuel?: number;
  categorie?: number;
  hallId?: number;
  zoneId?: number;
  marcheeId?: number;
  marchandId?: number;
}

interface MarchandData {
  id: number;
  nom: string;
  prenom?: string;
  statutDePaiement?: string;
  etat?: string;
  telephone?: string;
  cin?: string;
  Nif?: string;
  Stat?: string;
  typeActivite?: string;
  dateInscription?: string;
}

interface PaiementData {
  id: number;
  montant: number;
  typePaiement?: string;
  datePaiement?: string;
  motif?: string;
  marchandId: number;
  placeId?: number;
  sessionId: number;
  agentId: number;
  dateDebut?: string;
  dateFin?: string;
}

interface QuittanceData {
  id: number;
  creationDate?: string;
  dateUtilisation?: string;
  nom: string;
  etat?: string;
  QuittancePlageId?: number;
  paiementId?: number;
}

interface SessionData {
  id: number;
  nom: string;
  montant?: number;
  dateOuverture: string;
  dateFermeture?: string;
  statut?: string;
  regisseurPrincipalId?: number;
  validation_date?: string;
}

export class SyncService {
  /**
   * Récupère les données depuis le backend
   */
  private async fetchSyncData(): Promise<SyncDataResponse> {
    try {
      const response = await fetch(`${BASE_URL_API}/public/sync/initial`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      // Le backend retourne ApiResponse.success() qui wrap les données
      return result.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      throw error;
    }
  }

  /**
   * Insère ou met à jour un utilisateur
   */
  private async syncUser(user: UserSyncData): Promise<void> {
    const database = await db;
    
    await database.runAsync(
      `INSERT OR REPLACE INTO users (id, nom, prenom, email, role, telephone, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.nom, user.prenom || null, user.email, user.role, user.telephone || null, new Date().toISOString()]
    );
  }

  /**
   * Synchronise les marchés
   */
  private async syncMarchees(marchees: MarcheeData[]): Promise<void> {
    const database = await db;
    
    for (const marchee of marchees) {
      await database.runAsync(
        `INSERT OR REPLACE INTO marchees (id, nom, adresse, description, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [marchee.id, marchee.nom, marchee.adresse || null, marchee.description || null, new Date().toISOString()]
      );
    }
  }

  /**
   * Synchronise les zones
   */
  private async syncZones(zones: ZoneData[]): Promise<void> {
    const database = await db;
    
    for (const zone of zones) {
      await database.runAsync(
        `INSERT OR REPLACE INTO zones (id, nom, marchee_id, marchee_name, description, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [zone.id, zone.nom, zone.marcheeId, zone.marcheeName || null, zone.description || null, new Date().toISOString()]
      );
    }
  }

  /**
   * Synchronise les halls
   */
  private async syncHalls(halls: HallData[]): Promise<void> {
    const database = await db;
    
    for (const hall of halls) {
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
  }

  /**
   * Synchronise les places
   */
  private async syncPlaces(places: PlaceData[]): Promise<void> {
    const database = await db;
    
    for (const place of places) {
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
  }

  /**
   * Synchronise les marchands
   */
  private async syncMarchands(marchands: MarchandData[]): Promise<void> {
    const database = await db;
    
    for (const marchand of marchands) {
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
  }

  /**
   * Synchronise les sessions
   */
  private async syncSessions(sessions: SessionData[]): Promise<void> {
    const database = await db;
    
    for (const session of sessions) {
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
  }

  /**
   * Synchronise les paiements
   */
  private async syncPaiements(paiements: PaiementData[]): Promise<void> {
    const database = await db;
    
    for (const paiement of paiements) {
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
  }

  /**
   * Synchronise les quittances
   */
  private async syncQuittances(quittances: QuittanceData[]): Promise<void> {
    const database = await db;
    
    for (const quittance of quittances) {
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
  }

  /**
   * Met à jour les métadonnées de synchronisation
   */
  private async updateSyncMetadata(timestamp: string, status: 'success' | 'error', errorMessage?: string): Promise<void> {
    const database = await db;
    
    await database.runAsync(
      `UPDATE sync_metadata 
       SET last_sync_timestamp = ?, sync_status = ?, error_message = ?
       WHERE id = 1`,
      [timestamp, status, errorMessage || null]
    );
  }

  /**
   * Fonction principale de synchronisation
   */
  public async performSync(): Promise<{ success: boolean; message: string; timestamp?: string }> {
    try {
      console.log('🔄 Début de la synchronisation...');
      
      // 1. Récupérer les données du backend
      const syncData = await this.fetchSyncData();
      console.log('✅ Données récupérées depuis le backend');

      // 2. Synchroniser dans l'ordre (respect des foreign keys)
      await this.syncUser(syncData.user);
      console.log('✅ Utilisateur synchronisé');

      await this.syncMarchees(syncData.marchees);
      console.log(`✅ ${syncData.marchees.length} marchés synchronisés`);

      await this.syncZones(syncData.zones);
      console.log(`✅ ${syncData.zones.length} zones synchronisées`);

      await this.syncHalls(syncData.halls);
      console.log(`✅ ${syncData.halls.length} halls synchronisés`);

      await this.syncMarchands(syncData.marchands);
      console.log(`✅ ${syncData.marchands.length} marchands synchronisés`);

      await this.syncPlaces(syncData.places);
      console.log(`✅ ${syncData.places.length} places synchronisées`);

      await this.syncSessions(syncData.sessions);
      console.log(`✅ ${syncData.sessions.length} sessions synchronisées`);

      await this.syncPaiements(syncData.paiements);
      console.log(`✅ ${syncData.paiements.length} paiements synchronisés`);

      await this.syncQuittances(syncData.quittances);
      console.log(`✅ ${syncData.quittances.length} quittances synchronisées`);

      // 3. Mettre à jour les métadonnées
      await this.updateSyncMetadata(syncData.syncTimestamp, 'success');
      
      // 4. Sauvegarder le timestamp dans AsyncStorage
      await AsyncStorage.setItem('last_sync_timestamp', syncData.syncTimestamp);

      console.log('✅ Synchronisation terminée avec succès');
      
      return {
        success: true,
        message: 'Synchronisation réussie',
        timestamp: syncData.syncTimestamp
      };
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      
      await this.updateSyncMetadata(
        new Date().toISOString(),
        'error',
        error instanceof Error ? error.message : 'Erreur inconnue'
      );

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur de synchronisation'
      };
    }
  }

  /**
   * Récupère le dernier timestamp de synchronisation
   */
  public async getLastSyncTimestamp(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('last_sync_timestamp');
    } catch (error) {
      console.error('Erreur lors de la récupération du timestamp:', error);
      return null;
    }
  }

  /**
   * Vérifie si une synchronisation est nécessaire
   */
  public async needsSync(maxAgeHours: number = 24): Promise<boolean> {
    const lastSync = await this.getLastSyncTimestamp();
    
    if (!lastSync) return true;
    
    const lastSyncDate = new Date(lastSync);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff >= maxAgeHours;
  }
}

// Export d'une instance singleton
export const syncService = new SyncService();