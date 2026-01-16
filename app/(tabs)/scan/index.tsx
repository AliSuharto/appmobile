import { verifyQRCode } from '@/app/component/scan/qrSecurity';
import { Marchand, MarchandsService, MarchandStats, Paiement, Place } from '@/app/core/services/marchandService';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function QRScannerScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [marchand, setMarchand] = useState<Marchand | null>(null);
  const [stats, setStats] = useState<MarchandStats | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);

  const marchandsService = new MarchandsService();
  const router = useRouter();

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);
    try {
      console.log('QR Data:', data);

      // Vérification de l'authenticité
      const verification = await verifyQRCode(data);
      if (!verification.isValid) {
        Alert.alert(
          '⚠️ ALERTE SÉCURITÉ',
          `QR Code non authentique!\n\n${verification.error}`,
          [
            {
              text: 'Signaler',
              style: 'destructive',
              onPress: () => console.log('FRAUDE DÉTECTÉE:', data),
            },
            {
              text: 'Réessayer',
              onPress: () => {
                setScanned(false);
                setLoading(false);
              },
            },
          ]
        );
        return;
      }

      // Récupération des données
      const [marchandData, statsData, placesData, paiementsData] = await Promise.all([
        marchandsService.getMarchandById(verification.data.id),
        marchandsService.getMarchandStats(verification.data.id),
        marchandsService.getPlacesByMarchand(verification.data.id),
        marchandsService.getPaiementsByMarchand(verification.data.id),
      ]);

      if (!marchandData) {
        Alert.alert('Erreur', 'Marchand introuvable dans la base de données');
        setScanned(false);
        setLoading(false);
        return;
      }

      setMarchand(marchandData);
      setStats(statsData);
      setPlaces(placesData);
      setPaiements(paiementsData);
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du scan');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePaiement = () => {
    if (!marchand) return;
    router.push({
      pathname: '/paiement',
      params: { cin: marchand.cin}
    });
  };

  const resetScan = () => {
    setScanned(false);
    setMarchand(null);
    setStats(null);
    setPlaces([]);
    setPaiements([]);
  };

  const formatMontant = (montant: number | null | undefined) => {
    if (!montant) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(montant) + ' FCFA';
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getPaymentStatusColor = (statut?: string | null) => {
    const s = statut?.toUpperCase();
    if (s === 'A_JOUR') return '#10b981';
    if (s === 'EN_RETARD') return '#ef4444';
    return '#f59e0b';
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <MaterialIcons name="camera-alt" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Accès à la caméra nécessaire</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={requestPermission}>
          <Text style={styles.btnPrimaryText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {!marchand ? (
        // Mode Scanner
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          >
            <View style={styles.overlay}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Scanner la Carte Marchand</Text>
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
              <Text style={styles.instruction}>Placez le QR code dans le cadre</Text>
            </View>
          </CameraView>
        </View>
      ) : (
        // Mode Résultat - Design comme l'image
        <View style={styles.resultWrapper}>
          {/* Header avec image de fond */}
          <View style={styles.heroHeader}>
            {/* <View style={styles.heroImageContainer}> */}
              {/* Placeholder pour l'image - vous pouvez utiliser une vraie image */}
              {/* <View style={styles.heroImagePlaceholder}>
                <MaterialIcons name="store" size={60} color="rgba(255,255,255,0.3)" />
              </View> */}
            {/* </View> */}
            
            <TouchableOpacity onPress={resetScan} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.heroContent}>
              <Text style={styles.heroLabel}>MARCHAND</Text>
              <Text style={styles.heroName}>{marchand.nom}</Text>
              {places[0] && (
                <View style={styles.heroLocation}>
                  <MaterialIcons name="location-on" size={16} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.heroLocationText}>
                    {places[0].nom || 'Marché Central'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Statut du compte */}
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Statut du compte</Text>
              <View style={styles.statusBadgeContainer}>
                <View 
                  style={[
                    styles.statusDot,
                    { backgroundColor: getPaymentStatusColor(marchand.statut_de_paiement) }
                  ]}
                />
                <Text style={[
                  styles.statusText,
                  { color: getPaymentStatusColor(marchand.statut_de_paiement) }
                ]}>
                  {marchand.statut_de_paiement?.replace('_', ' ') || 'À jour'}
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
                      <MaterialIcons name="description" size={24} color="#3b82f6" />
                    </View>
                    <View style={styles.paiementContent}>
                      <View style={styles.paiementRow}>
                        <Text style={styles.paiementMontant}>
                          {formatMontant(paiement.montant)}
                        </Text>
                        <Text style={styles.paiementDate}>
                          {new Date(paiement.date_paiement || '').toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.paiementMotif} numberOfLines={2}>
                        {paiement.motif || 'Paiement de taxe'}
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
                Fin de l'historique récent
              </Text>
            )}

            {/* Espacement pour le bouton fixe */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Bouton Nouveau paiement fixe en bas */}
          <View style={styles.bottomButton}>
            <TouchableOpacity style={styles.btnPaiement} onPress={handlePaiement}>
              <MaterialIcons name="add-circle" size={24} color="#fff" />
              <Text style={styles.btnPaiementText}>Nouveau paiement</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scannerContainer: {
    flex: 1,
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  scannerFrame: {
    width: 280,
    height: 280,
    alignSelf: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#3b82f6',
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  btnPrimary: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Nouveau design - résultat
  resultWrapper: {
    flex: 1,
    backgroundColor: '#0f1729',
  },
  heroHeader: {
    height: 170,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImageContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1e293b',
  },
  heroImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#334155',
  },
  backButton: {
    position: 'absolute',
    top: 2,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  moreButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
    backgroundColor: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroLocationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  contentScroll: {
    flex: 1,
    backgroundColor: '#0f1729',
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a2332',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionLink: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  paiementItem: {
    flexDirection: 'row',
    backgroundColor: '#1a2332',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  paiementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paiementContent: {
    flex: 1,
  },
  paiementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  paiementMontant: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  paiementDate: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  paiementMotif: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
  },
  paiementPlace: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#1a2332',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
  },
  endHistoryText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#475569',
    marginTop: 16,
    marginBottom: 24,
  },
  bottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#0f1729',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  btnPaiement: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  btnPaiementText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});