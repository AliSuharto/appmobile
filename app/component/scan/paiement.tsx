import { SessionWithStats } from '@/app/core/repositories/sessionRepository';
import { sessionService } from '@/app/core/services/sessionService';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const BASE_URL_API = 'YOUR_API_BASE_URL'; // Remplacer par votre URL d'API

type TypePaiement = 'droit_annuel' | 'droit_place';

interface PaiementData {
  marchand_id: number;
  session_id: number;
  type_paiement: TypePaiement;
  montant: number;
}

export default function PaiementScreen() {
  const { marchandId } = useLocalSearchParams<{ marchandId: string }>();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<SessionWithStats | null>(null);
  const [typePaiement, setTypePaiement] = useState<TypePaiement>('droit_place');
  const [montant, setMontant] = useState('');

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      setLoading(true);
      const openSession = await sessionService.getOpenSessionWithStats();
      
      if (!openSession) {
        Alert.alert(
          'Aucune session ouverte',
          'Veuillez d\'abord ouvrir une session de paiement.',
          [
            {
              text: 'Retour',
              onPress: () => router.back(),
            },
          ]
        );
        return;
      }
      
      setSession(openSession);
    } catch (error) {
      console.error('Erreur lors du chargement de la session:', error);
      Alert.alert(
        'Erreur',
        'Impossible de charger la session ouverte',
        [
          {
            text: 'Retour',
            onPress: () => router.back(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!montant || parseFloat(montant) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }

    if (!session) {
      Alert.alert('Erreur', 'Aucune session active');
      return;
    }

    Alert.alert(
      'Confirmer le paiement',
      `Montant: ${formatMontant(parseFloat(montant))}\nType: ${typePaiement === 'droit_annuel' ? 'Droit annuel' : 'Droit de place'}`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Confirmer',
          onPress: () => submitPaiement(),
        },
      ]
    );
  };

  const submitPaiement = async () => {
    try {
      setSubmitting(true);

      const paiementData: PaiementData = {
        marchand_id: parseInt(marchandId),
        session_id: session!.id,
        type_paiement: typePaiement,
        montant: parseFloat(montant),
      };

      const response = await fetch(`${BASE_URL_API}/paiement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paiementData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'envoi du paiement');
      }

      const result = await response.json();

      Alert.alert(
        '✅ Paiement enregistré',
        'Le paiement a été enregistré avec succès',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du paiement:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors de l\'enregistrement du paiement'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'decimal', 
      minimumFractionDigits: 0 
    }).format(montant) + ' Ar';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau Paiement</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Session Info */}
        {session && (
          <View style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <MaterialIcons name="event" size={24} color="#2563eb" />
              <Text style={styles.sessionTitle}>Session active</Text>
            </View>
            <View style={styles.sessionInfo}>
              <View style={styles.sessionRow}>
                <Text style={styles.sessionLabel}>Session:</Text>
                <Text style={styles.sessionValue}>{session.nom}</Text>
              </View>
              <View style={styles.sessionRow}>
                <Text style={styles.sessionLabel}>Ouvert le:</Text>
                <Text style={styles.sessionValue}>{formatDate(session.date_ouverture)}</Text>
              </View>
              {session.stats && (
                <>
                  <View style={styles.sessionRow}>
                    <Text style={styles.sessionLabel}>Total collecté:</Text>
                    <Text style={[styles.sessionValue, styles.sessionAmount]}>
                      {formatMontant(session.stats.montant_total)}
                    </Text>
                  </View>
                  <View style={styles.sessionRow}>
                    <Text style={styles.sessionLabel}>Paiements:</Text>
                    <Text style={styles.sessionValue}>{session.stats.nombre_paiements}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Type de paiement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de paiement</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                typePaiement === 'droit_place' && styles.typeButtonActive,
              ]}
              onPress={() => setTypePaiement('droit_place')}
            >
              <MaterialIcons
                name="store"
                size={24}
                color={typePaiement === 'droit_place' ? '#2563eb' : '#64748b'}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  typePaiement === 'droit_place' && styles.typeButtonTextActive,
                ]}
              >
                Droit de place
              </Text>
              {typePaiement === 'droit_place' && (
                <View style={styles.checkmark}>
                  <MaterialIcons name="check-circle" size={20} color="#2563eb" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                typePaiement === 'droit_annuel' && styles.typeButtonActive,
              ]}
              onPress={() => setTypePaiement('droit_annuel')}
            >
              <MaterialIcons
                name="calendar-today"
                size={24}
                color={typePaiement === 'droit_annuel' ? '#2563eb' : '#64748b'}
              />
              <Text
                style={[
                  styles.typeButtonText,
                  typePaiement === 'droit_annuel' && styles.typeButtonTextActive,
                ]}
              >
                Droit annuel
              </Text>
              {typePaiement === 'droit_annuel' && (
                <View style={styles.checkmark}>
                  <MaterialIcons name="check-circle" size={20} color="#2563eb" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Montant */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Montant</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="payments" size={24} color="#64748b" />
            <TextInput
              style={styles.input}
              placeholder="Entrez le montant"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={montant}
              onChangeText={setMontant}
            />
            <Text style={styles.currency}>Ar</Text>
          </View>
          {montant && parseFloat(montant) > 0 && (
            <View style={styles.previewAmount}>
              <Text style={styles.previewLabel}>Montant à payer:</Text>
              <Text style={styles.previewValue}>{formatMontant(parseFloat(montant))}</Text>
            </View>
          )}
        </View>

        {/* Informations */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            Le paiement sera enregistré dans la session active et associé au marchand scanné.
          </Text>
        </View>
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => router.back()}
          disabled={submitting}
        >
          <Text style={styles.btnSecondaryText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnPrimary, submitting && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="check" size={24} color="#fff" />
              <Text style={styles.btnPrimaryText}>Enregistrer</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  sessionInfo: {
    gap: 10,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  sessionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  sessionAmount: {
    color: '#10b981',
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  typeContainer: {
    gap: 12,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  typeButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  typeButtonText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  typeButtonTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  checkmark: {
    marginLeft: 'auto',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
    padding: 0,
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  previewAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  previewLabel: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
  previewValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  actionBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});