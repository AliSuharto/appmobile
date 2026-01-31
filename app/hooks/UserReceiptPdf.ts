import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
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

interface ReceiptOptions {
  agentName?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
}

export const useReceiptPDF = () => {
  // Créer le HTML du reçu
  const createReceiptHTML = async (
    payment: PaymentData,
    options: ReceiptOptions = {},
  ): Promise<string> => {
    const {
      agentName = payment.agentName || "Agent inconnu",
      companyName = "Votre Entreprise",
      companyAddress = "Adresse de l'entreprise",
      companyPhone = "Téléphone",
    } = options;

    const date = payment.createdAt
      ? new Date(payment.createdAt).toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date().toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

    // Données pour affichage dans le PDF
    const qrData = `QUITTANCE: ${payment.numeroQuittance}\nMONTANT: ${payment.montant} Ar\nDATE: ${date}`;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              padding: 40px;
              background: #fff;
            }
            
            .receipt-container {
              max-width: 800px;
              margin: 0 auto;
              border: 2px solid #333;
              padding: 30px;
            }
            
            .header {
              text-align: center;
              border-bottom: 3px solid #007bff;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            
            .company-name {
              font-size: 28px;
              font-weight: bold;
              color: #007bff;
              margin-bottom: 10px;
            }
            
            .company-info {
              font-size: 14px;
              color: #666;
              line-height: 1.6;
            }
            
            .receipt-title {
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin: 30px 0;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            
            .receipt-number {
              text-align: center;
              font-size: 16px;
              color: #666;
              margin-bottom: 30px;
            }
            
            .receipt-details {
              margin: 30px 0;
            }
            
            .detail-row {
              display: flex;
              padding: 15px 0;
              border-bottom: 1px solid #eee;
            }
            
            .detail-label {
              font-weight: bold;
              color: #333;
              width: 200px;
              flex-shrink: 0;
            }
            
            .detail-value {
              color: #555;
              flex: 1;
            }
            
            .amount-section {
              background: #f8f9fa;
              padding: 20px;
              margin: 30px 0;
              border-radius: 8px;
              border-left: 4px solid #007bff;
            }
            
            .amount-label {
              font-size: 18px;
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
            }
            
            .amount-value {
              font-size: 32px;
              font-weight: bold;
              color: #007bff;
            }
            
            .qr-section {
              text-align: center;
              margin: 40px 0;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            
            .qr-placeholder {
              display: inline-block;
              width: 200px;
              background: white;
              border: 2px solid #007bff;
              border-radius: 8px;
              padding: 20px;
              margin: 0 auto;
            }
            
            .qr-text {
              font-size: 12px;
              color: #333;
              white-space: pre-line;
              text-align: center;
              line-height: 1.6;
            }
            
            .qr-label {
              margin-top: 15px;
              font-size: 14px;
              color: #666;
            }
            
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #eee;
              text-align: center;
            }
            
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
            }
            
            .signature-box {
              width: 45%;
              text-align: center;
            }
            
            .signature-line {
              border-top: 2px solid #333;
              margin-top: 60px;
              padding-top: 10px;
              font-size: 14px;
              color: #666;
            }
            
            .footer-note {
              margin-top: 30px;
              font-size: 12px;
              color: #999;
              font-style: italic;
            }
            
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              color: rgba(0, 123, 255, 0.05);
              font-weight: bold;
              z-index: -1;
              pointer-events: none;
            }
          </style>
        </head>
        <body>
          <div class="watermark">PAYÉ</div>
          
          <div class="receipt-container">
            <div class="header">
              <div class="company-name">${companyName}</div>
              <div class="company-info">
                ${companyAddress}<br>
                Tél: ${companyPhone}
              </div>
            </div>
            
            <div class="receipt-title">Reçu de Paiement</div>
            
            <div class="receipt-number">
              N° ${payment.numeroQuittance}
            </div>
            
            <div class="receipt-details">
              <div class="detail-row">
                <div class="detail-label">Date:</div>
                <div class="detail-value">${date}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Nom du marchand:</div>
                <div class="detail-value">${payment.nomMarchands}</div>
              </div>
              
              ${
                payment.motif
                  ? `
              <div class="detail-row">
                <div class="detail-label">Motif:</div>
                <div class="detail-value">${payment.motif}</div>
              </div>
              `
                  : ""
              }
              
              <div class="detail-row">
                <div class="detail-label">Agent:</div>
                <div class="detail-value">${agentName}</div>
              </div>
            </div>
            
            <div class="amount-section">
              <div class="amount-label">Montant payé:</div>
              <div class="amount-value">${payment.montant.toLocaleString("fr-FR")} Ar</div>
            </div>
            
            <div class="qr-section">
              <div class="qr-placeholder">
                <div class="qr-text">${qrData}</div>
              </div>
              <div class="qr-label">Informations de vérification</div>
            </div>
            
            <div class="footer">
              <div class="signature-section">
                <div class="signature-box">
                  <div class="signature-line">Signature de l'agent</div>
                </div>
                <div class="signature-box">
                  <div class="signature-line">Signature du marchand</div>
                </div>
              </div>
              
              <div class="footer-note">
                Ce document est un reçu de paiement officiel.<br>
                Merci pour votre confiance.
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Générer le PDF
  const generatePDF = async (
    payment: PaymentData,
    options: ReceiptOptions = {},
  ): Promise<string | null> => {
    try {
      const html = await createReceiptHTML(payment, options);

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      console.log("✅ PDF généré:", uri);
      return uri;
    } catch (error) {
      console.error("❌ Erreur génération PDF:", error);
      Alert.alert("Erreur", "Impossible de générer le reçu PDF");
      return null;
    }
  };

  // Partager le PDF (inclut l'option de sauvegarder via le menu de partage)
  const sharePDF = async (
    payment: PaymentData,
    options: ReceiptOptions = {},
  ): Promise<void> => {
    try {
      const pdfUri = await generatePDF(payment, options);

      if (!pdfUri) {
        return;
      }

      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        Alert.alert(
          "Non disponible",
          "Le partage n'est pas disponible sur cet appareil",
        );
        return;
      }

      // Le menu de partage natif permet de sauvegarder dans les fichiers
      await Sharing.shareAsync(pdfUri, {
        mimeType: "application/pdf",
        dialogTitle: `Reçu N° ${payment.numeroQuittance}`,
        UTI: "com.adobe.pdf",
      });

      console.log("✅ PDF partagé avec succès");
    } catch (error) {
      console.error("❌ Erreur partage PDF:", error);
      Alert.alert("Erreur", "Impossible de partager le reçu");
    }
  };

  // Imprimer le PDF
  const printPDF = async (
    payment: PaymentData,
    options: ReceiptOptions = {},
  ): Promise<void> => {
    try {
      const html = await createReceiptHTML(payment, options);

      await Print.printAsync({
        html,
      });

      console.log("✅ Impression lancée");
    } catch (error) {
      console.error("❌ Erreur impression:", error);
      Alert.alert("Erreur", "Impossible d'imprimer le reçu");
    }
  };

  // Fonction de sauvegarde simplifiée - utilise le partage
  // L'utilisateur peut choisir "Enregistrer dans les fichiers" dans le menu de partage
  const savePDF = async (
    payment: PaymentData,
    options: ReceiptOptions = {},
  ): Promise<string | null> => {
    try {
      // Générer le PDF
      const pdfUri = await generatePDF(payment, options);

      if (!pdfUri) {
        return null;
      }

      // Informer l'utilisateur
      Alert.alert(
        "PDF généré",
        'Le PDF a été généré. Utilisez le bouton "Partager" pour le sauvegarder ou le partager.',
        [
          {
            text: "Partager maintenant",
            onPress: async () => {
              await sharePDF(payment, options);
            },
          },
          {
            text: "OK",
            style: "cancel",
          },
        ],
      );

      console.log("✅ PDF généré:", pdfUri);
      return pdfUri;
    } catch (error) {
      console.error("❌ Erreur génération PDF:", error);
      Alert.alert("Erreur", "Impossible de générer le reçu");
      return null;
    }
  };

  return {
    generatePDF,
    sharePDF,
    printPDF,
    savePDF,
  };
};
