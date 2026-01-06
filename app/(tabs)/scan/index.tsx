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
  const [scanReady, setScanReady] = useState(false); // Nouveau : false au départ
  const [loading, setLoading] = useState(false);
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

      // 1. Vérification de l'authenticité
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

      // 2. Récupération de toutes les données en parallèle
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
    navigation.navigate('Paiement', { marchand, stats, places });
  };

  const startScanning = () => {
    setScanReady(true);
    setScanned(false);
  };

  const resetScan = () => {
    setScanned(false);
    setScanReady(false);
    setMarchand(null);
    setStats(null);
    setPlaces([]);
    setPaiements([]);
    setActiveTab('overview');
  };

  const formatMontant = (montant: number | null | undefined) => {
    if (!montant) return '0 Ar';
    return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(montant) + ' Ar';
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateFull = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
            onBarcodeScanned={scanned || !scanReady ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          >
            <View style={styles.overlay}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Scanner la Carte Marchand</Text>
                <View style={styles.securityBadge}>
                  <MaterialIcons name="verified-user" size={16} color="#fff" />
                  <Text style={styles.securityText}>Vérification sécurisée</Text>
                </View>
              </View>

              {/* Écran d'accueil : bouton pour lancer le scan */}
              {!scanReady && (
                <View style={styles.startScanOverlay}>
                  <Text style={styles.startScanTitle}>Prêt à scanner ?</Text>
                  <Text style={styles.startScanSubtitle}>
                    Appuyez sur le bouton pour commencer le scan du QR code
                  </Text>
                  <TouchableOpacity style={styles.startScanButton} onPress={startScanning}>
                    <MaterialIcons name="qr-code-scanner" size={32} color="#fff" />
                    <Text style={styles.startScanButtonText}>Lancer le scan</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Mode scan actif */}
              {scanReady && (
                <>
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
                </>
              )}
            </View>
          </CameraView>
        </View>
      ) : (
        // Mode Résultat détaillé
        <View style={styles.resultWrapper}>
          {/* Header avec bouton retour */}
          <View style={styles.resultHeader}>
            <TouchableOpacity onPress={resetScan} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.resultHeaderTitle}>Détails Marchand</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.resultContainer}>
            {/* Carte d'identité */}
            <View style={styles.identityCard}>
              <View style={styles.identityHeader}>
                <View style={styles.identityAvatar}>
                  <MaterialIcons name="person" size={40} color="#2563eb" />
                </View>
                <View style={styles.identityInfo}>
                  <Text style={styles.identityName}>{marchand.nom}</Text>
                  {marchand.prenom && <Text style={styles.identityPrenom}>{marchand.prenom}</Text>}
                </View>
                {marchand.statut_de_paiement && (
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getPaymentStatusColor(marchand.statut_de_paiement) },
                    ]}
                  >
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

            {/* Statistiques */}
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

            {/* Onglets */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
                onPress={() => setActiveTab('overview')}
              >
                <MaterialIcons
                  name="dashboard"
                  size={20}
                  color={activeTab === 'overview' ? '#2563eb' : '#64748b'}
                />
                <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
                  Vue
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'places' && styles.tabActive]}
                onPress={() => setActiveTab('places')}
              >
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color={activeTab === 'places' ? '#2563eb' : '#64748b'}
                />
                <Text style={[styles.tabText, activeTab === 'places' && styles.tabTextActive]}>
                  Places ({places.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'paiements' && styles.tabActive]}
                onPress={() => setActiveTab('paiements')}
              >
                <MaterialIcons
                  name="payment"
                  size={20}
                  color={activeTab === 'paiements' ? '#2563eb' : '#64748b'}
                />
                <Text style={[styles.tabText, activeTab === 'paiements' && styles.tabTextActive]}>
                  Paiements ({paiements.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'info' && styles.tabActive]}
                onPress={() => setActiveTab('info')}
              >
                <MaterialIcons
                  name="info"
                  size={20}
                  color={activeTab === 'info' ? '#2563eb' : '#64748b'}
                />
                <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
                  Infos
                </Text>
              </TouchableOpacity>
            </View>

            {/* Contenu des onglets */}
            <View style={styles.tabContent}>
              {/* Vue d'ensemble */}
              {activeTab === 'overview' && (
                <View>
                  {/* Derniers paiements */}
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <MaterialIcons name="history" size={24} color="#2563eb" />
                      <Text style={styles.sectionTitle}>Derniers paiements</Text>
                    </View>
                    {paiements.slice(0, 3).length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>💰</Text>
                        <Text style={styles.emptyText}>Aucun paiement</Text>
                      </View>
                    ) : (
                      paiements.slice(0, 3).map((paiement) => (
                        <View key={paiement.id} style={styles.miniPaiementCard}>
                          <View style={styles.miniPaiementLeft}>
                            <View style={styles.paiementIconCircle}>
                              <MaterialIcons name="check-circle" size={20} color="#10b981" />
                            </View>
                            <View>
                              <Text style={styles.miniPaiementMontant}>
                                {formatMontant(paiement.montant)}
                              </Text>
                              <Text style={styles.miniPaiementDate}>
                                {formatDate(paiement.date_paiement)}
                              </Text>
                            </View>
                          </View>
                          {paiement.type_paiement && (
                            <View style={styles.miniTypeBadge}>
                              <Text style={styles.miniTypeText}>{paiement.type_paiement}</Text>
                            </View>
                          )}
                        </View>
                      ))
                    )}
                  </View>

                  {/* Places en un coup d'œil */}
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <MaterialIcons name="store" size={24} color="#2563eb" />
                      <Text style={styles.sectionTitle}>Places</Text>
                    </View>
                    {places.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>🪑</Text>
                        <Text style={styles.emptyText}>Aucune place</Text>
                      </View>
                    ) : (
                      places.slice(0, 3).map((place) => (
                        <View key={place.id} style={styles.miniPlaceCard}>
                          <View style={styles.miniPlaceLeft}>
                            <View
                              style={[
                                styles.placeStatusDot,
                                { backgroundColor: getStatutColor(place.statut) },
                              ]}
                            />
                            <View>
                              <Text style={styles.miniPlaceName}>{place.nom}</Text>
                              {place.marchee_nom && (
                                <Text style={styles.miniPlaceLocation}>{place.marchee_nom}</Text>
                              )}
                            </View>
                          </View>
                          {place.droit_annuel && (
                            <Text style={styles.miniPlacePrice}>
                              {formatMontant(place.droit_annuel)}
                            </Text>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                </View>
              )}

              {/* Onglet Places */}
              {activeTab === 'places' && (
                <View>
                  {places.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyIcon}>🪑</Text>
                      <Text style={styles.emptyText}>Aucune place assignée</Text>
                    </View>
                  ) : (
                    places.map((place) => (
                      <View key={place.id} style={styles.placeCard}>
                        <View style={styles.placeHeader}>
                          <Text style={styles.placeName}>{place.nom}</Text>
                          <View
                            style={[
                              styles.placeStatutBadge,
                              { backgroundColor: getStatutColor(place.statut) + '20' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.placeStatutText,
                                { color: getStatutColor(place.statut) },
                              ]}
                            >
                              {place.statut}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.placeDetails}>
                          {place.marchee_nom && (
                            <Text style={styles.placeDetail}>🏪 {place.marchee_nom}</Text>
                          )}
                          {place.zone_nom && (
                            <Text style={styles.placeDetail}>📍 Zone {place.zone_nom}</Text>
                          )}
                          {place.hall_nom && (
                            <Text style={styles.placeDetail}>🏢 Hall {place.hall_nom}</Text>
                          )}
                          {place.droit_annuel && (
                            <Text style={styles.placeDetailPrice}>
                              💰 {formatMontant(place.droit_annuel)}/an
                            </Text>
                          )}
                          {place.date_debut_occupation && (
                            <Text style={styles.placeDetail}>
                              📅 Depuis le {formatDate(place.date_debut_occupation)}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* Onglet Paiements */}
              {activeTab === 'paiements' && (
                <View>
                  {paiements.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyIcon}>💰</Text>
                      <Text style={styles.emptyText}>Aucun paiement enregistré</Text>
                    </View>
                  ) : (
                    paiements.map((paiement) => (
                      <View key={paiement.id} style={styles.paiementCard}>
                        <View style={styles.paiementHeader}>
                          <View style={styles.paiementLeft}>
                            <View style={styles.paiementIconCircle}>
                              <MaterialIcons name="payment" size={24} color="#10b981" />
                            </View>
                            <View>
                              <Text style={styles.paiementMontant}>
                                {formatMontant(paiement.montant)}
                              </Text>
                              <Text style={styles.paiementDate}>
                                {formatDateFull(paiement.date_paiement)}
                              </Text>
                            </View>
                          </View>
                          {paiement.type_paiement && (
                            <View style={styles.paiementTypeBadge}>
                              <Text style={styles.paiementTypeText}>{paiement.type_paiement}</Text>
                            </View>
                          )}
                        </View>
                        {paiement.motif && (
                          <Text style={styles.paiementMotif}>{paiement.motif}</Text>
                        )}
                        <View style={styles.paiementDetails}>
                          {paiement.place_nom && (
                            <View style={styles.detailItem}>
                              <Text style={styles.detailLabel}>Place:</Text>
                              <Text style={styles.detailValue}>{paiement.place_nom}</Text>
                            </View>
                          )}
                          {paiement.session_nom && (
                            <View style={styles.detailItem}>
                              <Text style={styles.detailLabel}>Session:</Text>
                              <Text style={styles.detailValue}>{paiement.session_nom}</Text>
                            </View>
                          )}
                          {paiement.quittance_nom && (
                            <View style={styles.detailItem}>
                              <Text style={styles.detailLabel}>Quittance:</Text>
                              <Text style={styles.detailValue}>{paiement.quittance_nom}</Text>
                            </View>
                          )}
                          {paiement.date_debut && paiement.date_fin && (
                            <View style={styles.detailItem}>
                              <Text style={styles.detailLabel}>Période:</Text>
                              <Text style={styles.detailValue}>
                                {formatDate(paiement.date_debut)} - {formatDate(paiement.date_fin)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* Onglet Informations */}
              {activeTab === 'info' && (
                <View style={styles.infoContent}>
                  <View style={styles.infoSection}>
                    <Text style={styles.infoSectionTitle}>Informations générales</Text>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoItemLabel}>Date d'inscription</Text>
                      <Text style={styles.infoItemValue}>{formatDate(marchand.date_inscription)}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoItemLabel}>État</Text>
                      <Text style={styles.infoItemValue}>{marchand.etat || 'N/A'}</Text>
                    </View>
                    {marchand.stat && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoItemLabel}>STAT</Text>
                        <Text style={styles.infoItemValue}>{marchand.stat}</Text>
                      </View>
                    )}
                    {marchand.statut_de_paiement && (
                      <View style={styles.infoItem}>
                        <Text style={styles.infoItemLabel}>Statut de paiement</Text>
                        <View
                          style={[
                            styles.infoStatusBadge,
                            { backgroundColor: getPaymentStatusColor(marchand.statut_de_paiement) },
                          ]}
                        >
                          <Text style={styles.infoStatusText}>
                            {marchand.statut_de_paiement.replace('_', ' ')}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {(marchand.total_paiements ||
                    marchand.dernier_paiement ||
                    marchand.nombre_places) && (
                    <View style={styles.infoSection}>
                      <Text style={styles.infoSectionTitle}>Statistiques</Text>
                      {marchand.nombre_places !== undefined && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoItemLabel}>Nombre de places</Text>
                          <Text style={styles.infoItemValue}>{marchand.nombre_places}</Text>
                        </View>
                      )}
                      {marchand.total_paiements !== undefined && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoItemLabel}>Total payé</Text>
                          <Text style={styles.infoItemValue}>
                            {formatMontant(marchand.total_paiements)}
                          </Text>
                        </View>
                      )}
                      {marchand.dernier_paiement && (
                        <View style={styles.infoItem}>
                          <Text style={styles.infoItemLabel}>Dernier paiement</Text>
                          <Text style={styles.infoItemValue}>
                            {formatDate(marchand.dernier_paiement)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Boutons d'action fixes en bas */}
          <View style={styles.actionBar}>
            <TouchableOpacity style={styles.btnAction} onPress={handlePaiement}>
              <MaterialIcons name="payment" size={24} color="#fff" />
              <Text style={styles.btnActionText}>Nouveau paiement</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// =====================================================================
// STYLES
// =====================================================================
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
  startScanOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  startScanTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  startScanSubtitle: {
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
    marginBottom: 40,
  },
  startScanButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startScanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  tabActive: {
    backgroundColor: '#eff6ff',
  },
  tabText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  miniPaiementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
  },
  miniPaiementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paiementIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  miniPaiementMontant: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  miniPaiementDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  miniTypeBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniTypeText: {
    fontSize: 10,
    color: '#2563eb',
    fontWeight: '600',
  },
  miniPlaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
  },
  miniPlaceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  placeStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  miniPlaceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  miniPlaceLocation: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  miniPlacePrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  placeCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  placeStatutBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  placeStatutText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  placeDetails: {
    gap: 6,
  },
  placeDetail: {
    fontSize: 13,
    color: '#64748b',
  },
  placeDetailPrice: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  paiementCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  paiementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paiementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paiementMontant: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  paiementDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  paiementTypeBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  paiementTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
  paiementMotif: {
    fontSize: 14,
    color: '#475569',
    fontStyle: 'italic',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  paiementDetails: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  infoContent: {
    gap: 16,
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoItemLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  infoItemValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  infoStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  infoStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
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