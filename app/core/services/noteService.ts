import { Alert } from "react-native";
import { Note, noteRepository } from "../repositories/noteRepository";

export const noteService = {
  /**
   * Récupérer toutes les notes
   */
  async getAllNotes(searchQuery?: string): Promise<Note[]> {
    try {
      return await noteRepository.getAll(searchQuery);
    } catch (error) {
      console.error("Erreur lors de la récupération des notes:", error);
      Alert.alert("Erreur", "Impossible de récupérer les notes");
      return [];
    }
  },

  /**
   * Récupérer une note par ID
   */
  async getNoteById(id: number): Promise<Note | null> {
    try {
      return await noteRepository.getById(id);
    } catch (error) {
      console.error("Erreur lors de la récupération de la note:", error);
      Alert.alert("Erreur", "Impossible de récupérer la note");
      return null;
    }
  },

  /**
   * Créer une nouvelle note
   */
  async createNote(title: string, content: string): Promise<number | null> {
    try {
      if (!title.trim()) {
        Alert.alert("Attention", "Le titre est obligatoire");
        return null;
      }

      const noteId = await noteRepository.create({
        title: title.trim(),
        content: content.trim() || null,
      });

      return noteId;
    } catch (error) {
      console.error("Erreur lors de la création de la note:", error);
      Alert.alert("Erreur", "Impossible de créer la note");
      return null;
    }
  },

  /**
   * Mettre à jour une note
   */
  async updateNote(
    id: number,
    updates: { title?: string; content?: string },
  ): Promise<boolean> {
    try {
      if (updates.title !== undefined && !updates.title.trim()) {
        Alert.alert("Attention", "Le titre ne peut pas être vide");
        return false;
      }

      const cleanUpdates: any = {};
      if (updates.title !== undefined) {
        cleanUpdates.title = updates.title.trim();
      }
      if (updates.content !== undefined) {
        cleanUpdates.content = updates.content.trim() || null;
      }

      await noteRepository.update(id, cleanUpdates);
      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la note:", error);
      Alert.alert("Erreur", "Impossible de mettre à jour la note");
      return false;
    }
  },

  /**
   * Supprimer une note
   */
  async deleteNote(id: number): Promise<boolean> {
    try {
      await noteRepository.delete(id);
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression de la note:", error);
      Alert.alert("Erreur", "Impossible de supprimer la note");
      return false;
    }
  },

  /**
   * Supprimer avec confirmation
   */
  async deleteNoteWithConfirmation(id: number): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        "Confirmer la suppression",
        "Êtes-vous sûr de vouloir supprimer cette note ?",
        [
          {
            text: "Annuler",
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: async () => {
              const success = await this.deleteNote(id);
              resolve(success);
            },
          },
        ],
      );
    });
  },

  /**
   * Obtenir les statistiques
   */
  async getStats() {
    try {
      return await noteRepository.getStats();
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      return { total: 0 };
    }
  },
};
