import LastAgentPaiements from "@/app/component/paiement/fiveLastPaiement";
import PaymentModal from "@/app/component/paiement/paiementManuel";
import PaymentModalSearch from "@/app/component/paiement/paiementModeSelector";
import {
  Marchand,
  rechercherMarchandParCIN,
} from "@/app/component/paiement/searchMarchand";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PaymentPage = () => {
  const [searchText, setSearchText] = useState("");
  const [marchand, setMarchand] = useState<Marchand | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔥 Deux modals séparés
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);

  const handleSearch = async () => {
    if (!searchText.trim()) {
      Alert.alert("Erreur", "Veuillez saisir un CIN");
      return;
    }

    try {
      setLoading(true);
      const data = await rechercherMarchandParCIN(searchText);
      setMarchand(data);
      setSearchModalVisible(true); // ✅ ouvrir modal recherche
    } catch (error) {
      console.error("Erreur recherche:", error);
      Alert.alert("Erreur", "Marchand introuvable");
      setMarchand(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Effectuer paiement</Text>

      {/* Recherche par CIN */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Entrer CIN"
          placeholderTextColor="#838181"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.buttonText}>
            {loading ? "..." : "Rechercher"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🔍 Modal paiement après recherche */}
      <PaymentModalSearch
        visible={searchModalVisible}
        marchand={marchand}
        onClose={() => setSearchModalVisible(false)}
      />

      {/* Bouton Scanner */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => router.push("/(tabs)/scan")}
      >
        <MaterialCommunityIcons
          name="qrcode-scan"
          size={22}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.buttonText}>Scanner</Text>
      </TouchableOpacity>

      <View style={styles.lastPaymentsContainer}>
        <Text style={styles.sectionTitle}>Derniers paiements</Text>
        <LastAgentPaiements />
      </View>

      {/* ➕ Bouton paiement manuel */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setManualModalVisible(true)}
      >
        <Text style={styles.plusIcon}>+</Text>
      </TouchableOpacity>

      {/* 💳 Modal paiement manuel */}
      <PaymentModal
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, marginTop: 20 },

  searchContainer: { flexDirection: "row", marginBottom: 20 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    justifyContent: "center",
  },

  buttonText: { color: "#fff", fontWeight: "bold" },

  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
  },
  scanButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 20,
  },

  lastPaymentsContainer: {
    marginTop: 10,
  },

  plusIcon: { color: "#fff", fontSize: 30, fontWeight: "bold" },
});

export default PaymentPage;
