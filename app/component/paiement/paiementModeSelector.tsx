import { sessionService } from "@/app/core/services/sessionService";
import { useLocalPaiement } from "@/app/hooks/UseLocalPaiement";
import { BASE_URL_API } from "@/app/utilitaire/api";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Marchand } from "./searchMarchand";

interface Props {
  visible: boolean;
  marchand: Marchand | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const PaymentModalSearch = ({
  visible,
  marchand,
  onClose,
  onSuccess,
}: Props) => {
  const [typePaiement, setTypePaiement] = useState<
    "droit_place" | "droit_annuel"
  >("droit_place");
  const [montant, setMontant] = useState("");
  const [motif, setMotif] = useState("");
  const [numeroQuittance, setNumeroQuittance] = useState("");

  const [idAgent, setIdAgent] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Utiliser le hook personnalisé
  const { createLocalPaiement } = useLocalPaiement();

  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible]);

  useEffect(() => {
    if (!marchand) return;

    if (typePaiement === "droit_place") {
      setMontant(marchand.montantPlace || "");
      setMotif(marchand.motifPaiementPlace || "");
    } else {
      setMontant(marchand.montantAnnuel || "");
      setMotif(marchand.motifPaiementAnnuel || "");
    }
  }, [typePaiement, marchand]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const userDataString = await SecureStore.getItemAsync("userData");
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setIdAgent(userData.id);
        console.log("✅ Agent ID chargé:", userData.id);
      }

      const openSession = await sessionService.getOpenSessionWithStats();
      if (!openSession) {
        Alert.alert(
          "Aucune session ouverte",
          "Veuillez ouvrir une session de paiement",
          [{ text: "OK", onPress: onClose }],
        );
        return;
      }

      setSessionId(openSession.id);
      console.log("✅ Session chargée:", openSession.id);
    } catch (error: any) {
      console.error("❌ Erreur chargement initial:", error);
      Alert.alert("Erreur", error.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handlePaiement = async () => {
    // Validation des champs requis
    if (!numeroQuittance.trim()) {
      Alert.alert("Erreur", "Numéro de quittance requis");
      return;
    }

    if (!montant || parseFloat(montant) <= 0) {
      Alert.alert("Erreur", "Montant invalide");
      return;
    }

    if (!sessionId || !idAgent || !marchand?.id) {
      Alert.alert("Erreur", "Données manquantes (session, agent ou marchand)");
      return;
    }

    try {
      setLoading(true);

      // 1. Préparer le payload pour l'API
      const payload = {
        typePaiement,
        numeroQuittance,
        idMarchand: marchand.id,
        sessionId,
        idAgent,
      };

      console.log("📤 Envoi du paiement à l'API:", payload);

      // 2. Envoyer le paiement à l'API
      const response = await fetch(`${BASE_URL_API}/paiements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Échec du paiement sur le serveur",
        );
      }

      const apiData = await response.json();
      console.log("✅ Paiement enregistré sur l'API:", apiData);

      // 3. Synchroniser localement avec le hook
      const localSuccess = await createLocalPaiement(apiData, {
        showSuccessAlert: false, // On affichera notre propre message personnalisé
        showErrorAlert: false,
        onSuccess: (paiement) => {
          console.log("✅ Paiement synchronisé localement:", paiement);
        },
        onError: (error) => {
          console.warn("⚠️ Erreur synchronisation locale:", error);
        },
      });

      // 4. Afficher le résultat approprié
      if (localSuccess) {
        Alert.alert(
          "Succès",
          `Paiement effectué avec succès\n\n` +
            `Marchand: ${marchand.nom}\n` +
            `Type: ${typePaiement === "droit_place" ? "Droit de place" : "Droit annuel"}\n` +
            `Montant: ${montant} Ar\n` +
            `Quittance: ${numeroQuittance}`,
          [
            {
              text: "OK",
              onPress: () => {
                // Réinitialiser le formulaire
                setNumeroQuittance("");
                setTypePaiement("droit_place");

                // Callback de succès
                if (onSuccess) {
                  onSuccess();
                }

                onClose();
              },
            },
          ],
        );
      } else {
        Alert.alert(
          "Avertissement",
          `Paiement enregistré sur le serveur avec succès, mais erreur lors de la synchronisation locale.\n\n` +
            `Les données seront synchronisées lors de la prochaine connexion.\n\n` +
            `Quittance: ${numeroQuittance}\n` +
            `Montant: ${montant} Ar`,
          [
            {
              text: "OK",
              onPress: () => {
                setNumeroQuittance("");
                setTypePaiement("droit_place");

                if (onSuccess) {
                  onSuccess();
                }

                onClose();
              },
            },
          ],
        );
      }
    } catch (error: any) {
      console.error("❌ Erreur lors du paiement:", error);
      Alert.alert("Erreur", error.message || "Erreur lors du paiement");
    } finally {
      setLoading(false);
    }
  };

  if (!marchand) return null;

  return (
    <KeyboardAvoidingView>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {/* ❌ Bouton X */}
            <TouchableOpacity
              style={styles.closeIcon}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Effectuer un paiement</Text>

            {/* Informations du marchand */}
            <View style={styles.infoContainer}>
              <InfoRow label="Nom" value={marchand.nom} />
              <InfoRow label="Activité" value={marchand.activite} />
              <InfoRow label="Place" value={marchand.place} />
              <InfoRow label="CIN" value={marchand.cin} />
              <InfoRow label="Fréquence" value={marchand.frequencePaiement} />
            </View>

            {/* Sélection du type de paiement */}
            <Text style={styles.sectionTitle}>Type de paiement</Text>
            <View style={styles.radioContainer}>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setTypePaiement("droit_place")}
                disabled={loading}
              >
                <Text style={styles.radioText}>
                  {typePaiement === "droit_place" ? "🔘" : "⚪"} Droit de place
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setTypePaiement("droit_annuel")}
                disabled={loading}
              >
                <Text style={styles.radioText}>
                  {typePaiement === "droit_annuel" ? "🔘" : "⚪"} Droit annuel
                </Text>
              </TouchableOpacity>
            </View>

            {/* Montant */}
            <Text style={styles.label}>Montant</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={montant}
              editable={false}
            />

            {/* Motif */}
            <Text style={styles.label}>Motif</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={motif}
              editable={false}
            />

            {/* Numéro de quittance */}
            <Text style={styles.label}>Numéro de quittance *</Text>
            <TextInput
              style={styles.input}
              value={numeroQuittance}
              onChangeText={setNumeroQuittance}
              placeholder="Entrer le numéro de quittance"
              editable={!loading}
            />

            {/* Bouton de validation */}
            <TouchableOpacity
              style={[styles.payButton, loading && styles.payButtonDisabled]}
              onPress={handlePaiement}
              disabled={loading}
            >
              <Text style={styles.payButtonText}>
                {loading ? "Traitement en cours..." : "Valider le paiement"}
              </Text>
            </TouchableOpacity>

            {/* Bouton Annuler */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// Composant pour afficher une ligne d'information
const InfoRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value || "N/A"}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    position: "relative",
    maxHeight: "90%",
  },
  closeIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 5,
  },
  closeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#666",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
    paddingRight: 30,
  },
  infoContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  infoLabel: {
    fontWeight: "600",
    width: 80,
    color: "#555",
  },
  infoValue: {
    flex: 1,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  radioContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 15,
    paddingVertical: 10,
  },
  radioButton: {
    flex: 1,
    alignItems: "center",
    padding: 8,
  },
  radioText: {
    fontSize: 14,
    color: "#333",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 5,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputDisabled: {
    backgroundColor: "#f0f0f0",
    color: "#666",
  },
  payButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  payButtonDisabled: {
    backgroundColor: "#6c757d",
    opacity: 0.6,
  },
  payButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    padding: 12,
    alignItems: "center",
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#dc3545",
    fontSize: 16,
  },
});

export default PaymentModalSearch;
