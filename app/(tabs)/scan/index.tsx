import PaymentModalQR from "@/app/component/paiement/Scanner";
import { verifyQRCode } from "@/app/component/scan/qrSecurity";
import {
  Marchand,
  MarchandsService,
  MarchandStats,
  Paiement,
  Place,
} from "@/app/core/services/marchandService";
import { MaterialIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function QRScannerScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false); // Nouveau état pour contrôler la caméra
  const [marchand, setMarchand] = useState<Marchand | null>(null);
  const [stats, setStats] = useState<MarchandStats | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const marchandsService = new MarchandsService();
  const router = useRouter();

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);
    try {
      console.log("QR Data:", data);

      // Vérification de l'authenticité
      const verification = await verifyQRCode(data);
      if (!verification.isValid) {
        Alert.alert(
          "⚠️ ALERTE SÉCURITÉ",
          `QR Code non authentique!\n\n${verification.error}`,
          [
            {
              text: "Signaler",
              style: "destructive",
              onPress: () => console.log("FRAUDE DÉTECTÉE:", data),
            },
            {
              text: "Réessayer",
              onPress: () => {
                setScanned(false);
                setLoading(false);
              },
            },
          ],
        );
        return;
      }

      // Récupération des données
      const [marchandData, statsData, placesData, paiementsData] =
        await Promise.all([
          marchandsService.getMarchandById(verification.data.id),
          marchandsService.getMarchandStats(verification.data.id),
          marchandsService.getPlacesByMarchand(verification.data.id),
          marchandsService.getPaiementsByMarchand(verification.data.id),
        ]);

      if (!marchandData) {
        Alert.alert("Erreur", "Marchand introuvable dans la base de données");
        setScanned(false);
        setLoading(false);
        return;
      }

      setMarchand(marchandData);
      setStats(statsData);
      setPlaces(placesData);
      setPaiements(paiementsData);
      setCameraActive(false); // Désactiver la caméra après le scan
    } catch (error) {
      console.error("Erreur:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors du scan");
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePaiement = () => {
    if (!marchand) return;
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    // Recharger les paiements après un paiement réussi
    if (marchand) {
      try {
        const updatedPaiements = await marchandsService.getPaiementsByMarchand(
          marchand.id,
        );
        setPaiements(updatedPaiements);
      } catch (error) {
        console.error("Erreur lors du rechargement des paiements:", error);
      }
    }
  };

  const resetScan = () => {
    setScanned(false);
    setMarchand(null);
    setStats(null);
    setPlaces([]);
    setPaiements([]);
    setShowPaymentModal(false);
    setCameraActive(false); // Désactiver la caméra
  };

  const activateCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (result.granted) {
        setCameraActive(true);
      }
    } else {
      setCameraActive(true);
    }
  };

  const formatMontant = (montant: number | null | undefined) => {
    if (!montant) return "0 FCFA";
    return (
      new Intl.NumberFormat("fr-FR", {
        style: "decimal",
        minimumFractionDigits: 0,
      }).format(montant) + " FCFA"
    );
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getPaymentStatusColor = (statut?: string | null) => {
    const s = statut?.toUpperCase();
    if (s === "A_JOUR") return "#10b981";
    if (s === "EN_RETARD") return "#ef4444";
    return "#f59e0b";
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#5DADE2" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {!marchand ? (
        // Mode Scanner ou écran d'accueil
        !cameraActive ? (
          // Écran d'accueil avec bouton
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeContent}>
              <MaterialIcons
                name="qr-code-scanner"
                size={120}
                color="#5DADE2"
              />
              <Text style={styles.welcomeTitle}>Scanner QR Code</Text>
              <Text style={styles.welcomeSubtitle}>
                Scannez la carte marchand pour accéder aux informations et
                effectuer un paiement
              </Text>

              <TouchableOpacity
                style={styles.btnActivateCamera}
                onPress={activateCamera}
              >
                <MaterialIcons name="camera-alt" size={24} color="#fff" />
                <Text style={styles.btnActivateCameraText}>
                  Activer la caméra
                </Text>
              </TouchableOpacity>

              {!permission.granted && (
                <Text style={styles.permissionNote}>
                  L'accès à la caméra sera demandé
                </Text>
              )}
            </View>
          </View>
        ) : (
          // Mode Scanner actif
          <View style={styles.scannerContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            >
              <View style={styles.overlay}>
                <View style={styles.header}>
                  <TouchableOpacity
                    onPress={() => setCameraActive(false)}
                    style={styles.closeButton}
                  >
                    <MaterialIcons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>
                    Scanner la Carte Marchand
                  </Text>
                </View>

                <View style={styles.scannerFrame}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                  {loading && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="large" color="#fff" />
                      <Text style={styles.loadingText}>Vérification...</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.instruction}>
                  Placez le QR code dans le cadre
                </Text>
              </View>
            </CameraView>
          </View>
        )
      ) : (
        // Mode Résultat - Design comme l'image
        <View style={styles.resultWrapper}>
          {/* Header avec image de fond */}
          <View style={styles.heroHeader}>
            <TouchableOpacity onPress={resetScan} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.heroContent}>
              <Text style={styles.heroLabel}>MARCHAND</Text>
              <Text style={styles.heroName}>{marchand.nom}</Text>
              {places[0] && (
                <View style={styles.heroLocation}>
                  <MaterialIcons
                    name="location-on"
                    size={16}
                    color="rgba(255,255,255,0.9)"
                  />
                  <Text style={styles.heroLocationText}>
                    {places[0].nom || "Marché Central"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <ScrollView
            style={styles.contentScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Statut du compte */}
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Statut du compte</Text>
              <View style={styles.statusBadgeContainer}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: getPaymentStatusColor(
                        marchand.statut_de_paiement,
                      ),
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: getPaymentStatusColor(marchand.statut_de_paiement),
                    },
                  ]}
                >
                  {marchand.statut_de_paiement?.replace("_", " ") || "À jour"}
                </Text>
              </View>
            </View>

            {/* Derniers paiements */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Derniers paiements</Text>
                <TouchableOpacity>
                  <Text style={styles.sectionLink}>Voir tout</Text>
                </TouchableOpacity>
              </View>

              {paiements.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="receipt" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyText}>Aucun paiement</Text>
                </View>
              ) : (
                paiements.slice(0, 5).map((paiement, index) => (
                  <View key={paiement.id} style={styles.paiementItem}>
                    <View style={styles.paiementIcon}>
                      <MaterialIcons
                        name="description"
                        size={24}
                        color="#3b82f6"
                      />
                    </View>
                    <View style={styles.paiementContent}>
                      <View style={styles.paiementRow}>
                        <Text style={styles.paiementMontant}>
                          {formatMontant(paiement.montant)}
                        </Text>
                        <Text style={styles.paiementDate}>
                          {new Date(paiement.date_paiement || "")
                            .toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                            .toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.paiementMotif} numberOfLines={2}>
                        {paiement.motif || "Paiement de taxe"}
                      </Text>
                      {paiement.place_nom && (
                        <Text style={styles.paiementPlace}>
                          Place: {paiement.place_nom}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Fin de l'historique */}
            {paiements.length > 0 && (
              <Text style={styles.endHistoryText}>
                Fin de l&apos;historique récent
              </Text>
            )}

            {/* Espacement pour le bouton fixe */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Bouton Nouveau paiement fixe en bas */}
          <View style={styles.bottomButton}>
            <TouchableOpacity
              style={styles.btnPaiement}
              onPress={handlePaiement}
            >
              <MaterialIcons name="add-circle" size={24} color="#fff" />
              <Text style={styles.btnPaiementText}>Nouveau paiement</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal de paiement */}
      {marchand && (
        <PaymentModalQR
          visible={showPaymentModal}
          cin={marchand.cin || ""}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FBFF",
  },

  // Écran d'accueil
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FBFF",
    padding: 24,
  },
  welcomeContent: {
    alignItems: "center",
    maxWidth: 400,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2C3E50",
    marginTop: 24,
    marginBottom: 12,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#5A6C7D",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  btnActivateCamera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5DADE2",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: "#5DADE2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnActivateCameraText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  permissionNote: {
    fontSize: 13,
    color: "#5A6C7D",
    marginTop: 16,
    textAlign: "center",
    opacity: 0.7,
  },

  // Scanner
  scannerContainer: {
    flex: 1,
    width: "100%",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "space-between",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
  },
  closeButton: {
    position: "absolute",
    top: -40,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  scannerFrame: {
    width: 280,
    height: 280,
    alignSelf: "center",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#5DADE2",
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  instruction: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
  },
  loadingText: {
    color: "#2C3E50",
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ef4444",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  btnPrimary: {
    backgroundColor: "#5DADE2",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  // Nouveau design - résultat
  resultWrapper: {
    flex: 1,
    backgroundColor: "#F8FBFF",
  },
  heroHeader: {
    height: 170,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#5DADE2",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  heroLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroLocationText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  contentScroll: {
    flex: 1,
    backgroundColor: "#F8FBFF",
  },
  statusCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 14,
    color: "#5A6C7D",
    fontWeight: "500",
  },
  statusBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  sectionLink: {
    fontSize: 14,
    color: "#5DADE2",
    fontWeight: "600",
  },
  paiementItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  paiementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  paiementContent: {
    flex: 1,
  },
  paiementRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  paiementMontant: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  paiementDate: {
    fontSize: 11,
    color: "#5A6C7D",
    fontWeight: "600",
  },
  paiementMotif: {
    fontSize: 13,
    color: "#5A6C7D",
    marginBottom: 4,
  },
  paiementPlace: {
    fontSize: 12,
    color: "#5A6C7D",
    opacity: 0.8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#5A6C7D",
    marginTop: 12,
  },
  endHistoryText: {
    textAlign: "center",
    fontSize: 12,
    color: "#5A6C7D",
    marginTop: 16,
    marginBottom: 24,
    opacity: 0.6,
  },
  bottomButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#F8FBFF",
    borderTopWidth: 1,
    borderTopColor: "#E1E8ED",
  },
  btnPaiement: {
    backgroundColor: "#5DADE2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#5DADE2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnPaiementText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
