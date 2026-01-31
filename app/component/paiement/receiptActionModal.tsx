import { useReceiptPDF } from "@/app/hooks/UserReceiptPdf";
import { useReceiptSMS } from "@/app/hooks/UserReceiptSms";
import React, { useState } from "react";
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

interface PaymentData {
  id?: number;
  nomMarchands: string;
  motif?: string;
  montant: number;
  numeroQuittance: string;
  createdAt?: string;
  agentName?: string;
}

interface ReceiptActionsModalProps {
  visible: boolean;
  onClose: () => void;
  payment: PaymentData | null;
  agentName?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
}

const ReceiptActionsModal: React.FC<ReceiptActionsModalProps> = ({
  visible,
  onClose,
  payment,
  agentName = "Agent",
  companyName = "Votre Entreprise",
  companyAddress = "Adresse de l'entreprise",
  companyPhone = "Téléphone",
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string>("");

  const { sharePDF, printPDF, savePDF } = useReceiptPDF();
  const { sendSMS, openSMSComposer } = useReceiptSMS();

  const receiptOptions = {
    agentName,
    companyName,
    companyAddress,
    companyPhone,
  };

  const smsOptions = {
    agentName,
    companyName,
  };

  if (!payment) {
    return null;
  }

  // Générer et partager le PDF
  const handleSharePDF = async () => {
    try {
      setLoading(true);
      setActiveAction("share");
      await sharePDF(payment, receiptOptions);
    } catch (error) {
      console.error("Erreur partage:", error);
    } finally {
      setLoading(false);
      setActiveAction("");
    }
  };

  // Imprimer le PDF
  const handlePrintPDF = async () => {
    try {
      setLoading(true);
      setActiveAction("print");
      await printPDF(payment, receiptOptions);
    } catch (error) {
      console.error("Erreur impression:", error);
    } finally {
      setLoading(false);
      setActiveAction("");
    }
  };

  // Sauvegarder le PDF
  const handleSavePDF = async () => {
    try {
      setLoading(true);
      setActiveAction("save");
      await savePDF(payment, receiptOptions);
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
    } finally {
      setLoading(false);
      setActiveAction("");
    }
  };

  // Envoyer le SMS
  const handleSendSMS = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un numéro de téléphone");
      return;
    }

    try {
      setLoading(true);
      setActiveAction("sms");
      await sendSMS(payment, phoneNumber, smsOptions);
    } catch (error) {
      console.error("Erreur SMS:", error);
    } finally {
      setLoading(false);
      setActiveAction("");
    }
  };

  // Ouvrir le compositeur SMS
  const handleOpenSMSComposer = async () => {
    try {
      setLoading(true);
      setActiveAction("sms-composer");
      await openSMSComposer(payment, phoneNumber || undefined, smsOptions);
    } catch (error) {
      console.error("Erreur compositeur SMS:", error);
    } finally {
      setLoading(false);
      setActiveAction("");
    }
  };

  // Tout envoyer (PDF + SMS)
  const handleSendAll = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert(
        "Numéro requis",
        "Veuillez entrer un numéro de téléphone pour l'envoi complet",
      );
      return;
    }

    Alert.alert(
      "Confirmation",
      "Voulez-vous partager le PDF et envoyer le SMS ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            try {
              setLoading(true);
              setActiveAction("all");

              // Partager le PDF
              await sharePDF(payment, receiptOptions);

              // Envoyer le SMS
              await sendSMS(payment, phoneNumber, smsOptions);

              Alert.alert("Succès", "Reçu partagé et SMS envoyé!");
            } catch (error) {
              console.error("Erreur envoi complet:", error);
              Alert.alert("Erreur", "Une erreur est survenue");
            } finally {
              setLoading(false);
              setActiveAction("");
            }
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Actions sur le reçu</Text>
              <Text style={styles.subtitle}>
                Reçu N° {payment.numeroQuittance}
              </Text>
            </View>

            {/* Résumé du paiement */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Résumé du paiement</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Marchand:</Text>
                <Text style={styles.summaryValue}>{payment.nomMarchands}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Montant:</Text>
                <Text style={[styles.summaryValue, styles.amountText]}>
                  {payment.montant.toLocaleString("fr-FR")} Ar
                </Text>
              </View>
              {payment.motif && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Motif:</Text>
                  <Text style={styles.summaryValue}>{payment.motif}</Text>
                </View>
              )}
            </View>

            {/* Actions PDF */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📄 Actions PDF</Text>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.primaryButton,
                  loading && activeAction === "share" && styles.disabledButton,
                ]}
                onPress={handleSharePDF}
                disabled={loading}
              >
                {loading && activeAction === "share" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonIcon}>📤</Text>
                    <Text style={styles.buttonText}>Partager le PDF</Text>
                    <Text style={styles.buttonSubtext}>
                      WhatsApp, Email, etc.
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.secondaryButton,
                  loading && activeAction === "save" && styles.disabledButton,
                ]}
                onPress={handleSavePDF}
                disabled={loading}
              >
                {loading && activeAction === "save" ? (
                  <ActivityIndicator color="#007bff" />
                ) : (
                  <>
                    <Text style={styles.buttonIcon}>💾</Text>
                    <Text style={[styles.buttonText, styles.secondaryText]}>
                      Télécharger le PDF
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.secondaryButton,
                  loading && activeAction === "print" && styles.disabledButton,
                ]}
                onPress={handlePrintPDF}
                disabled={loading}
              >
                {loading && activeAction === "print" ? (
                  <ActivityIndicator color="#007bff" />
                ) : (
                  <>
                    <Text style={styles.buttonIcon}>🖨️</Text>
                    <Text style={[styles.buttonText, styles.secondaryText]}>
                      Imprimer
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Actions SMS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💬 Actions SMS</Text>

              <TextInput
                style={styles.phoneInput}
                placeholder="Numéro de téléphone (ex: +261 34 12 345 67)"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                editable={!loading}
              />

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.primaryButton,
                  loading && activeAction === "sms" && styles.disabledButton,
                ]}
                onPress={handleSendSMS}
                disabled={loading || !phoneNumber.trim()}
              >
                {loading && activeAction === "sms" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonIcon}>📱</Text>
                    <Text style={styles.buttonText}>Envoyer le SMS</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.secondaryButton,
                  loading &&
                    activeAction === "sms-composer" &&
                    styles.disabledButton,
                ]}
                onPress={handleOpenSMSComposer}
                disabled={loading}
              >
                {loading && activeAction === "sms-composer" ? (
                  <ActivityIndicator color="#007bff" />
                ) : (
                  <>
                    <Text style={styles.buttonIcon}>✏️</Text>
                    <Text style={[styles.buttonText, styles.secondaryText]}>
                      Composer un SMS
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Action combinée */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚡ Action rapide</Text>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.successButton,
                  loading && activeAction === "all" && styles.disabledButton,
                ]}
                onPress={handleSendAll}
                disabled={loading || !phoneNumber.trim()}
              >
                {loading && activeAction === "all" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonIcon}>🚀</Text>
                    <Text style={styles.buttonText}>
                      Partager PDF + Envoyer SMS
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Bouton Fermer */}
            <TouchableOpacity
              style={[styles.closeButton, loading && styles.disabledButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  summaryCard: {
    margin: 20,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#007bff",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  actionButton: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
    flexDirection: "column",
    minHeight: 60,
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#007bff",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#007bff",
  },
  successButton: {
    backgroundColor: "#28a745",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonSubtext: {
    color: "#fff",
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
  secondaryText: {
    color: "#007bff",
  },
  closeButton: {
    margin: 20,
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#6c757d",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ReceiptActionsModal;
