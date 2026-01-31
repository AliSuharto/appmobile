import { syncService } from "@/app/core/services/synchronisation";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SyncScreen() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [needsSync, setNeedsSync] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>("");

  useEffect(() => {
    checkSyncStatus();
  }, []);

  const checkSyncStatus = async () => {
    try {
      const timestamp = await syncService.getLastSyncTimestamp();
      setLastSync(timestamp);

      const needsSyncCheck = await syncService.needsSync(24); // 24 heures
      setNeedsSync(needsSyncCheck);

      if (timestamp) {
        const date = new Date(timestamp);
        setSyncStatus(`Dernière sync: ${date.toLocaleString("fr-FR")}`);
      } else {
        setSyncStatus("Aucune synchronisation effectuée");
      }
    } catch (error) {
      console.error("Erreur lors de la vérification:", error);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus("Synchronisation en cours...");

    try {
      const result = await syncService.performSyncManuel();

      if (result.success) {
        Alert.alert("Succès", result.message, [
          { text: "OK", onPress: checkSyncStatus },
        ]);
      } else {
        Alert.alert("Erreur", result.message, [{ text: "OK" }]);
      }
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Une erreur est survenue lors de la synchronisation",
        [{ text: "OK" }],
      );
    } finally {
      setIsSyncing(false);
      await checkSyncStatus();
    }
  };

  const formatLastSyncTime = () => {
    if (!lastSync) return "Jamais synchronisé";

    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Il y a ${diffMins} minute${diffMins > 1 ? "s" : ""}`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
    } else {
      return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Synchronisation</Text>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>État</Text>
        <Text style={styles.statusText}>{syncStatus}</Text>
        <Text style={styles.timeAgo}>{formatLastSyncTime()}</Text>

        {needsSync && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>⚠️ Synchronisation recommandée</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, isSyncing && styles.buttonDisabled]}
        onPress={handleSync}
        disabled={isSyncing}
      >
        {isSyncing ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.buttonText}>Synchronisation...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>🔄 Synchroniser maintenant</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={checkSyncStatus}
      >
        <Text style={styles.secondaryButtonText}>Actualiser l'état</Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Information</Text>
        <Text style={styles.infoText}>
          La synchronisation télécharge toutes les données depuis le serveur et
          les enregistre dans la base de données locale.
        </Text>
        <Text style={styles.infoText}>
          Une synchronisation automatique est recommandée toutes les 24 heures.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  statusCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    marginBottom: 4,
  },
  timeAgo: {
    fontSize: 14,
    color: "#888",
  },
  badge: {
    backgroundColor: "#fff3cd",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  badgeText: {
    color: "#856404",
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: "#6c757d",
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: "#007bff",
    fontSize: 14,
    fontWeight: "600",
  },
  infoBox: {
    backgroundColor: "#e7f3ff",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#007bff",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#004085",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#004085",
    marginBottom: 6,
    lineHeight: 20,
  },
});
