import { useAuth } from "@/app/hooks/AuthContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function AppHeaderMenu() {
  const router = useRouter();
  const { logout } = useAuth();

  const [open, setOpen] = useState(false);
  const animation = useState(new Animated.Value(0))[0];

  const toggleMenu = () => {
    if (!open) {
      setOpen(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setOpen(false));
    }
  };

  const closeMenu = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setOpen(false));
  };

  const handleLogout = async () => {
    Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se déconnecter",
        style: "destructive",
        onPress: async () => {
          try {
            closeMenu();
            await logout();
          } catch (error) {
            Alert.alert("Erreur", "Impossible de se déconnecter");
          }
        },
      },
    ]);
  };

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  return (
    <>
      {/* Modal transparent pour détecter les clics en dehors */}
      <Modal
        visible={open}
        transparent={true}
        animationType="none"
        onRequestClose={closeMenu}
      >
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.menu,
                  {
                    opacity: animation,
                    transform: [{ translateY }],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    closeMenu();
                    router.push("/(tabs)/(_menu)/profile");
                  }}
                >
                  <Ionicons name="person-outline" size={20} color="#333" />
                  <Text style={styles.text}>Profil</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    closeMenu();
                    router.push("/(tabs)/(_menu)/note");
                  }}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color="#333"
                  />
                  <Text style={styles.text}>Note</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    closeMenu();
                    router.push("/(tabs)/(_menu)/synchro");
                  }}
                >
                  <Ionicons name="sync-outline" size={20} color="#333" />
                  <Text style={styles.text}>Synchroniser</Text>
                </TouchableOpacity>

                <View style={styles.separator} />

                <TouchableOpacity style={styles.item} onPress={handleLogout}>
                  <MaterialIcons name="logout" size={20} color="#e81010ff" />
                  <Text style={[styles.text, { color: "#e81010ff" }]}>
                    Déconnexion
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View style={styles.container}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Ionicons name="menu" size={26} color="#333" />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  container: {
    position: "relative",
    marginRight: 4,
  },
  menuButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    marginTop: 60, // Position en dessous du header
    marginRight: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8,
    width: 190,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  text: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  separator: {
    height: 1,
    marginVertical: 6,
    marginHorizontal: 12,
    backgroundColor: "#e0e0e0",
  },
});
