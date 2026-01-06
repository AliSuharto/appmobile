import { Marchand, MarchandsService, MarchandStats, Paiement, Place } from '@/app/core/services/marchandService';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface MarchandDetailsProps {
  marchandId: number;
  onBack: () => void;
}

export default function MarchandDetails({ marchandId, onBack }: MarchandDetailsProps) {
  const [marchand, setMarchand] = useState<Marchand | null>(null);
  const [stats, setStats] = useState<MarchandStats | null>(null);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'paiements' | 'places' | 'info'>('paiements');

  const marchandsService = new MarchandsService();

  useEffect(() => {
    loadData();
  }, [marchandId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [marchandData, statsData, paiementsData, placesData] = await Promise.all([
        marchandsService.getMarchandById(marchandId),
        marchandsService.getMarchandStats(marchandId),
        marchandsService.getPaiementsByMarchand(marchandId),
        marchandsService.getPlacesByMarchand(marchandId)
      ]);

      setMarchand(marchandData);
      setStats(statsData);
      setPaiements(paiementsData);
      setPlaces(placesData);
    } catch (error) {
      console.error('Erreur chargement détails:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(montant) + ' Ar';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatutColor = (statut?: string | null) => {
    const s = statut?.toLowerCase();
    if (s === 'occupee' || s === 'occupée') return '#10b981';
    if (s === 'disponible') return '#3b82f6';
    if (s === 'reservee' || s === 'réservée') return '#f59e0b';
    return '#6b7280';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!marchand) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Marchand introuvable</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails Marchand</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Carte d'identité */}
        <View style={styles.identityCard}>
          <View style={styles.identityHeader}>
            <View>
              <Text style={styles.identityName}>{marchand.nom}</Text>
              {marchand.prenom && <Text style={styles.identityPrenom}>{marchand.prenom}</Text>}
            </View>
            {marchand.statut_de_paiement && (
              <View style={[styles.statusBadge, { backgroundColor: '#10b981' }]}>
                <Text style={styles.statusText}>{marchand.statut_de_paiement}</Text>
              </View>
            )}
          </View>

          <View style={styles.identityInfo}>
            {marchand.telephone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📱</Text>
                <Text style={styles.infoText}>{marchand.telephone}</Text>
              </View>
            )}
            {marchand.cin && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🆔</Text>
                <Text style={styles.infoText}>{marchand.cin}</Text>
              </View>
            )}
            {marchand.nif && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📋</Text>
                <Text style={styles.infoText}>NIF: {marchand.nif}</Text>
              </View>
            )}
            {marchand.type_activite && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>💼</Text>
                <Text style={styles.infoText}>{marchand.type_activite}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Statistiques */}
        {stats && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatMontant(stats.montant_total)}</Text>
              <Text style={styles.statLabel}>Total payé</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.nombre_paiements}</Text>
              <Text style={styles.statLabel}>Paiements</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.nombre_places}</Text>
              <Text style={styles.statLabel}>Places</Text>
            </View>
          </View>
        )}

        {/* Onglets */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'paiements' && styles.tabActive]}
            onPress={() => setActiveTab('paiements')}
          >
            <Text style={[styles.tabText, activeTab === 'paiements' && styles.tabTextActive]}>
              Paiements ({paiements.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'places' && styles.tabActive]}
            onPress={() => setActiveTab('places')}
          >
            <Text style={[styles.tabText, activeTab === 'places' && styles.tabTextActive]}>
              Places ({places.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.tabActive]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
              Infos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenu des onglets */}
        <View style={styles.tabContent}>
          {activeTab === 'paiements' && (
            <View>
              {paiements.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>💰</Text>
                  <Text style={styles.emptyText}>Aucun paiement</Text>
                </View>
              ) : (
                paiements.map((paiement) => (
                  <View key={paiement.id} style={styles.paiementCard}>
                    <View style={styles.paiementHeader}>
                      <Text style={styles.paiementMontant}>{formatMontant(paiement.montant)}</Text>
                      <Text style={styles.paiementDate}>{formatDate(paiement.date_paiement)}</Text>
                    </View>
                    
                    {paiement.motif && (
                      <Text style={styles.paiementMotif}>{paiement.motif}</Text>
                    )}
                    
                    <View style={styles.paiementDetails}>
                      {paiement.type_paiement && (
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Type:</Text>
                          <Text style={styles.detailValue}>{paiement.type_paiement}</Text>
                        </View>
                      )}
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
                            {formatDateShort(paiement.date_debut)} - {formatDateShort(paiement.date_fin)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'places' && (
            <View>
              {places.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🪑</Text>
                  <Text style={styles.emptyText}>Aucune place</Text>
                </View>
              ) : (
                places.map((place) => (
                  <View key={place.id} style={styles.placeCard}>
                    <View style={styles.placeHeader}>
                      <Text style={styles.placeName}>{place.nom}</Text>
                      <View style={[styles.placeStatut, { backgroundColor: getStatutColor(place.statut) + '20' }]}>
                        <Text style={[styles.placeStatutText, { color: getStatutColor(place.statut) }]}>
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
                        <Text style={styles.placeDetail}>💰 {formatMontant(place.droit_annuel)}/an</Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'info' && (
            <View style={styles.infoContent}>
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionTitle}>Informations générales</Text>
                <View style={styles.infoItem}>
                  <Text style={styles.infoItemLabel}>Date d'inscription</Text>
                  <Text style={styles.infoItemValue}>
                    {marchand.date_inscription ? formatDate(marchand.date_inscription) : 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoItemLabel}>État</Text>
                  <Text style={styles.infoItemValue}>{marchand.etat || 'N/A'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoItemLabel}>STAT</Text>
                  <Text style={styles.infoItemValue}>{marchand.stat || 'N/A'}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280'
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 16
  },
  backButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  backBtn: {
    width: 60
  },
  backBtnText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '600'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  identityCard: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  identityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  identityName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827'
  },
  identityPrenom: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 4
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  identityInfo: {
    gap: 8
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 24
  },
  infoText: {
    fontSize: 15,
    color: '#4b5563'
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center'
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8
  },
  tabActive: {
    backgroundColor: '#2563eb'
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280'
  },
  tabTextActive: {
    color: 'white'
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280'
  },
  paiementCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  paiementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  paiementMontant: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981'
  },
  paiementDate: {
    fontSize: 12,
    color: '#6b7280'
  },
  paiementMotif: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 12
  },
  paiementDetails: {
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6'
  },
  detailItem: {
    flexDirection: 'row'
  },
  detailLabel: {
    fontSize: 13,
    color: '#9ca3af',
    width: 80
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '500'
  },
  placeCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  placeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  placeStatut: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  placeStatutText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  placeDetails: {
    gap: 6
  },
  placeDetail: {
    fontSize: 14,
    color: '#4b5563'
  },
  infoContent: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12
  },
  infoSection: {
    marginBottom: 16
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  infoItemLabel: {
    fontSize: 14,
    color: '#6b7280'
  },
  infoItemValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500'
  }
});