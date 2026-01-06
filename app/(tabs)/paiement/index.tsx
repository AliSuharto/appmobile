import { verifyQRCode } from '@/app/component/scan/qrSecurity';
import { Marchand, MarchandsService, MarchandStats, Paiement, Place } from '@/app/core/services/marchandService';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function QRScannerScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false); // Nouveau state
  const [marchand, setMarchand] = useState<Marchand | null>(null);
  const [stats, setStats] = useState<MarchandStats | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'places' | 'paiements' | 'info'>('overview');

  const marchandsService = new MarchandsService();

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);
    setLoading(true);

    try {
      console.log('QR Data:', data);
      
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
    navigation.navigate('Paiement', {
      marchand,
      stats,
      places,
    });
  };

  const resetScan = () => {
    setScanned(false);
    setMarchand(null);
    setStats(null);
    setPlaces([]);
    setPaiements([]);
    setActiveTab('overview');
    setScannerActive(false); // Retour à l'écran d'accueil
  };

  const startScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (result.granted) {
        setScannerActive(true);
      }
    } else {
      setScannerActive(true);
    }
  };

  const formatMontant = (montant: number | null | undefined) => {
    if (!montant) return '0 Ar';
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(montant) + ' Ar';
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateFull = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatutColor = (statut?: string | null) => {
    const s = statut?.toLowerCase();
    if (s === 'occupee' || s === 'occupée' || s === 'occupé') return '#10b981';
    if (s === 'disponible') return '#3b82f6';
    if (s === 'reservee' || s === 'réservée') return '#f59e0b';
    return '#6b7280';
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

  // Écran d'accueil avec bouton Scan
  if (!scannerActive && !marchand) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeContent}>
            <MaterialIcons name="qr-code-scanner" size={120} color="#2563eb" />
            <Text style={styles.welcomeTitle}>Scanner QR Code</Text>
            <Text style={styles.welcomeSubtitle}>
              Scannez la carte d'un marchand pour voir ses informations et effectuer un paiement
            </Text>
            
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={startScanner}
            >
              <MaterialIcons name="camera-alt" size={28} color="#fff" />
              <Text style={styles.scanButtonText}>Démarrer le scan</Text>
            </TouchableOpacity>

            <View style={styles.securityInfo}>
              <MaterialIcons name="verified-user" size={20} color="#10b981" />
              <Text style={styles.securityInfoText}>
                Vérification sécurisée et authentification automatique
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {!marchand && !scannerActive ? (
        // Écran d'accueil - pas de caméra
        null
      ) : !marchand ? (
        // Mode Scanner - caméra activée
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          >
            <View style={styles.overlay}>
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.closeBtn}
                  onPress={() => setScannerActive(false)}
                >
                  <MaterialIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                
                <View style={styles.headerCenter}>
                  <Text style={styles.headerTitle}>Scanner la Carte</Text>
                  <View style={styles.securityBadge}>
                    <MaterialIcons name="verified-user" size={16} color="#fff" />
                    <Text style={styles.securityText}>Vérification sécurisée</Text>
                  </View>
                </View>
                
                <View style={{ width: 40 }} />
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
      ) : (
        // Mode Résultat détaillé (reste inchangé)
        <View style={styles.resultWrapper}>
          <View style={styles.resultHeader}>
            <TouchableOpacity onPress={resetScan} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.resultHeaderTitle}>Détails Marchand</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.resultContainer}>
            {/* Reste du code identique... */}
            <View style={styles.identityCard}>
              <View style={styles.identityHeader}>
                <View style={styles.identityAvatar}>
                  <MaterialIcons name="person" size={40} color="#2563eb" />
                </View>
                <View style={styles.identityInfo}>
                  <Text style={styles.identityName}>
                    {marchand.nom}
                  </Text>
                  {marchand.prenom && (
                    <Text style={styles.identityPrenom}>{marchand.prenom}</Text>
                  )}
                </View>
                {marchand.statut_de_paiement && (
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getPaymentStatusColor(marchand.statut_de_paiement) }
                  ]}>
                    <Text style={styles.statusText}>
                      {marchand.statut_de_paiement.replace('_', ' ')}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.identityDetails}>
                {marchand.telephone && (
                  <View style={styles.identityRow}>
                    <Text style={styles.identityIcon}>📱</Text>
                    <Text style={styles.identityText}>{marchand.telephone}</Text>
                  </View>
                )}
                {marchand.cin && (
                  <View style={styles.identityRow}>
                    <Text style={styles.identityIcon}>🆔</Text>
                    <Text style={styles.identityText}>{marchand.cin}</Text>
                  </View>
                )}
                {marchand.nif && (
                  <View style={styles.identityRow}>
                    <Text style={styles.identityIcon}>📋</Text>
                    <Text style={styles.identityText}>NIF: {marchand.nif}</Text>
                  </View>
                )}
                {marchand.type_activite && (
                  <View style={styles.identityRow}>
                    <Text style={styles.identityIcon}>💼</Text>
                    <Text style={styles.identityText}>{marchand.type_activite}</Text>
                  </View>
                )}
              </View>
            </View>

            {stats && (
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <MaterialIcons name="payments" size={28} color="#10b981" />
                  <Text style={styles.statValue}>{formatMontant(stats.montant_total)}</Text>
                  <Text style={styles.statLabel}>Total payé</Text>
                </View>
                <View style={styles.statCard}>
                  <MaterialIcons name="receipt" size={28} color="#3b82f6" />
                  <Text style={styles.statValue}>{stats.nombre_paiements}</Text>
                  <Text style={styles.statLabel}>Paiements</Text>
                </View>
                <View style={styles.statCard}>
                  <MaterialIcons name="store" size={28} color="#f59e0b" />
                  <Text style={styles.statValue}>{stats.nombre_places}</Text>
                  <Text style={styles.statLabel}>Places</Text>
                </View>
              </View>
            )}

            {/* Onglets et contenu - code identique omis pour la brièveté */}
          </ScrollView>

          <View style={styles.actionBar}>
            <TouchableOpacity 
              style={styles.btnAction} 
              onPress={handlePaiement}
            >
              <MaterialIcons name="payment" size={24} color="#fff" />
              <Text style={styles.btnActionText}>Nouveau paiement</Text>
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
  // Nouveaux styles pour l'écran d'accueil
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  welcomeContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  securityInfoText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '500',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 60,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  securityText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
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
  },
  resultWrapper: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultContainer: {
    flex: 1,
  },
  identityCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  identityAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  identityInfo: {
    flex: 1,
  },
  identityName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  identityPrenom: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  identityDetails: {
    gap: 10,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  identityIcon: {
    fontSize: 20,
    marginRight: 10,
    width: 30,
  },
  identityText: {
    fontSize: 14,
    color: '#475569',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  btnAction: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
});