import { PaiementWithMarchand, Session } from '@/app/core/repositories/sessionRepository';
import { sessionService } from '@/app/core/services/sessionService';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


interface SessionDetailsProps {
  sessionId: number;
  onBack: () => void;
}

export const SessionDetails: React.FC<SessionDetailsProps> = ({ sessionId, onBack }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [paiements, setPaiements] = useState<PaiementWithMarchand[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessionDetails = async () => {
    try {
      setError(null);
      setLoading(true);

      const [sessionData, paiementsData, statsData] = await Promise.all([
        sessionService.getSessionById(sessionId),
        sessionService.getSessionPaiements(sessionId),
        sessionService.getSessionStatistics(sessionId)
      ]);

      setSession(sessionData);
      setPaiements(paiementsData);
      setStats(statsData);
    } catch (err) {
      setError('Erreur lors du chargement des détails');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessionDetails();
  }, [sessionId]);

  const renderPaiementItem = ({ item }: { item: PaiementWithMarchand }) => (
    <View style={styles.paiementCard}>
      <View style={styles.paiementHeader}>
        <View style={styles.marchandInfo}>
          <Text style={styles.marchandName}>
            {item.marchand_nom} {item.marchand_prenom || ''}
          </Text>
          <Text style={styles.paiementDate}>
            {sessionService.formatDate(item.date_paiement)}
          </Text>
        </View>
        <Text style={styles.montant}>
          {sessionService.formatMontant(item.montant)}
        </Text>
      </View>

      {item.type_paiement && (
        <View style={styles.paiementDetail}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>{item.type_paiement}</Text>
        </View>
      )}

      {item.motif && (
        <View style={styles.paiementDetail}>
          <Text style={styles.detailLabel}>Motif:</Text>
          <Text style={styles.detailValue}>{item.motif}</Text>
        </View>
      )}

      {item.date_debut && item.date_fin && (
        <View style={styles.paiementDetail}>
          <Text style={styles.detailLabel}>Période:</Text>
          <Text style={styles.detailValue}>
            {new Date(item.date_debut).toLocaleDateString('fr-FR')} - {new Date(item.date_fin).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement des détails...</Text>
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Session introuvable'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusBadge = sessionService.getStatusBadge(session.statut);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la session</Text>
      </View>

      {/* Session Info */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.sessionInfoCard}>
          <View style={styles.sessionTitleRow}>
            <Text style={styles.sessionTitle}>{session.nom}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(statusBadge.color) }]}>
              <Text style={styles.statusText}>{statusBadge.label}</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date d'ouverture</Text>
              <Text style={styles.infoValue}>
                {sessionService.formatDate(session.date_ouverture)}
              </Text>
            </View>

            {session.date_fermeture && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Date de fermeture</Text>
                <Text style={styles.infoValue}>
                  {sessionService.formatDate(session.date_fermeture)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Statistics */}
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.sectionTitle}>Statistiques</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.nombre_paiements}</Text>
                <Text style={styles.statLabel}>Paiements</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.nombre_marchands}</Text>
                <Text style={styles.statLabel}>Marchands</Text>
              </View>
              <View style={[styles.statItem, styles.statItemFull]}>
                <Text style={styles.statValue}>
                  {sessionService.formatMontant(stats.total_paiements)}
                </Text>
                <Text style={styles.statLabel}>Total collecté</Text>
              </View>
            </View>
          </View>
        )}

        {/* Paiements List */}
        <View style={styles.paiementsSection}>
          <Text style={styles.sectionTitle}>
            Liste des paiements ({paiements.length})
          </Text>
          
          {paiements.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun paiement dans cette session</Text>
            </View>
          ) : (
            <FlatList
              data={paiements}
              renderItem={renderPaiementItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.paiementsList}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const getStatusColor = (color: string): string => {
  const colors: { [key: string]: string } = {
    green: '#10B981',
    gray: '#6B7280',
    yellow: '#F59E0B',
    blue: '#3B82F6'
  };
  return colors[color] || colors.blue;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  backBtn: {
    marginBottom: 8
  },
  backBtnText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827'
  },
  scrollView: {
    flex: 1
  },
  sessionInfoCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sessionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  },
  infoGrid: {
    gap: 12
  },
  infoItem: {
    marginBottom: 8
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600'
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  statItem: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center'
  },
  statItemFull: {
    width: '100%'
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500'
  },
  paiementsSection: {
    marginHorizontal: 16,
    marginBottom: 16
  },
  paiementsList: {
    gap: 12
  },
  paiementCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  paiementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  marchandInfo: {
    flex: 1
  },
  marchandName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  paiementDate: {
    fontSize: 12,
    color: '#6B7280'
  },
  montant: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981'
  },
  paiementDetail: {
    flexDirection: 'row',
    marginBottom: 4
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginRight: 8
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280'
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  }
});