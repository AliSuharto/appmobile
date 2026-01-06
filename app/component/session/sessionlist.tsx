import { SessionWithStats } from '@/app/core/repositories/sessionRepository';
import { sessionService } from '@/app/core/services/sessionService';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';



interface SessionListProps {
  onSelectSession: (sessionId: number) => void;
}

export const SessionList: React.FC<SessionListProps> = ({ onSelectSession }) => {
  const [sessions, setSessions] = useState<SessionWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      setError(null);
      const data = await sessionService.getAllSessions();
      setSessions(data);
    } catch (err) {
      setError('Erreur lors du chargement des sessions');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  const renderSessionItem = ({ item }: { item: SessionWithStats }) => {
    const statusBadge = sessionService.getStatusBadge(item.statut);

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => onSelectSession(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionName}>{item.nom}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(statusBadge.color) }]}>
            <Text style={styles.statusText}>{statusBadge.label}</Text>
          </View>
        </View>

        <View style={styles.sessionInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date d'ouverture:</Text>
            <Text style={styles.infoValue}>
              {sessionService.formatDate(item.date_ouverture)}
            </Text>
          </View>

          {item.date_fermeture && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date de fermeture:</Text>
              <Text style={styles.infoValue}>
                {sessionService.formatDate(item.date_fermeture)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{item.nombre_paiements}</Text>
            <Text style={styles.statLabel}>Paiements</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {sessionService.formatMontant(item.total_paiements)}
            </Text>
            <Text style={styles.statLabel}>Total collecté</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Chargement des sessions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSessions}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  

  return (
    <View style={styles.container}>
      <FlatList
  data={sessions}
  renderItem={renderSessionItem}
  keyExtractor={(item) => item.id.toString()}
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
  contentContainerStyle={[
    styles.listContent,
    sessions.length === 0 && { flex: 1 }
  ]}
  ListEmptyComponent={
    <View style={styles.centerContainer}>
      <Text style={styles.emptyText}>Aucune session disponible</Text>
      <Text style={{ color: '#9CA3AF', marginTop: 8 }}>
        Glissez vers le bas pour rafraîchir
      </Text>
    </View>
  }
/>

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
  listContent: {
    padding: 16
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sessionName: {
    fontSize: 18,
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
  sessionInfo: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500'
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600'
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  statBox: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500'
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
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center'
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  }
});