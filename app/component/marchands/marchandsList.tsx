import { Marchand, MarchandsService } from '@/app/core/services/marchandService';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface MarchandsListProps {
  onSelectMarchand: (marchand: Marchand) => void;
}

export default function MarchandsList({ onSelectMarchand }: MarchandsListProps) {
  const [marchands, setMarchands] = useState<Marchand[]>([]);
  const [filteredMarchands, setFilteredMarchands] = useState<Marchand[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'tous' | 'A_JOUR' | 'Endette' | 'RETARD_PROLONGER' | 'RETARD_LEGER' | 'RETARD_CRITIQUE' | 'RETARD_SIGNIFICATIF'>('tous');
  const [counts, setCounts] = useState<Record<string, number>>({});

  const marchandsService = new MarchandsService();

  useEffect(() => {
    loadMarchands();
    loadCounts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [marchands, searchQuery, selectedFilter]);

  const loadMarchands = async () => {
    try {
      setLoading(true);
      const data = await marchandsService.getAllMarchands();
      setMarchands(data);
    } catch (error) {
      console.error('Erreur chargement marchands:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCounts = async () => {
    try {
      const data = await marchandsService.countByStatut();
      setCounts(data);
    } catch (error) {
      console.error('Erreur chargement compteurs:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMarchands();
    await loadCounts();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...marchands];

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.nom?.toLowerCase().includes(query) ||
        m.prenom?.toLowerCase().includes(query) ||
        m.cin?.toLowerCase().includes(query) ||
        m.telephone?.toLowerCase().includes(query)
      );
    }

    // Filtre par statut - CORRIGÉ
    if (selectedFilter !== 'tous') {
      filtered = filtered.filter(m => {
        const statut = m.statut_de_paiement?.toUpperCase().trim();
        const filterUpper = selectedFilter.toUpperCase();
        
        // Comparaison exacte après normalisation
        return statut === filterUpper;
      });
    }

    setFilteredMarchands(filtered);
  };

  const formatMontant = (montant?: number) => {
    if (!montant) return '0 Ar';
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(montant) + ' Ar';
  };

  const formatDate = (date?: string | null) => {
    if (!date) return 'Aucun';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatutColor = (statut?: string | null) => {
    const s = statut?.toUpperCase();
    if (s === 'A_JOUR') return '#10b981';
    if (s === 'RETARD_LEGER') return '#f59e0b';
    if (s === 'RETARD_SIGNIFICATIF') return '#fb923c';
    if (s === 'RETARD_PROLONGER') return '#dc2626';
    if (s === 'RETARD_CRITIQUE') return '#7f1d1d';
    return '#6b7280';
  };

  const renderMarchandCard = ({ item }: { item: Marchand }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onSelectMarchand(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.nameContainer}>
          <Text style={styles.nom}>{item.nom}</Text>
          {item.prenom && <Text style={styles.prenom}>{item.prenom}</Text>}
        </View>
        <View style={[styles.statutBadge, { backgroundColor: getStatutColor(item.statut_de_paiement) + '20' }]}>
          <Text style={[styles.statutText, { color: getStatutColor(item.statut_de_paiement) }]}>
            {item.statut_de_paiement || 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Tel :</Text>
        <Text style={styles.infoText}>{item.telephone || 'N/A'}</Text>
      </View>

      {item.cin && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>CIN :</Text>
          <Text style={styles.infoText}>{item.cin}</Text>
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Places</Text>
          <Text style={styles.statValue}>{item.nombre_places || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total payé</Text>
          <Text style={styles.statValue}>{formatMontant(item.total_paiements)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Dernier paiement</Text>
          <Text style={styles.statValueSmall}>{formatDate(item.dernier_paiement)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ label, value, count }: { label: string; value: typeof selectedFilter; count?: number }) => (
    <TouchableOpacity
      style={[styles.filterBtn, selectedFilter === value && styles.filterBtnActive]}
      onPress={() => setSelectedFilter(value)}
      activeOpacity={0.7}
    >
      <View style={styles.filterContent}>
        <Text style={[styles.filterBtnText, selectedFilter === value && styles.filterBtnTextActive]} numberOfLines={1}>
          {label}
        </Text>
        {count !== undefined && (
          <View style={[styles.countBadge, selectedFilter === value && styles.countBadgeActive]}>
            <Text style={[styles.countBadgeText, selectedFilter === value && styles.countBadgeTextActive]}>
              {count}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Chargement des marchands...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête */}
      {/* <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>👥 Marchands</Text>
        <Text style={styles.headerSubtitle}>{marchands.length} marchand{marchands.length > 1 ? 's' : ''}</Text>
      </View> */}

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom, CIN, téléphone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres - SCROLLABLE HORIZONTALEMENT */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        style={styles.filtersScrollView}
      >
        <FilterButton label="Tous" value="tous" count={marchands.length} />
        <FilterButton label="À jour" value="A_JOUR" count={counts['A_JOUR'] || 0} />
        <FilterButton label="Retard Léger" value="RETARD_LEGER" count={counts['RETARD_LEGER'] || 0} />
        <FilterButton label="Retard Significatif" value="RETARD_SIGNIFICATIF" count={counts['RETARD_SIGNIFICATIF'] || 0} />
        <FilterButton label="Retard Prolongé" value="RETARD_PROLONGER" count={counts['RETARD_PROLONGER'] || 0} />
        <FilterButton label="Retard Critique" value="RETARD_CRITIQUE" count={counts['RETARD_CRITIQUE'] || 0} />
      </ScrollView>

      {/* Résumé */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {filteredMarchands.length} marchand{filteredMarchands.length > 1 ? 's' : ''} trouvé{filteredMarchands.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Liste */}
      <FlatList
        data={filteredMarchands}
        renderItem={renderMarchandCard}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Aucun marchand trouvé</Text>
            <Text style={styles.emptySubtext}>
              {selectedFilter !== 'tous' 
                ? `Aucun marchand avec le statut "${selectedFilter}"`
                : 'Essayez de modifier vos filtres'}
            </Text>
          </View>
        }
      />
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
  headerContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827'
  },
  clearIcon: {
    fontSize: 18,
    color: '#47443fff',
    paddingHorizontal: 8
  },
  filtersScrollView: {
    marginTop: 6,
    marginBottom: 10
  },
  filtersContainer: {
    paddingHorizontal: 10,
    gap: 15,
    flexDirection: 'row',
    paddingVertical: 4
  },
  filterBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3
  },
  filterContent: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textAlign: 'center'
  },
  filterBtnTextActive: {
    color: 'white'
  },
  countBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)'
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151'
  },
  countBadgeTextActive: {
    color: 'white'
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  summaryText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500'
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  nameContainer: {
    flex: 1
  },
  nom: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2
  },
  prenom: {
    fontSize: 16,
    color: '#6b7280'
  },
  statutBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  statutText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  infoLabel: {
    fontSize: 14,
    marginRight: 8
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563'
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6'
  },
  statItem: {
    flex: 1
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827'
  },
  statValueSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827'
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 32
  }
});