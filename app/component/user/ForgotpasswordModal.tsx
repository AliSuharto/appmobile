import { userRepository } from "@/app/core/repositories/userRepository";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (newPassword: string) => void;
}

export default function ForgotPasswordModal({
  visible,
  onClose,
  onSuccess,
}: ForgotPasswordModalProps) {
  const [loading, setLoading] = useState(false);

  // Champs du formulaire
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const resetForm = () => {
    setNom("");
    setPrenom("");
    setTelephone("");
    setEmail("");
    setRole("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    // Validation des champs
    if (!nom || !prenom || !email || !telephone || !role) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erreur", "Veuillez entrer une adresse email valide");
      return;
    }

    setLoading(true);

    try {
      // Importer le repository

      // Vérifier si l'utilisateur existe avec ces informations
      const result = await userRepository.resetPasswordWithVerification({
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim().toLowerCase(),
        telephone: telephone.trim(),
        role: role.trim(),
      });

      if (result.success && result.newPassword) {
        // Succès - afficher le nouveau mot de passe
        Alert.alert(
          "✅ Mot de passe réinitialisé",
          `Votre nouveau mot de passe est :\n\n${result.newPassword}\n\nVeuillez le noter et le changer après votre connexion.`,
          [
            {
              text: "OK",
              onPress: () => {
                resetForm();
                onSuccess(result.newPassword!);
              },
            },
          ],
          { cancelable: false },
        );
      } else {
        Alert.alert(
          "Erreur",
          result.message || "Aucun compte ne correspond à ces informations",
        );
      }
    } catch (error: any) {
      console.error("❌ Erreur lors de la réinitialisation:", error);
      Alert.alert(
        "Erreur",
        error.message || "Une erreur est survenue. Veuillez réessayer.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* En-tête */}
            <View style={styles.header}>
              <Text style={styles.title}>🔐 Réinitialiser le mot de passe</Text>
              <Text style={styles.subtitle}>
                Veuillez remplir vos informations pour vérifier votre identité
              </Text>
            </View>

            {/* Formulaire */}
            <View style={styles.form}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre nom"
                placeholderTextColor="#999"
                value={nom}
                onChangeText={setNom}
                autoCapitalize="words"
                editable={!loading}
              />

              <Text style={styles.label}>Prénom</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre prénom"
                placeholderTextColor="#999"
                value={prenom}
                onChangeText={setPrenom}
                autoCapitalize="words"
                editable={!loading}
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="votre.email@exemple.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                style={styles.input}
                placeholder="0123456789"
                placeholderTextColor="#999"
                value={telephone}
                onChangeText={setTelephone}
                keyboardType="phone-pad"
                editable={!loading}
              />

              <Text style={styles.label}>Rôle</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: directeur, regisseur, percepteur, utilisateur"
                placeholderTextColor="#999"
                value={role}
                onChangeText={setRole}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* Boutons */}
            <View style={styles.buttons}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" />
                    <Text style={styles.buttonText}>Vérification...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Réinitialiser</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                ℹ️ Si vos informations correspondent à un compte existant, un
                nouveau mot de passe sera généré automatiquement.
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    backgroundColor: "#F8FBFF", // Fond blanc-bleuté très clair
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#2C3E50", // Texte gris foncé
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    color: "#5A6C7D", // Texte gris moyen
    opacity: 0.8,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
    color: "#2C3E50", // Texte gris foncé
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#FFFFFF", // Fond blanc
    borderColor: "#E1E8ED", // Bordure gris clair
    color: "#2C3E50", // Texte gris foncé
  },
  buttons: {
    gap: 12,
  },
  button: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "#bab026", // Bleu ciel
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
    borderColor: "#E1E8ED", // Bordure gris clair
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C3E50", // Texte gris foncé
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#E8F4F8", // Bleu très clair
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    color: "#0f3d67", // Texte gris moyen
  },
});
