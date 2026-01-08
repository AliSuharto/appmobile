import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
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
    View
} from 'react-native';
import { createSession } from './sessionApi';

interface CreateSessionModalProps {
  visible: boolean;
  onClose: () => void;
  onSessionCreated: () => void;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  visible,
  onClose,
  onSessionCreated
}) => {
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }

    else {
     
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getUserId = async (): Promise<number | null> => {
  try {
    const userDataString = await SecureStore.getItemAsync('userData');

    if (!userDataString) {
      return null;
    }

    const userData = JSON.parse(userDataString);
    return userData.id ?? null;
  } catch (error) {
    console.error('Erreur récupération userId:', error);
    return null;
  }
};

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
     

      await createSession({
        nomSession: nom.trim(),
        userId: await getUserId(), // Remplacez par l'ID réel de l'utilisateur connecté
      });

      // Réinitialiser le formulaire
      setNom('');
      setErrors({});

      // Notifier le parent et fermer le modal
      onSessionCreated();

      Alert.alert('Succès', 'La session a été créée avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors de la création de la session'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setNom('');
      setErrors({});
      onClose();
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nouvelle Session</Text>
            <TouchableOpacity
              onPress={handleClose}
              disabled={loading}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            {/* Nom de la session */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nom de la session <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.nom && styles.inputError]}
                value={nom}
                onChangeText={(text) => {
                  setNom(text);
                  if (errors.nom) {
                    setErrors({ ...errors, nom: '' });
                  }
                }}
                placeholder="Ex: Session Janvier 2025"
                placeholderTextColor="#9CA3AF"
                editable={!loading}
              />
              {errors.nom && <Text style={styles.errorText}>{errors.nom}</Text>}
            </View>

            
          </ScrollView>

          {/* Boutons d'action */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Créer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827'
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600'
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8
  },
  required: {
    color: '#EF4444'
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827'
  },
  inputError: {
    borderColor: '#EF4444'
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280'
  },
  submitButton: {
    backgroundColor: '#007AFF'
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  }
});