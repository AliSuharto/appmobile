import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ForgotPasswordModal from "../component/user/ForgotpasswordModal";
import { useAuth } from "../hooks/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const handleLogin = async () => {
    // Validation des champs
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erreur", "Veuillez entrer une adresse email valide");
      return;
    }

    setLoading(true);

    try {
      console.log("🔐 Tentative de connexion depuis LoginScreen...");

      // Utiliser la fonction login du contexte
      const result = await login(email.trim(), password);

      if (!result.success) {
        Alert.alert("Erreur", result.message || "Identifiants invalides");
      } else {
        // Connexion réussie - la navigation est gérée automatiquement par AuthContext
        console.log(
          "✅ Connexion réussie, attente de la navigation automatique...",
        );

        // Optionnel: Afficher un message de succès temporaire
        Alert.alert("Succès", result.message || "Connexion réussie");
      }
    } catch (error: any) {
      console.error("❌ Erreur lors de la connexion:", error);
      Alert.alert(
        "Erreur",
        error.message ||
          "Échec de la connexion. Vérifiez votre connexion internet.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSuccess = (newPassword: string) => {
    // Fermer le modal
    setShowForgotPasswordModal(false);

    // Pré-remplir le champ mot de passe avec le nouveau mot de passe
    setPassword(newPassword);

    // Message d'information
    Alert.alert(
      "✅ Mot de passe réinitialisé",
      "Votre nouveau mot de passe a été pré-rempli. Vous pouvez maintenant vous connecter.",
      [{ text: "OK" }],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Connexion</Text>

        <Text style={styles.subtitle}>
          Première connexion via internet, puis mode hors-ligne disponible
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.buttonText}>Connexion...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => setShowForgotPasswordModal(true)}
        >
          <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        {/* Section d'aide */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            💡 Après la première connexion, vous pourrez vous connecter même
            sans internet
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* Modal Mot de passe oublié */}
      <ForgotPasswordModal
        visible={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onSuccess={handleForgotPasswordSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FBFF", // Fond blanc-bleuté très clair
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#2C3E50", // Texte gris foncé
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 20,
    color: "#0e3b65", // Texte gris moyen
    opacity: 0.8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#FFFFFF", // Fond blanc
    borderColor: "#E1E8ED", // Bordure gris clair
    color: "#2C3E50", // Texte gris foncé
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#bab026", // Bleu ciel
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  forgotPassword: {
    marginTop: 16,
    alignItems: "center",
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0a4b78", // Bleu ciel
  },
  helpContainer: {
    marginTop: 32,
    padding: 16,
    alignItems: "center",
  },
  helpText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    color: "#0f151b", // Texte gris moyen
    opacity: 0.7,
  },
});
