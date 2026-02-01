import { paiementRepository } from "@/app/core/repositories/paiementRepository";
import { User, UserStats } from "@/app/core/repositories/userRepository";
import { userService } from "@/app/core/services/userService";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export const UserProfileScreen: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentPaiements, setRecentPaiements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Récupération de l'ID utilisateur depuis SecureStore au montage du composant
  useEffect(() => {
    const loadStoredUserId = async () => {
      try {
        const userDataJson = await SecureStore.getItemAsync("userData");
        if (userDataJson) {
          const userData = JSON.parse(userDataJson);
          const id = parseInt(userData.id, 10);
          if (!isNaN(id)) {
            setUserId(id);
          } else {
            Alert.alert(
              "Erreur",
              "ID utilisateur invalide dans les données stockées.",
            );
            setLoading(false);
          }
        } else {
          Alert.alert(
            "Erreur",
            "Aucune donnée utilisateur trouvée. Veuillez vous reconnecter.",
          );
          setLoading(false);
        }
      } catch (error) {
        console.error("Erreur lors de la lecture de SecureStore :", error);
        Alert.alert(
          "Erreur",
          "Impossible de récupérer les données utilisateur.",
        );
        setLoading(false);
      }
    };

    loadStoredUserId();
  }, []);

  // Chargement des données du profil une fois que l'ID est disponible
  useEffect(() => {
    if (userId === null) return;

    const loadUserData = async () => {
      try {
        setLoading(true);
        const [userData, userStats, paiements] = await Promise.all([
          userService.getUserById(userId),
          userService.getUserStatistics(userId),
          paiementRepository.findLastFiveByAgent(userId),
        ]);

        setUser(userData);
        setStats(userStats);
        setRecentPaiements(paiements);
      } catch (error) {
        console.error("Erreur chargement profil:", error);
        Alert.alert("Erreur", "Impossible de charger le profil utilisateur");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId]);

  // Fonction pour actualiser avec pull-to-refresh
  const onRefresh = async () => {
    if (!userId) return;
    try {
      setRefreshing(true);
      const [userData, userStats, paiements] = await Promise.all([
        userService.getUserById(userId),
        userService.getUserStatistics(userId),
        paiementRepository.findLastFiveByAgent(userId),
      ]);

      setUser(userData);
      setStats(userStats);
      setRecentPaiements(paiements);
    } catch (error) {
      console.error("Erreur lors de l'actualisation :", error);
      Alert.alert("Erreur", "Échec de l'actualisation du profil");
    } finally {
      setRefreshing(false);
    }
  };

  // Fonction pour actualiser manuellement (bouton)
  const handleRefresh = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [userData, userStats, paiements] = await Promise.all([
        userService.getUserById(userId),
        userService.getUserStatistics(userId),
        paiementRepository.findLastFiveByAgent(userId),
      ]);

      setUser(userData);
      setStats(userStats);
      setRecentPaiements(paiements);
    } catch (error) {
      console.error("Erreur lors de l'actualisation :", error);
      Alert.alert("Erreur", "Échec de l'actualisation du profil");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loaderText}>Chargement du profil...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Utilisateur introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#007AFF"]}
          tintColor="#007AFF"
        />
      }
    >
      {/* Header avec avatar + nom + rôle */}
      <View style={styles.header}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: userService.getRoleColor(user.role) },
          ]}
        >
          <Text style={styles.avatarText}>{userService.getInitials(user)}</Text>
        </View>
        <Text style={styles.userName}>{userService.getFullName(user)}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
        </View>
      </View>

      {/* Email et Téléphone sur une seule ligne */}
      <View style={styles.contactSection}>
        <View style={styles.contactItem}>
          <Text style={styles.contactLabel}>Email :</Text>
          <Text style={styles.contactValue}>{user.email}</Text>
        </View>

        {user.telephone && (
          <View style={styles.contactItem}>
            <Text style={styles.contactLabel}>Téléphone :</Text>
            <Text style={styles.contactValue}>{user.telephone}</Text>
          </View>
        )}
      </View>

      {/* Statistiques */}
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>💰</Text>
              </View>
              <Text style={styles.statValue}>
                {userService.formatMontant(stats.montantTotalCollecte)}
              </Text>
              <Text style={styles.statLabel}>Montant collecté</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>📝</Text>
              </View>
              <Text style={styles.statValue}>
                {stats.totalPaiementsEnregistres}
              </Text>
              <Text style={styles.statLabel}>Paiements enregistrés</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>🔄</Text>
              </View>
              <Text style={styles.statValue}>
                {stats.nombreSessionsActives}
              </Text>
              <Text style={styles.statLabel}>Sessions actives</Text>
            </View>

            {stats.dernierPaiementDate && (
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>⏱️</Text>
                </View>
                <Text style={styles.statValue}>
                  {userService.formatDateShort(stats.dernierPaiementDate)}
                </Text>
                <Text style={styles.statLabel}>Dernier paiement</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Derniers paiements */}
      {recentPaiements.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Derniers paiements enregistrés
          </Text>

          {recentPaiements.map((paiement) => (
            <View key={paiement.id} style={styles.paiementCard}>
              <View style={styles.paiementHeader}>
                <Text style={styles.paiementMarchand}>
                  {paiement.marchandnom}
                </Text>
                <Text style={styles.paiementMontant}>
                  {userService.formatMontant(paiement.montant)}
                </Text>
              </View>
              <View style={styles.paiementFooter}>
                <Text style={styles.paiementType}>
                  {paiement.motif || "N/A"}
                </Text>
                <Text style={styles.paiementDate}>
                  {userService.formatDateShort(paiement.date_paiement)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton} onPress={handleRefresh}>
          <Text style={styles.actionButtonText}>🔄 Actualiser</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  // Nouvelle section pour Email et Téléphone
  contactSection: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contactItem: {
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },

  section: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  paiementCard: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  paiementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  paiementMarchand: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  paiementMontant: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  paiementFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  paiementType: {
    fontSize: 12,
    color: "#666",
  },
  paiementDate: {
    fontSize: 12,
    color: "#666",
  },
  actionsSection: {
    padding: 15,
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default UserProfileScreen;
