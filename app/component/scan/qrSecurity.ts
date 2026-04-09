// import CryptoJS from "crypto-js";

// // ⚠️ MÊME CLÉ QUE CÔTÉ WEB - DOIT ÊTRE IDENTIQUE !
// const SECRET_KEY = "BAZARYKELY_2025_SECRET_KEY_CHANGE_ME";

// /**
//  * Génère une signature HMAC-SHA256 identique au Web
//  * Compatible avec crypto.subtle.sign() utilisé côté web
//  */
// export function generateSignature(data: string): string {
//   // Génération HMAC-SHA256 avec CryptoJS
//   const hash = CryptoJS.HmacSHA256(data, SECRET_KEY);

//   // Conversion en hexadécimal
//   const hexHash = hash.toString(CryptoJS.enc.Hex);

//   // Retourne les 16 premiers caractères (comme côté web)
//   return hexHash.substring(0, 16);
// }

// /**
//  * Vérifie l'authenticité d'un QR code
//  */
// export function verifyQRCode(scannedData: string): {
//   isValid: boolean;
//   data?: any;
//   error?: string;
// } {
//   try {
//     const qrPayload = JSON.parse(scannedData);

//     // Vérifications de base
//     if (!qrPayload.v || !qrPayload.data || !qrPayload.sig || !qrPayload.ts) {
//       return { isValid: false, error: "Format invalide" };
//     }

//     // Vérification du timestamp (valide pendant 365 jours)
//     const oneYear = 365 * 24 * 60 * 60 * 1000;
//     if (Date.now() - qrPayload.ts > oneYear) {
//       return { isValid: false, error: "QR Code expiré" };
//     }

//     // Recalcul de la signature
//     const dataString = JSON.stringify(qrPayload.data);
//     const expectedSignature = generateSignature(dataString);

//     console.log("📝 Data String:", dataString);
//     console.log("🔑 Signature du QR:", qrPayload.sig);
//     console.log("✅ Signature calculée:", expectedSignature);

//     // Comparaison sécurisée
//     if (expectedSignature !== qrPayload.sig) {
//       return {
//         isValid: false,
//         error: `⚠️ QR CODE NON AUTHENTIQUE - Signature invalide\nAttendu: ${expectedSignature}\nReçu: ${qrPayload.sig}`,
//       };
//     }

//     return {
//       isValid: true,
//       data: qrPayload.data,
//     };
//   } catch (error) {
//     console.error("❌ Erreur verifyQRCode:", error);
//     return {
//       isValid: false,
//       error: `Erreur de lecture du QR Code: ${error}`,
//     };
//   }
// }

import CryptoJS from "crypto-js";

const PREFIX = "CUDS112233";

/**
 * Génère une signature SHA-256 identique au code WinDev :
 *  - Input  : "CUDS112233" + Nom + "//" + CIN + "//" + Téléphone
 *  - Hash   : SHA-256 → hex uppercase
 *  - Sig    : Gauche(hex, 4) + Droite(hex, 4)  →  8 caractères
 */
export function generateSignature(
  nom: string,
  cin: string,
  telephone: string,
): string {
  const marchandSelect = `${PREFIX}${nom}//${cin}//${telephone}`;

  // SHA-256 sur la chaîne UTF-8 (comportement identique à ChaîneVersUTF8 + HashChaîne)
  const hash = CryptoJS.SHA256(CryptoJS.enc.Utf8.parse(marchandSelect));
  const hex = hash.toString(CryptoJS.enc.Hex).toUpperCase(); // ex: "A3F1...9C2B"

  // Gauche(hex, 4) + Droite(hex, 4)
  const signature = hex.substring(0, 4) + hex.substring(hex.length - 4);
  return signature; // 8 caractères
}

/**
 * Vérifie l'authenticité d'un QR Code marchand.
 *
 * Format attendu du QR :
 *   "Nom_et_prénoms//N_CIN//Téléphone**SSSSSSSS"
 *   où SSSSSSSS est la signature sur 8 caractères.
 *
 * Exemple : "Jean Dupont//123456789//0341234567**A3F19C2B"
 */
export function verifyQRCode(scannedData: string): {
  isValid: boolean;
  data?: { nom: string; cin: string; telephone: string };
  error?: string;
} {
  try {
    // Séparation données / signature sur le délimiteur "**"
    const parts = scannedData.split("**");
    if (parts.length !== 2) {
      return {
        isValid: false,
        error: 'Format invalide : délimiteur "**" manquant',
      };
    }

    const [payload, receivedSig] = parts;

    // Découpage du payload  "Nom//CIN//Téléphone"
    const fields = payload.split("//");
    if (fields.length !== 3) {
      return {
        isValid: false,
        error: "Format invalide : 3 champs attendus (Nom//CIN//Téléphone)",
      };
    }

    const [nom, cin, telephone] = fields;

    // Recalcul de la signature
    const expectedSig = generateSignature(nom, cin, telephone);

    console.log("📝 Payload         :", payload);
    console.log("🔑 Signature QR    :", receivedSig);
    console.log("✅ Signature calc. :", expectedSig);

    if (receivedSig.toUpperCase() !== expectedSig.toUpperCase()) {
      return {
        isValid: false,
        error: `⚠️ QR CODE NON AUTHENTIQUE\nAttendu : ${expectedSig}\nReçu    : ${receivedSig}`,
      };
    }

    return {
      isValid: true,
      data: { nom, cin, telephone },
    };
  } catch (error) {
    console.error("❌ Erreur verifyQRCode:", error);
    return {
      isValid: false,
      error: `Erreur de lecture du QR Code : ${error}`,
    };
  }
}
