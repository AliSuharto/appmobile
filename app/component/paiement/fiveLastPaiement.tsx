import {
  LastPaiementAgent,
  paiementRepository,
} from "@/app/core/repositories/paiementRepository";
import { quittanceService } from "@/app/core/services/quittanceService";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

const LastAgentPaiements = () => {
  const [agentId, setAgentId] = useState<number | null>(null);
  const [paiements, setPaiements] = useState<LastPaiementAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // ✅ Nouveau state

  useEffect(() => {
    const loadAgent = async () => {
      const userDataString = await SecureStore.getItemAsync("userData");
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setAgentId(userData.id);
      }
    };
    loadAgent();
  }, []);

  // ✅ Fonction de chargement des paiements (réutilisable)
  const loadPaiements = async () => {
    if (!agentId) return;

    try {
      const data = await paiementRepository.findLastFiveByAgent(agentId);
      setPaiements(data);
      console.log(data);
    } catch (e) {
      console.error("Erreur chargement paiements :", e);
    } finally {
      setLoading(false);
      setRefreshing(false); // ✅ Arrête le refresh
    }
  };

  useEffect(() => {
    loadPaiements();
  }, [agentId]);

  // ✅ Fonction appelée lors du pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadPaiements();
  };

  if (loading) {
    return <ActivityIndicator size="small" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={paiements}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1E90FF"]} // Couleur du spinner (Android)
            tintColor="#1E90FF" // Couleur du spinner (iOS)
          />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.dot} />

            <View style={{ flex: 1 }}>
              <Text style={styles.text}>
                Paiement de{" "}
                <Text style={styles.bold}>{item.marchandnom ?? "—"}</Text>, pour{" "}
                <Text style={styles.bold}>{item.motif ?? "—"}</Text>, montant{" "}
                <Text style={styles.bold}>
                  {item.montant.toLocaleString()} Ar
                </Text>
                , utilisant{" "}
                <Text style={styles.bold}>{item.numeroquittance ?? "—"}</Text>
              </Text>

              <Text style={styles.date}>
                {quittanceService.formatDate(item.date_paiement)}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default LastAgentPaiements;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    marginBottom: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1E90FF",
    marginTop: 6,
    marginRight: 10,
  },
  text: {
    fontSize: 14,
    color: "#333",
  },
  bold: {
    fontWeight: "600",
  },
  date: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
});
