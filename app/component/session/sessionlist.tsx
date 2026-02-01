import { SessionWithStats } from "@/app/core/repositories/sessionRepository";
import { sessionService } from "@/app/core/services/sessionService";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CreateSessionModal } from "./createSessionModal";
import { ValidateSessionButton } from "./validateSessionButton";

interface SessionListProps {
  onSelectSession: (sessionId: number) => void;
}

type SessionStatus =
  | "TOUS"
  | "OUVERTE"
  | "EN_VALIDATION"
  | "VALIDEE"
  | "FERMEE"
  | "REJETEE";

const STATUS_FILTERS: { value: SessionStatus; label: string }[] = [
  { value: "TOUS", label: "Tous" },
  { value: "OUVERTE", label: "Ouverte" },
  { value: "EN_VALIDATION", label: "En validation" },
  { value: "VALIDEE", label: "Validée" },
  { value: "FERMEE", label: "Fermée" },
  { value: "REJETEE", label: "Rejetée" },
];

export const SessionList: React.FC<SessionListProps> = ({
  onSelectSession,
}) => {
  const [sessions, setSessions] = useState<SessionWithStats[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionWithStats[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [searchDate, setSearchDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<SessionStatus>("TOUS");

  // État pour le champ de recherche
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchWidthAnim = useRef(new Animated.Value(0)).current;

  // État pour le modal de création
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const loadSessions = async () => {
    try {
      setError(null);
      const data = await sessionService.getAllSessions();
      setSessions(data);
      applyFilters(data, searchDate, selectedStatus);
    } catch (err) {
      setError("Erreur lors du chargement des sessions");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Animation du champ de recherche
  useEffect(() => {
    Animated.timing(searchWidthAnim, {
      toValue: isSearchExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isSearchExpanded]);

  // Appliquer les filtres
  const applyFilters = (
    data: SessionWithStats[],
    dateSearch: string,
    status: SessionStatus,
  ) => {
    let filtered = [...data];

    // Filtre par date
    if (dateSearch.trim()) {
      filtered = filtered.filter((session) => {
        const dateOuverture = session.date_ouverture
          ? new Date(session.date_ouverture).toLocaleDateString("fr-FR")
          : "";
        const dateFermeture = session.date_fermeture
          ? new Date(session.date_fermeture).toLocaleDateString("fr-FR")
          : "";

        return (
          dateOuverture.includes(dateSearch) ||
          dateFermeture.includes(dateSearch) ||
          session.nom.toLowerCase().includes(dateSearch.toLowerCase())
        );
      });
    }

    // Filtre par statut
    if (status !== "TOUS") {
      filtered = filtered.filter(
        (session) => session.statut.toUpperCase() === status,
      );
    }

    setFilteredSessions(filtered);
  };

  // Gestion du changement de date
  const handleDateChange = (text: string) => {
    setSearchDate(text);
    applyFilters(sessions, text, selectedStatus);
  };

  // Gestion du changement de statut
  const handleStatusChange = (status: SessionStatus) => {
    setSelectedStatus(status);
    applyFilters(sessions, searchDate, status);
  };

  // Gestion du scroll pour fermer la recherche
  const handleScroll = () => {
    if (isSearchExpanded && !searchDate) {
      setIsSearchExpanded(false);
    }
  };

  // Toggle du champ de recherche
  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };

  useEffect(() => {
    applyFilters(sessions, searchDate, selectedStatus);
  }, [sessions]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  const handleSessionCreated = () => {
    setIsCreateModalVisible(false);
    loadSessions(); // Recharger les sessions après création
  };

  const handleValidationSuccess = () => {
    loadSessions(); // Recharger les sessions après mise en validation
  };

  const renderSessionItem = ({ item }: { item: SessionWithStats }) => {
    const statusBadge = sessionService.getStatusBadge(item.statut);
    const isOpenSession = item.statut.toUpperCase() === "OUVERTE";

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => onSelectSession(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionName}>{item.nom}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(statusBadge.color) },
            ]}
          >
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

        {/* Bouton de validation - affiché uniquement pour les sessions ouvertes */}
        {isOpenSession && (
          <ValidateSessionButton
            sessionId={item.id}
            sessionName={item.nom}
            onValidationSuccess={handleValidationSuccess}
          />
        )}
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
      {/* Header avec recherche et bouton création */}
      <View style={styles.headerContainer}>
        {!isSearchExpanded ? (
          <>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={toggleSearch}
              activeOpacity={0.7}
            >
              <Text style={styles.searchButtonIcon}>🔍</Text>
              <Text style={styles.searchButtonText}>Rechercher</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setIsCreateModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.createButtonIcon}>+</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.searchExpandedContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par date ou nom..."
              value={searchDate}
              onChangeText={handleDateChange}
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            <TouchableOpacity
              style={styles.closeSearchButton}
              onPress={() => {
                setSearchDate("");
                setIsSearchExpanded(false);
              }}
            >
              <Text style={styles.closeSearchIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Filtre par statut */}
      <View style={styles.statusFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusScrollContent}
        >
          {STATUS_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.statusFilterButton,
                selectedStatus === filter.value &&
                  styles.statusFilterButtonActive,
              ]}
              onPress={() => handleStatusChange(filter.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  selectedStatus === filter.value &&
                    styles.statusFilterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste des sessions */}
      <FlatList
        data={filteredSessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id.toString()}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          styles.listContent,
          filteredSessions.length === 0 && { flex: 1 },
        ]}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              {searchDate || selectedStatus !== "TOUS"
                ? "Aucune session ne correspond aux filtres"
                : "Aucune session disponible"}
            </Text>
            <Text style={{ color: "#9CA3AF", marginTop: 8 }}>
              Glissez vers le bas pour rafraîchir
            </Text>
          </View>
        }
      />

      {/* Modal de création */}
      <CreateSessionModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSessionCreated={handleSessionCreated}
      />
    </View>
  );
};

const getStatusColor = (color: string): string => {
  const colors: { [key: string]: string } = {
    green: "#10B981",
    gray: "#6B7280",
    yellow: "#F59E0B",
    blue: "#3B82F6",
    red: "#EF4444",
  };
  return colors[color] || colors.blue;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  headerContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchButtonIcon: {
    fontSize: 18,
  },
  searchButtonText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  createButtonIcon: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  searchExpandedContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  closeSearchButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  closeSearchIcon: {
    fontSize: 18,
    color: "#6B7280",
    fontWeight: "600",
  },
  statusFilterContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statusScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  statusFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statusFilterButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  statusFilterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  statusFilterTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  sessionInfo: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statBox: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
