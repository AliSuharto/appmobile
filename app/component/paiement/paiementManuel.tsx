import { sessionService } from "@/app/core/services/sessionService";
import { useLocalPaiement } from "@/app/hooks/UseLocalPaiement";
import { BASE_URL_API } from "@/app/utilitaire/api";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ReceiptActionsModal from "./receiptActionModal";

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [idAgent, setIdAgent] = useState<number | null>(null);
  const [agentName, setAgentName] = useState<string>("");
  const [session, setSession] = useState<any>(null);
  const router = useRouter();
  const { createLocalPaiement } = useLocalPaiement();

  // État pour le modal d'actions de reçu
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [completedPayment, setCompletedPayment] = useState<any>(null);

  const [formData, setFormData] = useState({
    nomMarchands: "",
    motif: "",
    montant: "",
    numeroQuittance: "",
  });

  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Charger l'ID de l'agent
      const userDataString = await SecureStore.getItemAsync("userData");
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setIdAgent(userData.id);
        setAgentName(userData.nom || userData.name || "Agent");
        console.log("✅ Agent ID chargé:", userData.id);
        console.log("✅ Agent Name chargé:", userData.nom || userData.name);
      }

      // Charger la session ouverte
      const openSession = await sessionService.getOpenSessionWithStats();

      if (!openSession) {
        Alert.alert(
          "Aucune session ouverte",
          "Veuillez d'abord ouvrir une session de paiement.",
          [{ text: "Retour", onPress: () => router.back() }],
        );
        return;
      }

      setSession(openSession);
      console.log("✅ Session chargée:", openSession.id);
    } catch (error: any) {
      console.error("❌ Erreur lors du chargement:", error);
      Alert.alert(
        "Erreur",
        error.message || "Impossible de charger les données",
        [{ text: "Retour", onPress: () => router.back() }],
      );
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour enregistrer le formulaire
  const handleSubmit = async () => {
    // Validation des champs
    if (!formData.nomMarchands.trim()) {
      Alert.alert("Erreur", "Le nom du marchand est requis.");
      return;
    }

    if (!formData.montant || parseFloat(formData.montant) <= 0) {
      Alert.alert("Erreur", "Le montant doit être supérieur à 0.");
      return;
    }

    if (!formData.numeroQuittance.trim()) {
      Alert.alert("Erreur", "Le numéro de quittance est requis.");
      return;
    }

    if (!idAgent || !session?.id) {
      Alert.alert("Erreur", "Agent ou session introuvable.");
      return;
    }

    const payload = {
      nomMarchands: formData.nomMarchands.trim(),
      motif: formData.motif.trim() || null,
      montant: parseFloat(formData.montant),
      numeroQuittance: formData.numeroQuittance.trim(),
      idAgent,
      sessionId: session.id,
    };

    console.log("📤 Payload envoyé à l'API:", payload);

    try {
      setLoading(true);

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
        throw new Error(
          errorData.message || "Erreur lors de l'enregistrement sur le serveur",
        );
      }

      const apiData = await response.json();
      console.log("✅ Paiement enregistré sur l'API:", apiData);

      // 2. Après succès de l'API, enregistrer localement
      const localSuccess = await createLocalPaiement(apiData, {
        showSuccessAlert: false, // On affichera notre propre message
        showErrorAlert: false,
        onSuccess: () => {
          console.log("✅ Paiement synchronisé localement");
        },
        onError: (error) => {
          console.warn("⚠️ Erreur synchronisation locale:", error);
        },
      });

      // 3. Préparer les données du paiement pour le reçu
      const paymentData = {
        ...apiData,
        agentName: agentName,
        createdAt: apiData.createdAt || new Date().toISOString(),
      };

      // 4. Stocker le paiement complété
      setCompletedPayment(paymentData);

      // 5. Afficher le résultat avec option d'ouvrir le modal de reçu
      if (localSuccess) {
        Alert.alert("Succès", "Paiement enregistré avec succès!", [
          {
            text: "Générer le reçu",
            onPress: () => {
              // Réinitialiser le formulaire
              setFormData({
                nomMarchands: "",
                motif: "",
                montant: "",
                numeroQuittance: "",
              });

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
              setFormData({
                nomMarchands: "",
                motif: "",
                montant: "",
                numeroQuittance: "",
              });

              // Callback de succès
              if (onSuccess) {
                onSuccess();
              }

              onClose();
            },
          },
        ]);
      } else {
        Alert.alert(
          "Avertissement",
          "Paiement enregistré sur le serveur mais échec de la synchronisation locale.",
          [
            {
              text: "OK",
              onPress: () => {
                // Réinitialiser le formulaire quand même
                setFormData({
                  nomMarchands: "",
                  motif: "",
                  montant: "",
                  numeroQuittance: "",
                });

                if (onSuccess) {
                  onSuccess();
                }

                onClose();
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error("❌ Erreur enregistrement:", error);
      Alert.alert(
        "Erreur",
        error instanceof Error
          ? error.message
          : "Erreur lors de l'enregistrement",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Traitement en cours...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Nouveau Paiement</Text>

            <TextInput
              style={styles.input}
              placeholder="Nom du marchand *"
              value={formData.nomMarchands}
              onChangeText={(text) =>
                setFormData({ ...formData, nomMarchands: text })
              }
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Motif (optionnel)"
              value={formData.motif}
              onChangeText={(text) => setFormData({ ...formData, motif: text })}
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Montant *"
              value={formData.montant}
              keyboardType="numeric"
              onChangeText={(text) =>
                setFormData({ ...formData, montant: text })
              }
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Numéro de quittance *"
              value={formData.numeroQuittance}
              onChangeText={(text) =>
                setFormData({ ...formData, numeroQuittance: text })
              }
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Enregistrement..." : "Enregistrer"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal d'actions de reçu */}
      <ReceiptActionsModal
        visible={receiptModalVisible}
        onClose={() => setReceiptModalVisible(false)}
        payment={completedPayment}
        agentName={agentName}
        companyName="Votre Entreprise"
        companyAddress="Adresse de votre entreprise"
        companyPhone="+261 XX XX XXX XX"
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 5,
    marginBottom: 15,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: "#6c757d",
    opacity: 0.6,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 10,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
});

export default PaymentModal;
