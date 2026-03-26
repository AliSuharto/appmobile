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

    const qrData = `N°: ${payment.numeroQuittance} | Montant: ${payment.montant} Ar | Date: ${date}`;

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

            html, body {
              width: 210mm;
              height: 297mm;
              overflow: hidden;
            }

            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              background: #fff;
              padding: 16px 24px;
            }

            .receipt-container {
              border: 2px solid #333;
              padding: 16px 22px;
              height: 100%;
            }

            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 100px;
              color: rgba(0, 123, 255, 0.05);
              font-weight: bold;
              z-index: -1;
              pointer-events: none;
            }

            /* HEADER */
            .header {
              text-align: center;
              border-bottom: 2px solid #007bff;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }

            .company-name {
              font-size: 20px;
              font-weight: bold;
              color: #007bff;
              margin-bottom: 3px;
            }

            .company-info {
              font-size: 11px;
              color: #666;
              line-height: 1.4;
            }

            /* TITRE */
            .receipt-title {
              text-align: center;
              font-size: 16px;
              font-weight: bold;
              color: #333;
              margin: 8px 0 2px 0;
              text-transform: uppercase;
              letter-spacing: 2px;
            }

            .receipt-number {
              text-align: center;
              font-size: 12px;
              color: #666;
              margin-bottom: 10px;
            }

            /* DÉTAILS */
            .receipt-details {
              margin: 8px 0;
            }

            .detail-row {
              display: flex;
              padding: 7px 0;
              border-bottom: 1px solid #eee;
            }

            .detail-label {
              font-weight: bold;
              color: #333;
              width: 160px;
              flex-shrink: 0;
              font-size: 12px;
            }

            .detail-value {
              color: #555;
              flex: 1;
              font-size: 12px;
            }

            /* MONTANT */
            .amount-section {
              background: #f8f9fa;
              padding: 10px 14px;
              margin: 10px 0;
              border-radius: 6px;
              border-left: 4px solid #007bff;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }

            .amount-label {
              font-size: 14px;
              font-weight: bold;
              color: #333;
            }

            .amount-value {
              font-size: 24px;
              font-weight: bold;
              color: #007bff;
            }

            /* QR / VÉRIFICATION */
            .qr-section {
              text-align: center;
              margin: 10px 0;
              padding: 10px;
              background: #f8f9fa;
              border-radius: 6px;
            }

            .qr-placeholder {
              display: inline-block;
              background: white;
              border: 1.5px solid #007bff;
              border-radius: 6px;
              padding: 8px 16px;
            }

            .qr-text {
              font-size: 10px;
              color: #333;
              text-align: center;
              line-height: 1.5;
            }

            .qr-label {
              margin-top: 6px;
              font-size: 11px;
              color: #666;
            }

            /* FOOTER */
            .footer {
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1.5px solid #eee;
            }

            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 10px;
            }

            .signature-box {
              width: 45%;
              text-align: center;
            }

            .signature-line {
              border-top: 1.5px solid #333;
              margin-top: 40px;
              padding-top: 6px;
              font-size: 11px;
              color: #666;
            }

            .footer-note {
              margin-top: 10px;
              font-size: 10px;
              color: #999;
              font-style: italic;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="watermark">PAYÉ</div>

          <div class="receipt-container">
            <div class="header">
              <div class="company-name">${companyName}</div>
              <div class="company-info">
                ${companyAddress} &nbsp;|&nbsp; Tél: ${companyPhone}
              </div>
            </div>

            <div class="receipt-title">Reçu de Paiement</div>
            <div class="receipt-number">N° ${payment.numeroQuittance}</div>

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
                  ? `<div class="detail-row">
                <div class="detail-label">Motif:</div>
                <div class="detail-value">${payment.motif}</div>
              </div>`
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
                Ce document est un reçu de paiement officiel. Merci pour votre confiance.
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const generatePDF = async (
    payment: PaymentData,
    options: ReceiptOptions = {},
  ): Promise<string | null> => {
    try {
      const html = await createReceiptHTML(payment, options);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      console.log("✅ PDF généré:", uri);
      return uri;
    } catch (error) {
      console.error("❌ Erreur génération PDF:", error);
      Alert.alert("Erreur", "Impossible de générer le reçu PDF");
      return null;
    }
  };

  const sharePDF = async (
    payment: PaymentData,
    options: ReceiptOptions = {},
  ): Promise<void> => {
    try {
      const pdfUri = await generatePDF(payment, options);
      if (!pdfUri) return;

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "Non disponible",
          "Le partage n'est pas disponible sur cet appareil",
        );
        return;
      }

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

  const printPDF = async (
    payment: PaymentData,
    options: ReceiptOptions = {},
  ): Promise<void> => {
    try {
      const html = await createReceiptHTML(payment, options);
      await Print.printAsync({ html });
      console.log("✅ Impression lancée");
    } catch (error) {
      console.error("❌ Erreur impression:", error);
      Alert.alert("Erreur", "Impossible d'imprimer le reçu");
    }
  };

  const savePDF = async (
    payment: PaymentData,
    options: ReceiptOptions = {},
  ): Promise<string | null> => {
    try {
      const pdfUri = await generatePDF(payment, options);
      if (!pdfUri) return null;

      Alert.alert(
        "PDF généré",
        'Le PDF a été généré. Utilisez "Partager" pour le sauvegarder.',
        [
          {
            text: "Partager maintenant",
            onPress: async () => {
              await sharePDF(payment, options);
            },
          },
          { text: "OK", style: "cancel" },
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

  return { generatePDF, sharePDF, printPDF, savePDF };
};
