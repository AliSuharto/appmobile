import { User, userRepository, UserStats } from '../repositories/userRepository';

export const userService = {
  /**
   * Récupérer tous les utilisateurs
   */
  async getAllUsers(): Promise<User[]> {
    try {
      return await userRepository.getAll();
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw new Error('Impossible de récupérer les utilisateurs');
    }
  },

  /**
   * Récupérer un utilisateur par ID
   */
  async getUserById(id: number): Promise<User | null> {
    try {
      return await userRepository.getById(id);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw new Error('Impossible de récupérer l\'utilisateur');
    }
  },

  /**
   * Récupérer un utilisateur par email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await userRepository.getByEmail(email);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw new Error('Impossible de récupérer l\'utilisateur');
    }
  },

  /**
   * Créer un nouvel utilisateur
   */
  async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    try {
      // Validation
      if (!user.nom || user.nom.trim() === '') {
        throw new Error('Le nom est requis');
      }
      if (!user.prenom || user.prenom.trim() === '') {
        throw new Error('Le prénom est requis');
      }
      if (!user.email || !this.isValidEmail(user.email)) {
        throw new Error('Email invalide');
      }
      if (!user.role || user.role.trim() === '') {
        throw new Error('Le rôle est requis');
      }

      // Vérifier si l'email existe déjà
      const existingUser = await userRepository.getByEmail(user.email);
      if (existingUser) {
        throw new Error('Cet email est déjà utilisé');
      }

      return await userRepository.create(user);
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(id: number, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<void> {
    try {
      // Validation de l'email si fourni
      if (updates.email && !this.isValidEmail(updates.email)) {
        throw new Error('Email invalide');
      }

      // Vérifier si l'email existe déjà (sauf pour l'utilisateur actuel)
      if (updates.email) {
        const existingUser = await userRepository.getByEmail(updates.email);
        if (existingUser && existingUser.id !== id) {
          throw new Error('Cet email est déjà utilisé');
        }
      }

      await userRepository.update(id, updates);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  },

  /**
   * Supprimer un utilisateur
   */
  async deleteUser(id: number): Promise<void> {
    try {
      await userRepository.delete(id);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw new Error('Impossible de supprimer l\'utilisateur');
    }
  },

  /**
   * Récupérer les statistiques d'un utilisateur
   */
  async getUserStatistics(userId: number): Promise<UserStats> {
    try {
      return await userRepository.getUserStats(userId);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw new Error('Impossible de récupérer les statistiques');
    }
  },

  /**
   * Récupérer les derniers paiements d'un agent
   */
  async getRecentPaiements(userId: number, limit: number = 5) {
    try {
      return await userRepository.getRecentPaiements(userId, limit);
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements récents:', error);
      throw new Error('Impossible de récupérer les paiements récents');
    }
  },

  /**
   * Obtenir les statistiques par rôle
   */
  async getRoleStatistics() {
    try {
      return await userRepository.countByRole();
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques par rôle:', error);
      throw new Error('Impossible de récupérer les statistiques');
    }
  },

  /**
   * Valider un email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Formater une date
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
   * Formater une date courte
   */
  formatDateShort(dateString: string | null): string {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  /**
   * Formater un montant
   */
  formatMontant(montant: number | null): string {
    if (montant === null || montant === undefined) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0,
    }).format(montant);
  },

  /**
   * Obtenir la couleur selon le rôle
   */
  getRoleColor(role: string): string {
    const roleColors: { [key: string]: string } = {
      'admin': '#FF6B6B',
      'regisseur': '#4ECDC4',
      'agent': '#45B7D1',
      'superviseur': '#FFA07A',
    };
    return roleColors[role.toLowerCase()] || '#95A5A6';
  },

  /**
   * Obtenir le nom complet d'un utilisateur
   */
  getFullName(user: User): string {
    return `${user.prenom} ${user.nom}`;
  },

  /**
   * Obtenir les initiales d'un utilisateur
   */
  getInitials(user: User): string {
    return `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
  },
};