import { MarchandsService } from "@/app/core/services/marchandService";
import { sessionService } from "@/app/core/services/sessionService";
import { useLocalPaiement } from "@/app/hooks/UseLocalPaiement";
import { BASE_URL_API } from "@/app/utilitaire/api";
import { MaterialIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ReceiptActionsModal from "./receiptActionModal";

interface Props {
  visible: boolean;
  cin: string;
  onClose: () => void;
  onSuccess?: () => void;
}

interface MarchandData {
  id: number;
  nom: string;
  cin: string;
  activite: string;
  place?: string;
  frequencePaiement?: string;
  montantPlace?: string;
  montantAnnuel?: string;
  motifPaiementPlace?: string;
  motifPaiementAnnuel?: string;
}

const PaymentModalQR = ({ visible, cin, onClose, onSuccess }: Props) => {
  const [typePaiement, setTypePaiement] = useState<
    "droit_place" | "droit_annuel"
  >("droit_place");
  const [montant, setMontant] = useState("");
  const [motif, setMotif] = useState("");
  const [numeroQuittance, setNumeroQuittance] = useState("");

  const [marchand, setMarchand] = useState<MarchandData | null>(null);
  const [idAgent, setIdAgent] = useState<number | null>(null);
  const [agentName, setAgentName] = useState<string>("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMarchand, setLoadingMarchand] = useState(false);

  // État pour le modal d'actions de reçu
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [completedPayment, setCompletedPayment] = useState<any>(null);

  const marchandsService = new MarchandsService();
  const { createLocalPaiement } = useLocalPaiement();

  useEffect(() => {
    if (visible && cin) {
      loadMarchandData();
      loadInitialData();
    }
  }, [visible, cin]);

  useEffect(() => {
    if (!marchand) return;

    if (typePaiement === "droit_place") {
      setMontant(marchand.montantPlace || "");
      setMotif(marchand.motifPaiementPlace || "Paiement droit de place");
    } else {
      setMontant(marchand.montantAnnuel || "");
      setMotif(marchand.motifPaiementAnnuel || "Paiement droit annuel");
    }
  }, [typePaiement, marchand]);

  const loadMarchandData = async () => {
    try {
      setLoadingMarchand(true);

      // Récupération du marchand par CIN depuis l'API externe
      const response = await fetch(
        `${BASE_URL_API}/public/marchands/cin/${cin}`,
      );

      if (!response.ok) {
        throw new Error("Marchand introuvable");
      }

      const data = await response.json();
      setMarchand(data);
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error.message || "Impossible de récupérer les données du marchand",
      );
      onClose();
    } finally {
      setLoadingMarchand(false);
    }
  };

  const loadInitialData = async () => {
    try {
      const userDataString = await SecureStore.getItemAsync("userData");
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setIdAgent(userData.id);
        setAgentName(userData.nom || userData.name || "Agent");
        console.log("✅ Agent ID chargé:", userData.id);
        console.log("✅ Agent Name chargé:", userData.nom || userData.name);
      }

      const openSession = await sessionService.getOpenSessionWithStats();
      if (!openSession) {
        Alert.alert(
          "Aucune session ouverte",
          "Veuillez ouvrir une session de paiement",
        );
        onClose();
        return;
      }

      setSessionId(openSession.id);
      console.log("✅ Session chargée:", openSession.id);
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    }
  };

  const handlePaiement = async () => {
    if (!numeroQuittance.trim()) {
      Alert.alert("Erreur", "Numéro de quittance requis");
      return;
    }

    if (!marchand) {
      Alert.alert("Erreur", "Données du marchand non disponibles");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        typePaiement,
        numeroQuittance,
        idMarchand: marchand.id,
        sessionId,
        idAgent,
      };

      console.log("📤 Envoi du paiement à l'API:", payload);

      // 1. Envoyer le paiement à l'API
      const response = await fetch(`${BASE_URL_API}/paiements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Échec du paiement");
      }

      // 2. Récupérer la réponse de l'API
      const apiData = await response.json();
      console.log("✅ Paiement créé sur l'API:", apiData);

      // 3. Enregistrer le paiement localement avec le hook
      const localSuccess = await createLocalPaiement(apiData, {
        showSuccessAlert: false, // On affiche notre propre message de succès
        showErrorAlert: false,
        onSuccess: (localPaiement) => {
          console.log("✅ Paiement local créé:", localPaiement);
        },
        onError: (error) => {
          console.error("❌ Erreur paiement local:", error);
        },
      });

      // 4. Préparer les données du paiement pour le reçu
      const paymentData = {
        ...apiData,
        agentName: agentName,
        nomMarchands: marchand.nom,
        motif: motif,
        montant: parseFloat(montant),
        createdAt: apiData.createdAt || new Date().toISOString(),
        numeroQuittance: apiData.recuNumero || numeroQuittance,
      };

      // 5. Stocker le paiement complété
      setCompletedPayment(paymentData);

      // 6. Afficher le résultat avec option d'ouvrir le modal de reçu
      if (localSuccess) {
        Alert.alert(
          "Succès",
          `Paiement effectué avec succès\n\n` +
            `Marchand: ${marchand.nom}\n` +
            `Type: ${typePaiement === "droit_place" ? "Droit de place" : "Droit annuel"}\n` +
            `Montant: ${montant} FCFA\n` +
            `Quittance: ${numeroQuittance}`,
          [
            {
              text: "Générer le reçu",
              onPress: () => {
                // Réinitialiser le formulaire
                setNumeroQuittance("");
                setTypePaiement("droit_place");

                // Fermer le modal de paiement
                onClose();

                // Callback de succès
                if (onSuccess) {
                  onSuccess();
                }

                // Ouvrir le modal d'actions de reçu
                setReceiptModalVisible(true);
              },
            },
            {
              text: "Plus tard",
              style: "cancel",
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
        // Paiement API ok mais local échoué
        Alert.alert(
          "Avertissement",
          "Paiement effectué sur le serveur mais erreur d'enregistrement local.\n\n" +
            `Les données seront synchronisées lors de la prochaine connexion.\n\n` +
            `Quittance: ${numeroQuittance}\n` +
            `Montant: ${montant} FCFA`,
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

  const handleClose = () => {
    setNumeroQuittance("");
    setMarchand(null);
    onClose();
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Effectuer un paiement</Text>
              <TouchableOpacity style={styles.closeIcon} onPress={handleClose}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {loadingMarchand ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>
                  Chargement des données...
                </Text>
              </View>
            ) : marchand ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Infos Marchand */}
                <View style={styles.marchandCard}>
                  <View style={styles.marchandHeader}>
                    <MaterialIcons name="person" size={24} color="#2563eb" />
                    <Text style={styles.marchandName}>{marchand.nom}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>CIN:</Text>
                    <Text style={styles.infoValue}>{marchand.cin}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Activité:</Text>
                    <Text style={styles.infoValue}>{marchand.activite}</Text>
                  </View>

                  {marchand.place && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Place:</Text>
                      <Text style={styles.infoValue}>{marchand.place}</Text>
                    </View>
                  )}

                  {marchand.frequencePaiement && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Fréquence:</Text>
                      <Text style={styles.infoValue}>
                        {marchand.frequencePaiement}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Type de paiement */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Type de paiement</Text>
                  <View style={styles.radioContainer}>
                    <TouchableOpacity
                      style={[
                        styles.radioOption,
                        typePaiement === "droit_place" &&
                          styles.radioOptionActive,
                      ]}
                      onPress={() => setTypePaiement("droit_place")}
                    >
                      <View style={styles.radioCircle}>
                        {typePaiement === "droit_place" && (
                          <View style={styles.radioCircleInner} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.radioText,
                          typePaiement === "droit_place" &&
                            styles.radioTextActive,
                        ]}
                      >
                        Droit de place
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.radioOption,
                        typePaiement === "droit_annuel" &&
                          styles.radioOptionActive,
                      ]}
                      onPress={() => setTypePaiement("droit_annuel")}
                    >
                      <View style={styles.radioCircle}>
                        {typePaiement === "droit_annuel" && (
                          <View style={styles.radioCircleInner} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.radioText,
                          typePaiement === "droit_annuel" &&
                            styles.radioTextActive,
                        ]}
                      >
                        Droit annuel
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Montant */}
                <View style={styles.section}>
                  <Text style={styles.label}>Montant</Text>
                  <View style={styles.inputDisabled}>
                    <Text style={styles.inputDisabledText}>{montant} FCFA</Text>
                  </View>
                </View>

                {/* Motif */}
                <View style={styles.section}>
                  <Text style={styles.label}>Motif</Text>
                  <View style={styles.inputDisabled}>
                    <Text style={styles.inputDisabledText}>{motif}</Text>
                  </View>
                </View>

                {/* Numéro de quittance */}
                <View style={styles.section}>
                  <Text style={styles.label}>Numéro de quittance *</Text>
                  <TextInput
                    style={styles.input}
                    value={numeroQuittance}
                    onChangeText={setNumeroQuittance}
                    placeholder="Entrer le numéro de quittance"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                {/* Boutons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={handlePaiement}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons
                          name="check-circle"
                          size={20}
                          color="#fff"
                        />
                        <Text style={styles.payButtonText}>
                          Valider le paiement
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleClose}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#ef4444" />
                <Text style={styles.errorText}>
                  Impossible de charger les données
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal d'actions de reçu */}
      <ReceiptActionsModal
        visible={receiptModalVisible}
        onClose={() => setReceiptModalVisible(false)}
        payment={completedPayment}
        agentName={agentName}
        companyName="CUDS"
        companyAddress="Antsiranana"
        companyPhone="+261 XX XX XXX XX"
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  closeIcon: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
  errorContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "600",
  },
  marchandCard: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  marchandHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  marchandName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 12,
  },
  radioContainer: {
    flexDirection: "row",
    gap: 12,
  },
  radioOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  radioOptionActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563eb",
  },
  radioText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  radioTextActive: {
    color: "#2563eb",
    fontWeight: "600",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#fff",
  },
  inputDisabled: {
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  inputDisabledText: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
  },
  buttonContainer: {
    marginTop: 10,
  },
  payButton: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default PaymentModalQR;
