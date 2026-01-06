import { Quittance, QuittanceDetail, quittanceRepository } from '../repositories/quittanceRepository';

export const quittanceService = {
  /**
   * Récupérer toutes les quittances avec filtres
   */
  async getAllQuittances(filters?: {
    etat?: 'DISPONIBLE' | 'UTILISE';
    searchQuery?: string;
  }): Promise<Quittance[]> {
    try {
      return await quittanceRepository.getAll(filters);
    } catch (error) {
      console.error('Erreur lors de la récupération des quittances:', error);
      throw new Error('Impossible de récupérer les quittances');
    }
  },

  /**
   * Récupérer les détails d'une quittance
   */
  async getQuittanceDetails(id: number): Promise<QuittanceDetail | null> {
    try {
      return await quittanceRepository.getById(id);
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de la quittance:', error);
      throw new Error('Impossible de récupérer les détails de la quittance');
    }
  },

  /**
   * Créer une nouvelle quittance
   */
  async createQuittance(quittance: Omit<Quittance, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    try {
      // Validation
      if (!quittance.nom || quittance.nom.trim() === '') {
        throw new Error('Le nom de la quittance est requis');
      }

      if (!['DISPONIBLE', 'UTILISE'].includes(quittance.etat)) {
        throw new Error('État invalide. Doit être DISPONIBLE ou UTILISE');
      }

      return await quittanceRepository.create(quittance);
    } catch (error) {
      console.error('Erreur lors de la création de la quittance:', error);
      throw error;
    }
  },

  /**
   * Marquer une quittance comme utilisée
   */
  async marquerCommeUtilise(quittanceId: number, paiementId: number): Promise<void> {
    try {
      await quittanceRepository.update(quittanceId, {
        etat: 'UTILISE',
        date_utilisation: new Date().toISOString(),
        paiement_id: paiementId,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quittance:', error);
      throw new Error('Impossible de marquer la quittance comme utilisée');
    }
  },

  /**
   * Marquer une quittance comme disponible
   */
  async marquerCommeDisponible(quittanceId: number): Promise<void> {
    try {
      await quittanceRepository.update(quittanceId, {
        etat: 'DISPONIBLE',
        date_utilisation: null,
        paiement_id: null,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quittance:', error);
      throw new Error('Impossible de marquer la quittance comme disponible');
    }
  },

  /**
   * Supprimer une quittance
   */
  async deleteQuittance(id: number): Promise<void> {
    try {
      // Vérifier si la quittance est utilisée
      const quittance = await quittanceRepository.getById(id);
      if (quittance && quittance.etat === 'UTILISE') {
        throw new Error('Impossible de supprimer une quittance utilisée');
      }

      await quittanceRepository.delete(id);
    } catch (error) {
      console.error('Erreur lors de la suppression de la quittance:', error);
      throw error;
    }
  },

  /**
   * Obtenir les statistiques des quittances
   */
  async getStatistiques() {
    try {
      return await quittanceRepository.getStats();
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw new Error('Impossible de récupérer les statistiques');
    }
  },

  /**
   * Formater une date pour l'affichage
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Formater un montant
   */
  formatMontant(montant: number | null): string {
    if (montant === null) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MGA',
    }).format(montant);
  },
};