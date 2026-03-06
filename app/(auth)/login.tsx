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
import Svg, { Line, Path } from "react-native-svg";
import ForgotPasswordModal from "../component/user/ForgotpasswordModal";
import { useAuth } from "../hooks/AuthContext";

// Icône œil ouvert (mot de passe visible)
const EyeOpenIcon = ({ color = "#999" }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Icône œil barré (mot de passe masqué)
const EyeOffIcon = ({ color = "#999" }: { color?: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.12 14.12a3 3 0 1 1-4.24-4.24"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1="1"
      y1="1"
      x2="23"
      y2="23"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erreur", "Veuillez entrer une adresse email valide");
      return;
    }

    setLoading(true);

    try {
      console.log("🔐 Tentative de connexion depuis LoginScreen...");
      const result = await login(email.trim(), password);

      if (!result.success) {
        Alert.alert("Erreur", result.message || "Identifiants invalides");
      } else {
        console.log(
          "✅ Connexion réussie, attente de la navigation automatique...",
        );
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
    setShowForgotPasswordModal(false);
    setPassword(newPassword);
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
          {" "}
          Veuillez entrer ci-dessous vos identifiants
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

        {/* Champ mot de passe avec icône SVG */}
        <View
          style={[
            styles.passwordContainer,
            passwordFocused && styles.passwordContainerFocused,
          ]}
        >
          <TextInput
            style={styles.passwordInput}
            placeholder="Mot de passe"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!loading}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
            activeOpacity={0.5}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <EyeOpenIcon color={passwordFocused ? "#0a4b78" : "#aab"} />
            ) : (
              <EyeOffIcon color={passwordFocused ? "#0a4b78" : "#aab"} />
            )}
          </TouchableOpacity>
        </View>

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
            💡 Première connexion via internet, puis mode hors-ligne disponible
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
    backgroundColor: "#F8FBFF",
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
    color: "#2C3E50",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
    color: "#0e3b65",
    opacity: 0.8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    borderColor: "#E1E8ED",
    color: "#2C3E50",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderColor: "#E1E8ED",
  },
  passwordContainerFocused: {
    borderColor: "#0a4b78",
    borderWidth: 1.5,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#2C3E50",
  },
  eyeButton: {
    paddingHorizontal: 14,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#bab026",
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
    color: "#0a4b78",
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
    color: "#0f151b",
    opacity: 0.7,
  },
});
