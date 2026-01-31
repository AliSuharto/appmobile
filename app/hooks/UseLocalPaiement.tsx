import { Alert } from "react-native";
import { paiementService } from "../core/services/paiementlocaService";

/**
 * Interface pour les données de paiement reçues de l'API
 */
export interface ApiPaiementResponse {
  id: number;
  montant: number;
  datePaiement?: string;
  typePaiement: string;
  motif?: string;
  nomMarchands?: string;
  idMarchand?: number;
  idPlace?: number;
  sessionId: number;
  idAgent: number;
  quittanceId: number;
}

/**
 * Options pour la création de paiement local
 */
export interface CreateLocalPaiementOptions {
  showSuccessAlert?: boolean;
  showErrorAlert?: boolean;
  onSuccess?: (paiement: any) => void;
  onError?: (error: string) => void;
}

/**
 * Hook pour créer un paiement local à partir des données de l'API
 */
export const useLocalPaiement = () => {
  /**
   * Créer un paiement local à partir de la réponse API
   */
  const createLocalPaiement = async (
    apiResponse: ApiPaiementResponse,
    options: CreateLocalPaiementOptions = {},
  ): Promise<boolean> => {
    const {
      showSuccessAlert = true,
      showErrorAlert = true,
      onSuccess,
      onError,
    } = options;

    try {
      console.log(
        "📝 Création du paiement local avec les données:",
        apiResponse,
      );

      // Préparer les données pour l'enregistrement local
      const localPaiementData = {
        id: apiResponse.id,
        montant: apiResponse.montant,
        type_paiement: apiResponse.typePaiement,
        date_paiement: apiResponse.datePaiement,
        motif: apiResponse.motif,
        marchand_id: apiResponse.idMarchand,
        marchandnom: apiResponse.nomMarchands,
        place_id: apiResponse.idPlace,
        session_id: apiResponse.sessionId,
        agent_id: apiResponse.idAgent,
        quittance_id: apiResponse.quittanceId,
      };

      // Utiliser le service de paiement pour enregistrer localement
      const localResult =
        await paiementService.effectuerPaiement(localPaiementData);

      if (localResult.success) {
        console.log("✅ Paiement enregistré localement:", localResult.paiement);

        if (showSuccessAlert) {
          Alert.alert("Succès", "Paiement enregistré localement");
        }

        if (onSuccess) {
          onSuccess(localResult.paiement);
        }

        return true;
      } else {
        console.error("❌ Erreur enregistrement local:", localResult.error);

        if (showErrorAlert) {
          Alert.alert(
            "Erreur locale",
            `Impossible d'enregistrer le paiement localement: ${localResult.error}`,
          );
        }

        if (onError) {
          onError(localResult.error || "Erreur inconnue");
        }

        return false;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      console.error("❌ Exception lors de l'enregistrement local:", error);

      if (showErrorAlert) {
        Alert.alert("Erreur", `Exception: ${errorMessage}`);
      }

      if (onError) {
        onError(errorMessage);
      }

      return false;
    }
  };

  return {
    createLocalPaiement,
  };
};
