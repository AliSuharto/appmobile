import CryptoJS from 'crypto-js';

// ⚠️ MÊME CLÉ QUE CÔTÉ WEB - DOIT ÊTRE IDENTIQUE !
const SECRET_KEY = 'BAZARYKELY_2025_SECRET_KEY_CHANGE_ME';

/**
 * Génère une signature HMAC-SHA256 identique au Web
 * Compatible avec crypto.subtle.sign() utilisé côté web
 */
export function generateSignature(data: string): string {
  // Génération HMAC-SHA256 avec CryptoJS
  const hash = CryptoJS.HmacSHA256(data, SECRET_KEY);
  
  // Conversion en hexadécimal
  const hexHash = hash.toString(CryptoJS.enc.Hex);
  
  // Retourne les 16 premiers caractères (comme côté web)
  return hexHash.substring(0, 16);
}

/**
 * Vérifie l'authenticité d'un QR code
 */
export function verifyQRCode(scannedData: string): {
  isValid: boolean;
  data?: any;
  error?: string;
} {
  try {
    const qrPayload = JSON.parse(scannedData);

    // Vérifications de base
    if (!qrPayload.v || !qrPayload.data || !qrPayload.sig || !qrPayload.ts) {
      return { isValid: false, error: 'Format invalide' };
    }

    // Vérification du timestamp (valide pendant 365 jours)
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (Date.now() - qrPayload.ts > oneYear) {
      return { isValid: false, error: 'QR Code expiré' };
    }

    // Recalcul de la signature
    const dataString = JSON.stringify(qrPayload.data);
    const expectedSignature = generateSignature(dataString);

    console.log('📝 Data String:', dataString);
    console.log('🔑 Signature du QR:', qrPayload.sig);
    console.log('✅ Signature calculée:', expectedSignature);

    // Comparaison sécurisée
    if (expectedSignature !== qrPayload.sig) {
      return {
        isValid: false,
        error: `⚠️ QR CODE NON AUTHENTIQUE - Signature invalide\nAttendu: ${expectedSignature}\nReçu: ${qrPayload.sig}`,
      };
    }

    return {
      isValid: true,
      data: qrPayload.data,
    };
  } catch (error) {
    console.error('❌ Erreur verifyQRCode:', error);
    return {
      isValid: false,
      error: `Erreur de lecture du QR Code: ${error}`,
    };
  }
}