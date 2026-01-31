import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Quittance } from "../../core/repositories/quittanceRepository";
import { quittanceService } from "../../core/services/quittanceService";

interface QuittancesListProps {
  onSelectQuittance: (quittanceId: number) => void;
}

export const QuittancesList: React.FC<QuittancesListProps> = ({
  onSelectQuittance,
}) => {
  const [quittances, setQuittances] = useState<Quittance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "TOUS" | "DISPONIBLE" | "UTILISE"
  >("TOUS");
  const [stats, setStats] = useState({ total: 0, disponibles: 0, utilises: 0 });

  useEffect(() => {
    loadQuittances();
    loadStats();
  }, [selectedFilter, searchQuery]);

  const loadQuittances = async () => {
    try {
      setLoading(true);
      const filters: any = {};

      if (selectedFilter !== "TOUS") {
        filters.etat = selectedFilter;
      }

      if (searchQuery.trim() !== "") {
        filters.searchQuery = searchQuery;
      }

      const data = await quittanceService.getAllQuittances(filters);
      setQuittances(data);
    } catch (error) {
      console.error("Erreur chargement quittances:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      console.log("🔄 Refresh déclenché");

      await loadQuittances();
      await loadStats();
    } catch (error) {
      console.error("Erreur refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await quittanceService.getStatistiques();
      setStats(statsData);
    } catch (error) {
      console.error("Erreur chargement statistiques:", error);
    }
  };

  const renderQuittanceItem = ({ item }: { item: Quittance }) => (
    <TouchableOpacity
      style={styles.quittanceCard}
      onPress={() => onSelectQuittance(item.id)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.quittanceName}>{item.nom}</Text>
        <View
          style={[
            styles.badge,
            item.etat === "DISPONIBLE"
              ? styles.badgeDisponible
              : styles.badgeUtilise,
          ]}
        >
          <Text style={styles.badgeText}>{item.etat}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <Text style={styles.detailLabel}>Créée le:</Text>
        <Text style={styles.detailValue}>
          {quittanceService.formatDate(item.creation_date)}
        </Text>
      </View>

      {item.date_utilisation && (
        <View style={styles.cardDetails}>
          <Text style={styles.detailLabel}>Utilisée le:</Text>
          <Text style={styles.detailValue}>
            {quittanceService.formatDate(item.date_utilisation)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.statDisponible]}>
            {stats.disponibles}
          </Text>
          <Text style={styles.statLabel}>Disponibles</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.statUtilise]}>
            {stats.utilises}
          </Text>
          <Text style={styles.statLabel}>Utilisées</Text>
        </View>
      </View>

      {/* Barre de recherche */}
      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher une quittance..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Filtres */}
      <View style={styles.filterContainer}>
        {(["TOUS", "DISPONIBLE", "UTILISE"] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === filter && styles.filterButtonTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste des quittances */}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={quittances}
          renderItem={renderQuittanceItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucune quittance trouvée</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  statCard: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  statDisponible: {
    color: "#4CAF50",
  },
  statUtilise: {
    color: "#FF9800",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  searchInput: {
    backgroundColor: "#fff",
    margin: 15,
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    marginBottom: 15,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#007AFF",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#007AFF",
  },
  filterButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  listContainer: {
    padding: 15,
  },
  quittanceCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  quittanceName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeDisponible: {
    backgroundColor: "#4CAF50",
  },
  badgeUtilise: {
    backgroundColor: "#FF9800",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  cardDetails: {
    marginTop: 5,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    marginTop: 2,
  },
  loader: {
    marginTop: 50,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});
