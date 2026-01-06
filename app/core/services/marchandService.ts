import { db } from "../database/sqlite";

export interface Marchand {
  id: number;
  nom: string;
  prenom: string | null;
  telephone: string | null;
  cin: string | null;
  nif: string | null;
  stat: string | null;
  type_activite: string | null;
  statut_de_paiement: string | null;
  etat: string | null;
  date_inscription: string | null;
  // Données calculées
  total_paiements?: number;
  dernier_paiement?: string | null;
  nombre_places?: number;
}

export interface Paiement {
  id: number;
  montant: number;
  type_paiement: string | null;
  date_paiement: string;
  motif: string | null;
  place_id: number | null;
  session_id: number;
  date_debut: string | null;
  date_fin: string | null;
  // Jointures
  place_nom?: string;
  session_nom?: string;
  quittance_nom?: string;
}

export interface Place {
  id: number;
  nom: string;
  statut: string;
  date_debut_occupation: string | null;
  droit_annuel: number | null;
  categorie: number | null;
  hall_nom?: string;
  zone_nom?: string;
  marchee_nom?: string;
}

export interface MarchandStats {
  total_paiements: number;
  montant_total: number;
  nombre_paiements: number;
  nombre_places: number;
  dernier_paiement: string | null;
}

export class MarchandsService {
  
  /**
   * Récupère tous les marchands avec statistiques
   */
  async getAllMarchands(): Promise<Marchand[]> {
    const database = await db;
    
    const marchands = await database.getAllAsync<Marchand>(`
      SELECT 
        m.*,
        COUNT(DISTINCT p.id) as nombre_places,
        SUM(DISTINCT pay.montant) as total_paiements,
        MAX(pay.date_paiement) as dernier_paiement
      FROM marchands m
      LEFT JOIN places p ON p.marchand_id = m.id
      LEFT JOIN paiements pay ON pay.marchand_id = m.id
      GROUP BY m.id
      ORDER BY m.nom, m.prenom
    `);
    
    return marchands;
  }

  /**
   * Recherche des marchands par nom, prénom, CIN ou téléphone
   */
  async searchMarchands(query: string): Promise<Marchand[]> {
    const database = await db;
    const searchTerm = `%${query}%`;
    
    const marchands = await database.getAllAsync<Marchand>(`
      SELECT 
        m.*,
        COUNT(DISTINCT p.id) as nombre_places,
        SUM(DISTINCT pay.montant) as total_paiements,
        MAX(pay.date_paiement) as dernier_paiement
      FROM marchands m
      LEFT JOIN places p ON p.marchand_id = m.id
      LEFT JOIN paiements pay ON pay.marchand_id = m.id
      WHERE 
        m.nom LIKE ? OR 
        m.prenom LIKE ? OR 
        m.cin LIKE ? OR 
        m.telephone LIKE ?
      GROUP BY m.id
      ORDER BY m.nom, m.prenom
    `, [searchTerm, searchTerm, searchTerm, searchTerm]);
    
    return marchands;
  }

  /**
   * Filtre les marchands par statut de paiement
   */
  async filterByStatutPaiement(statut?: string): Promise<Marchand[]> {
    const database = await db;
    
    let query = `
      SELECT 
        m.*,
        COUNT(DISTINCT p.id) as nombre_places,
        SUM(DISTINCT pay.montant) as total_paiements,
        MAX(pay.date_paiement) as dernier_paiement
      FROM marchands m
      LEFT JOIN places p ON p.marchand_id = m.id
      LEFT JOIN paiements pay ON pay.marchand_id = m.id
    `;
    
    const params: any[] = [];
    
    if (statut) {
      query += ` WHERE m.statut_de_paiement = ?`;
      params.push(statut);
    }
    
    query += ` GROUP BY m.id ORDER BY m.nom, m.prenom`;
    
    return await database.getAllAsync<Marchand>(query, params);
  }

  /**
   * Filtre les marchands par état
   */
  async filterByEtat(etat?: string): Promise<Marchand[]> {
    const database = await db;
    
    let query = `
      SELECT 
        m.*,
        COUNT(DISTINCT p.id) as nombre_places,
        SUM(DISTINCT pay.montant) as total_paiements,
        MAX(pay.date_paiement) as dernier_paiement
      FROM marchands m
      LEFT JOIN places p ON p.marchand_id = m.id
      LEFT JOIN paiements pay ON pay.marchand_id = m.id
    `;
    
    const params: any[] = [];
    
    if (etat) {
      query += ` WHERE m.etat = ?`;
      params.push(etat);
    }
    
    query += ` GROUP BY m.id ORDER BY m.nom, m.prenom`;
    
    return await database.getAllAsync<Marchand>(query, params);
  }

  /**
   * Récupère un marchand par ID avec toutes ses infos
   */
  async getMarchandById(id: number): Promise<Marchand | null> {
    const database = await db;
    
    const marchand = await database.getFirstAsync<Marchand>(`
      SELECT 
        m.*,
        COUNT(DISTINCT p.id) as nombre_places,
        SUM(DISTINCT pay.montant) as total_paiements,
        MAX(pay.date_paiement) as dernier_paiement
      FROM marchands m
      LEFT JOIN places p ON p.marchand_id = m.id
      LEFT JOIN paiements pay ON pay.marchand_id = m.id
      WHERE m.id = ?
      GROUP BY m.id
    `, [id]);
    
    return marchand || null;
  }

  /**
   * Récupère les statistiques d'un marchand
   */
  async getMarchandStats(marchandId: number): Promise<MarchandStats> {
    const database = await db;
    
    const stats = await database.getFirstAsync<MarchandStats>(`
      SELECT 
        COALESCE(SUM(pay.montant), 0) as montant_total,
        COUNT(pay.id) as nombre_paiements,
        COUNT(DISTINCT p.id) as nombre_places,
        MAX(pay.date_paiement) as dernier_paiement
      FROM marchands m
      LEFT JOIN paiements pay ON pay.marchand_id = m.id
      LEFT JOIN places p ON p.marchand_id = m.id
      WHERE m.id = ?
    `, [marchandId]);
    
    return stats || {
      total_paiements: 0,
      montant_total: 0,
      nombre_paiements: 0,
      nombre_places: 0,
      dernier_paiement: null
    };
  }

  /**
   * Récupère tous les paiements d'un marchand
   */
  async getPaiementsByMarchand(marchandId: number): Promise<Paiement[]> {
    const database = await db;
    
    const paiements = await database.getAllAsync<Paiement>(`
      SELECT 
        pay.*,
        p.nom as place_nom,
        s.nom as session_nom,
        q.nom as quittance_nom
      FROM paiements pay
      LEFT JOIN places p ON p.id = pay.place_id
      LEFT JOIN sessions s ON s.id = pay.session_id
      LEFT JOIN quittances q ON q.paiement_id = pay.id
      WHERE pay.marchand_id = ?
      ORDER BY pay.date_paiement DESC
    `, [marchandId]);
    
    return paiements;
  }

  /**
   * Récupère toutes les places d'un marchand
   */
  async getPlacesByMarchand(marchandId: number): Promise<Place[]> {
    const database = await db;
    
    const places = await database.getAllAsync<Place>(`
      SELECT 
        p.*,
        h.nom as hall_nom,
        z.nom as zone_nom,
        m.nom as marchee_nom
      FROM places p
      LEFT JOIN halls h ON h.id = p.hall_id
      LEFT JOIN zones z ON z.id = p.zone_id
      LEFT JOIN marchees m ON m.id = p.marchee_id
      WHERE p.marchand_id = ?
      ORDER BY p.nom
    `, [marchandId]);
    
    return places;
  }

  /**
   * Récupère les valeurs distinctes pour les filtres
   */
  async getFilterOptions(): Promise<{
    statuts_paiement: string[];
    etats: string[];
    types_activite: string[];
  }> {
    const database = await db;
    
    const statutsPaiement = await database.getAllAsync<{ statut_de_paiement: string }>(`
      SELECT DISTINCT statut_de_paiement 
      FROM marchands 
      WHERE statut_de_paiement IS NOT NULL
      ORDER BY statut_de_paiement
    `);
    
    const etats = await database.getAllAsync<{ etat: string }>(`
      SELECT DISTINCT etat 
      FROM marchands 
      WHERE etat IS NOT NULL
      ORDER BY etat
    `);
    
    const typesActivite = await database.getAllAsync<{ type_activite: string }>(`
      SELECT DISTINCT type_activite 
      FROM marchands 
      WHERE type_activite IS NOT NULL
      ORDER BY type_activite
    `);
    
    return {
      statuts_paiement: statutsPaiement.map(s => s.statut_de_paiement),
      etats: etats.map(e => e.etat),
      types_activite: typesActivite.map(t => t.type_activite)
    };
  }

  /**
   * Compte le nombre de marchands par statut
   */
  async countByStatut(): Promise<Record<string, number>> {
    const database = await db;
    
    const counts = await database.getAllAsync<{ statut_de_paiement: string; count: number }>(`
      SELECT 
        COALESCE(statut_de_paiement, 'Non défini') as statut_de_paiement,
        COUNT(*) as count
      FROM marchands
      GROUP BY statut_de_paiement
    `);
    
    const result: Record<string, number> = {};
    counts.forEach(c => {
      result[c.statut_de_paiement] = c.count;
    });
    
    return result;
  }
}