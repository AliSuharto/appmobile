import { PaiementLocal, paiementLocalService } from "@/app/core/services/paiementLocalService";
import { BASE_URL_API } from "@/app/utilitaire/api";
import { useState } from "react";
import { Alert } from "react-native";


export interface PaiementPayload {
  idAgent: number;
  idMarchand?: number;
  nomMarchands?: string;
  place_id?: number;
  numeroQuittance: string;
  modePaiement: string;
  sessionId: number;
  typePaiement?: "droit_annuel" | "droit_place";
  motif?: string;
  montant: number;
}

interface ApiPaiementResponse {
  success: boolean;
  message?: string;
  paiement?: {
    id: number;
    montant: number;
    date_paiement: string;
    [key: string]: any;
  };
  id?: number; // Certaines APIs retournent l'ID directement
}

interface UsePaiementReturn {
  submitting: boolean;
  submitPaiement: (payload: PaiementPayload) => Promise<boolean>;
}

export const usePaiement = (): UsePaiementReturn => {
  const [submitting, setSubmitting] = useState(false);

  const submitPaiement = async (payload: PaiementPayload): Promise<boolean> => {
    setSubmitting(true);

    try {
      console.log("📤 Envoi du paiement vers l'API...");

      // 1. ENVOYER VERS L'API D'ABORD
      const response = await fetch(`${BASE_URL_API}/paiements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de l'envoi du paiement",
        );
      }

      const apiResponse: ApiPaiementResponse = await response.json();
      console.log("✅ Paiement enregistré sur l'API:", apiResponse);

      // Récupérer l'ID du paiement depuis la réponse API
      const apiPaiementId = apiResponse.paiement?.id || apiResponse.id;

      if (!apiPaiementId) {
        console.warn("⚠️ ID du paiement non retourné par l'API");
      }

      // 2. SAUVEGARDER LOCALEMENT APRÈS SUCCÈS API
      try {
        const paiementLocal: Omit<
          PaiementLocal,
          "id" | "created_at" | "updated_at"
        > = {
          montant: payload.montant,
          type_paiement: payload.typePaiement,
          date_paiement: new Date().toISOString(),
          motif: payload.motif,
          marchand_id: payload.idMarchand,
          marchand_nom: payload.nomMarchands,
          place_id: payload.place_id,
          session_id: payload.sessionId,
          agent_id: payload.idAgent,
          api_id: apiPaiementId,
          synced: 1, // Marqué comme synchronisé car vient de l'API
        };

        const localId = await paiementLocalService.savePaiement(paiementLocal);
        console.log("✅ Paiement sauvegardé localement avec ID:", localId);

        // Sauvegarder la quittance si applicable
        if (payload.numeroQuittance) {
          await paiementLocalService.saveQuittance({
            creation_date: new Date().toISOString(),
            date_utilisation: new Date().toISOString(),
            nom: payload.numeroQuittance,
            etat: "utilisee",
            paiement_id: localId,
          });
          console.log("✅ Quittance sauvegardée localement");
        }
      } catch (localError) {
        console.error(
          "⚠️ Erreur lors de la sauvegarde locale (paiement déjà sur API):",
          localError,
        );
        // On ne bloque pas l'utilisateur car le paiement est sur l'API
      }

      Alert.alert(
        "✅ Paiement enregistré",
        "Le paiement a été enregistré avec succès",
      );

      return true;
    } catch (error: any) {
      console.error("❌ Erreur lors du paiement:", error);

      // ÉCHEC : Afficher l'erreur sans sauvegarder localement
      Alert.alert(
        "❌ Erreur d'enregistrement",
        error.message ||
          "Impossible d'enregistrer le paiement. Veuillez vérifier votre connexion et réessayer.",
        [
          {
            text: "OK",
            style: "default",
          },
        ],
      );

      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    submitPaiement,
  };
};
