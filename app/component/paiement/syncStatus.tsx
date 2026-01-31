import { BASE_URL_API } from "@/app/utilitaire/api";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface MarchandData {
  id: number;
  nom: string;
  cin: string;
  activite: string;
  place: string;
  statut: string;
  telephone: string;
  montantPlace: string;
  montantAnnuel: string;
}

interface RechercheProps {
  onMarchandFound: (marchand: MarchandData) => void;
  onCancel: () => void;
}

export default function RechercheMarchand({
  onMarchandFound,
  onCancel,
}: RechercheProps) {
  const [cin, setCin] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!cin.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un numéro CIN");
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `${BASE_URL_API}/public/marchands/cin/${cin.trim()}`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          Alert.alert(
            "Marchand introuvable",
            "Aucun marchand trouvé avec ce numéro CIN",
          );
        } else {
          throw new Error("Erreur lors de la recherche");
        }
        return;
      }

      const marchandData: MarchandData = await response.json();
      console.log("✅ Marchand trouvé:", marchandData);
      onMarchandFound(marchandData);
    } catch (error: any) {
      console.error("❌ Erreur recherche:", error);
      Alert.alert(
        "Erreur",
        error.message || "Impossible de rechercher le marchand",
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* <Text style={styles.title}>Rechercher un marchand</Text> */}
        <Text style={styles.subtitle}>Entrez le numéro CIN du marchand</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="badge" size={24} color="#64748b" />
          <TextInput
            style={styles.input}
            placeholder="Numéro CIN (ex: 101234567890)"
            placeholderTextColor="#94a3b8"
            value={cin}
            onChangeText={setCin}
            keyboardType="numeric"
            maxLength={12}
            autoFocus
            editable={!searching}
          />
          {cin.length > 0 && (
            <TouchableOpacity onPress={() => setCin("")}>
              <MaterialIcons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.hint}>
          <MaterialIcons name="info-outline" size={16} color="#64748b" />
          <Text style={styles.hintText}>
            Le numéro CIN doit comporter 12 chiffres
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.btnCancel}
          onPress={onCancel}
          disabled={searching}
        >
          <Text style={styles.btnCancelText}>Annuler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.btnSearch,
            (!cin.trim() || searching) && styles.btnDisabled,
          ]}
          onPress={handleSearch}
          disabled={!cin.trim() || searching}
        >
          {searching ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="search" size={24} color="#fff" />
              <Text style={styles.btnSearchText}>Rechercher</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Exemples de format */}
      <View style={styles.examples}>
        <Text style={styles.examplesTitle}>Format accepté :</Text>
        <View style={styles.exampleItem}>
          <MaterialIcons name="check-circle" size={16} color="#10b981" />
          <Text style={styles.exampleText}>101234567890</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 2,
  },
  header: {
    alignItems: "center",
    marginTop: 2,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 6,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  searchContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    marginLeft: 12,
    padding: 0,
  },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 4,
    gap: 6,
  },
  hintText: {
    fontSize: 13,
    color: "#64748b",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  btnCancel: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnCancelText: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
  },
  btnSearch: {
    flex: 1,
    backgroundColor: "#2b688b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#1c4569",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnSearchText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  examples: {
    backgroundColor: "#f1f5f9",
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
  },
  examplesTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 6,
  },
  exampleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  exampleText: {
    fontSize: 14,
    color: "#1e293b",
    fontFamily: "monospace",
  },
});
