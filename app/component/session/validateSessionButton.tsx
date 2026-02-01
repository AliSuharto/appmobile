import { sessionService } from "@/app/core/services/sessionService";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface ValidateSessionButtonProps {
  sessionId: number;
  sessionName: string;
  onValidationSuccess: () => void;
}

export const ValidateSessionButton: React.FC<ValidateSessionButtonProps> = ({
  sessionId,
  sessionName,
  onValidationSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  const handleValidateSession = async () => {
    Alert.alert(
      "Mettre en validation",
      `Voulez-vous vraiment mettre la session "${sessionName}" en validation ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Confirmer",
          style: "default",
          onPress: async () => {
            try {
              setLoading(true);

              // Appel à l'API pour mettre en validation
              await sessionService.validateSession(sessionId);

              // Fermeture locale de la session
              await sessionService.closeSession(sessionId);

              // Notification de succès
              Alert.alert(
                "Succès",
                "La session a été mise en validation avec succès.",
                [
                  {
                    text: "OK",
                    onPress: onValidationSuccess,
                  },
                ],
              );
            } catch (error) {
              console.error("Erreur lors de la mise en validation:", error);
              Alert.alert(
                "Erreur",
                "Une erreur est survenue lors de la mise en validation de la session.",
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <TouchableOpacity
      style={[styles.validateButton, loading && styles.validateButtonDisabled]}
      onPress={handleValidateSession}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.validateButtonText}>En cours...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.validateButtonIcon}>✓</Text>
          <Text style={styles.validateButtonText}>Soumettre la session</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  validateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  validateButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  validateButtonIcon: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  validateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
