import * as SMS from "expo-sms";
import { Alert } from "react-native";

interface PaymentData {
  id?: number;
  nomMarchands: string;
  motif?: string;
  montant: number;
  numeroQuittance: string;
  createdAt?: string;
  agentName?: string;
}

interface SMSOptions {
  phoneNumber?: string;
  agentName?: string;
  companyName?: string;
}

export const useReceiptSMS = () => {
  // Créer le message SMS
  const createSMSMessage = (
    payment: PaymentData,
    options: SMSOptions = {},
  ): string => {
    const {
      agentName = payment.agentName || "Agent",
      companyName = "Votre Entreprise",
    } = options;

    const date = payment.createdAt
      ? new Date(payment.createdAt).toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date().toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });

    let message = `🧾 REÇU DE PAIEMENT\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `${companyName}\n\n`;
    message += `📅 Date: ${date}\n`;
    message += `🔢 N° Quittance: ${payment.numeroQuittance}\n`;
    message += `👤 Marchand: ${payment.nomMarchands}\n`;

    if (payment.motif) {
      message += `📝 Motif: ${payment.motif}\n`;
    }

    message += `💰 Montant: ${payment.montant.toLocaleString("fr-FR")} Ar\n`;
    message += `👨‍💼 Agent: ${agentName}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `Merci pour votre confiance!\n`;
    message += `✓ Paiement confirmé`;

    return message;
  };

  // Vérifier la disponibilité du SMS
  const checkSMSAvailability = async (): Promise<boolean> => {
    try {
      const isAvailable = await SMS.isAvailableAsync();
      return isAvailable;
    } catch (error) {
      console.error("❌ Erreur vérification SMS:", error);
      return false;
    }
  };

  // Envoyer le SMS
  const sendSMS = async (
    payment: PaymentData,
    phoneNumber: string,
    options: SMSOptions = {},
  ): Promise<boolean> => {
    try {
      // Vérifier la disponibilité
      const isAvailable = await checkSMSAvailability();

      if (!isAvailable) {
        Alert.alert(
          "Non disponible",
          "L'envoi de SMS n'est pas disponible sur cet appareil",
        );
        return false;
      }

      // Valider le numéro de téléphone
      if (!phoneNumber || phoneNumber.trim() === "") {
        Alert.alert("Erreur", "Numéro de téléphone requis");
        return false;
      }

      // Créer le message
      const message = createSMSMessage(payment, options);

      // Envoyer le SMS
      const { result } = await SMS.sendSMSAsync([phoneNumber], message);

      if (result === "sent") {
        console.log("✅ SMS envoyé avec succès");
        Alert.alert("Succès", "SMS envoyé avec succès");
        return true;
      } else if (result === "cancelled") {
        console.log("⚠️ Envoi SMS annulé");
        return false;
      } else {
        console.log("❌ Échec envoi SMS");
        Alert.alert("Erreur", "Échec de l'envoi du SMS");
        return false;
      }
    } catch (error) {
      console.error("❌ Erreur envoi SMS:", error);
      Alert.alert(
        "Erreur",
        "Impossible d'envoyer le SMS. Vérifiez le numéro de téléphone.",
      );
      return false;
    }
  };

  // Ouvrir l'application SMS avec le message pré-rempli
  const openSMSComposer = async (
    payment: PaymentData,
    phoneNumber?: string,
    options: SMSOptions = {},
  ): Promise<void> => {
    try {
      const isAvailable = await checkSMSAvailability();

      if (!isAvailable) {
        Alert.alert(
          "Non disponible",
          "L'envoi de SMS n'est pas disponible sur cet appareil",
        );
        return;
      }

      const message = createSMSMessage(payment, options);

      const recipients = phoneNumber ? [phoneNumber] : [];

      await SMS.sendSMSAsync(recipients, message);

      console.log("✅ Compositeur SMS ouvert");
    } catch (error) {
      console.error("❌ Erreur ouverture SMS:", error);
      Alert.alert("Erreur", "Impossible d'ouvrir le compositeur SMS");
    }
  };

  // Envoyer à plusieurs destinataires
  const sendBulkSMS = async (
    payment: PaymentData,
    phoneNumbers: string[],
    options: SMSOptions = {},
  ): Promise<{ success: number; failed: number }> => {
    const results = { success: 0, failed: 0 };

    if (!phoneNumbers || phoneNumbers.length === 0) {
      Alert.alert("Erreur", "Aucun numéro de téléphone fourni");
      return results;
    }

    for (const phoneNumber of phoneNumbers) {
      const sent = await sendSMS(payment, phoneNumber, options);
      if (sent) {
        results.success++;
      } else {
        results.failed++;
      }
    }

    if (results.success > 0) {
      Alert.alert(
        "Résultat",
        `SMS envoyés: ${results.success}\nÉchecs: ${results.failed}`,
      );
    }

    return results;
  };

  return {
    sendSMS,
    openSMSComposer,
    sendBulkSMS,
    checkSMSAvailability,
    createSMSMessage,
  };
};
