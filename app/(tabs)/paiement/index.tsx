import { SessionWithStats } from '@/app/core/repositories/sessionRepository';
import { sessionService } from '@/app/core/services/sessionService';
import { BASE_URL_API } from '@/app/utilitaire/api';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
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


type TypePaiement = 'droit_annuel' | 'droit_place';

interface MarchandData {
  id: number;
  nom: string;
  statut: string;
  activite: string;
  place: string;
  telephone: string;
  dateDebut: string;
  dateFin: string;
  cin: string;
  nif: string;
  stat: string;
  montantPlace: string;
  montantAnnuel: string;
  motifPaiementAnnuel: string;
  motifPaiementPlace: string;
  totalPaiementRestant: string;
  totalPaiementEffectuer: string;
  frequencePaiement: string;
}

interface PaiementPayload {
  idAgent: number;
  idMarchand: number;
  place_id: number;
  numeroQuittance: string;
  modePaiement: string;
  sessionId: number;
  typePaiement: TypePaiement;
  montant: number;
}

export default function PaiementScreen() {
  const { cin } = useLocalSearchParams<{ cin: string }>();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<SessionWithStats | null>(null);
  const [marchand, setMarchand] = useState<MarchandData | null>(null);
  const [agentId, setAgentId] = useState<number | null>(null);
  const [typePaiement, setTypePaiement] = useState<TypePaiement>('droit_place');
  const [numeroQuittance, setNumeroQuittance] = useState('');
  const [modePaiement, setModePaiement] = useState('espece');
const [montantAffiche, setMontantAffiche] = useState(0);
const [motifAffiche, setMotifAffiche] = useState('');



  useEffect(() => {
    loadInitialData();
  }, []);

useEffect(() => {
  if (!marchand) return;

  if (typePaiement === 'droit_place') {
    setMontantAffiche(parseFloat(marchand.montantPlace) || 0);
    setMotifAffiche(marchand.motifPaiementPlace || 'Paiement de droit de place');
  } else {
    setMontantAffiche(parseFloat(marchand.montantAnnuel) || 0);
    setMotifAffiche(marchand.motifPaiementAnnuel || 'Paiement de droit annuel');
  }

  console.log("→ Mise à jour affichage", { type: typePaiement, montant: montantAffiche, motifAffiche });
}, [typePaiement, marchand]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Charger l'ID de l'agent
      const userDataString = await SecureStore.getItemAsync('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setAgentId(userData.id);
      }

      // Charger la session ouverte
      const openSession = await sessionService.getOpenSessionWithStats();
      
      if (!openSession) {
        Alert.alert(
          'Aucune session ouverte',
          'Veuillez d\'abord ouvrir une session de paiement.',
          [{ text: 'Retour', onPress: () => router.back() }]
        );
        return;
      }
      
      setSession(openSession);

      // Charger les données du marchand
      const marchandResponse = await fetch(`${BASE_URL_API}/public/marchands/cin/${cin}`);
      
      if (!marchandResponse.ok) {
        throw new Error('Marchand non trouvé');
      }

      const marchandData: MarchandData = await marchandResponse.json();
      console.log('Données du marchand:', marchandData);

      setMarchand(marchandData);

    } catch (error: any) {
      console.error('Erreur lors du chargement:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Impossible de charger les données',
        [{ text: 'Retour', onPress: () => router.back() }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Récupère le montant selon le type de paiement sélectionné
  const getMontant = (): number => {
    if (!marchand) return 0;
    if (typePaiement === 'droit_place') {
      return parseFloat(marchand.montantPlace) || 0;
    } else {
      return parseFloat(marchand.montantAnnuel) || 0;
    }
  };

  // Récupère le motif selon le type de paiement sélectionné
  const getMotif = (): string => {
    if (!marchand) return '';
    if (typePaiement === 'droit_place') {
      return marchand.motifPaiementPlace || 'Paiement de droit de place';
    } else {
      return marchand.motifPaiementAnnuel || 'Paiement de droit annuel';
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!numeroQuittance.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro de quittance');
      return;
    }

    if (!session || !marchand || !agentId) {
      Alert.alert('Erreur', 'Données manquantes');
      return;
    }

    const montant = getMontant();
    const motif = getMotif();

    Alert.alert(
      'Confirmer le paiement',
      `Marchand: ${marchand.nom}\n` +
      `Type: ${typePaiement === 'droit_annuel' ? 'Droit annuel' : 'Droit de place'}\n` +
      `Montant: ${formatMontant(montant)}\n` +
      `Motif: ${motif}\n` +
      `N° Quittance: ${numeroQuittance}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: () => submitPaiement() }
      ]
    );
  };

  const submitPaiement = async () => {
    try {
      setSubmitting(true);

      const paiementPayload: PaiementPayload = {
        idAgent: agentId!,
        idMarchand: marchand!.id,
        // place_id: parseInt(marchand!.place), // Assuming place is the ID
        numeroQuittance: numeroQuittance,
        // mode_paiement: modePaiement,
        sessionId: session!.id,
        typePaiement: typePaiement,
        // montant: getMontant(),
      };

      const response = await fetch(`${BASE_URL_API}/paiements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paiementPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'envoi du paiement');
      }

      Alert.alert(
        '✅ Paiement enregistré',
        'Le paiement a été enregistré avec succès',
        [{ text: 'OK', onPress: () => router.back() }]
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
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Chargement des données...</Text>
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Marchand Info */}
        {marchand && (
          <View style={styles.marchandCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="person" size={24} color="#2563eb" />
              <Text style={styles.cardTitle}>Informations Marchand</Text>
            </View>
            <View style={styles.marchandInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nom:</Text>
                <Text style={styles.infoValue}>{marchand.nom}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>CIN:</Text>
                <Text style={styles.infoValue}>{marchand.cin}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Activité:</Text>
                <Text style={styles.infoValue}>{marchand.activite}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Place:</Text>
                <Text style={styles.infoValue}>{marchand.place}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Statut:</Text>
                <View style={[styles.statusBadge, 
                  marchand.statut === 'actif' ? styles.statusActive : styles.statusInactive
                ]}>
                  <Text style={styles.statusText}>{marchand.statut}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Session Info */}
        {session && (
          <View style={styles.sessionCard}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="event" size={24} color="#10b981" />
              <Text style={styles.cardTitle}>Session active</Text>
            </View>
            <View style={styles.sessionInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Session:</Text>
                <Text style={styles.infoValue}>{session.nom}</Text>
              </View>
              {session.stats && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Total collecté:</Text>
                  <Text style={[styles.infoValue, styles.amountHighlight]}>
                    {formatMontant(session.stats.montant_total)}
                  </Text>
                </View>
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
                size={28}
                color={typePaiement === 'droit_place' ? '#2563eb' : '#64748b'}
              />
              <View style={styles.typeContent}>
                <Text
                  style={[
                    styles.typeButtonText,
                    typePaiement === 'droit_place' && styles.typeButtonTextActive,
                  ]}
                >
                  Droit de place
                </Text>
                <Text style={styles.typeMontant}>
                  {marchand && formatMontant(parseFloat(marchand.montantPlace) || 0)}
                </Text>
              </View>
              {typePaiement === 'droit_place' && (
                <MaterialIcons name="check-circle" size={24} color="#2563eb" />
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
                size={28}
                color={typePaiement === 'droit_annuel' ? '#2563eb' : '#64748b'}
              />
              <View style={styles.typeContent}>
                <Text
                  style={[
                    styles.typeButtonText,
                    typePaiement === 'droit_annuel' && styles.typeButtonTextActive,
                  ]}
                >
                  Droit annuel
                </Text>
                <Text style={styles.typeMontant}>
                  {marchand && formatMontant(parseFloat(marchand.montantAnnuel) || 0)}
                </Text>
              </View>
              {typePaiement === 'droit_annuel' && (
                <MaterialIcons name="check-circle" size={24} color="#2563eb" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Détails du paiement */}
        <View style={styles.detailsCard}>
  <View style={styles.detailRow}>
    <MaterialIcons name="description" size={20} color="#64748b" />
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>Motif</Text>
      <Text style={styles.detailValue}>{motifAffiche}</Text>
    </View>
  </View>

  <View style={styles.divider} />

  <View style={styles.detailRow}>
    <MaterialIcons name="payments" size={20} color="#64748b" />
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>Montant à payer</Text>
      <Text style={[styles.detailValue, styles.montantFinal]}>
  {formatMontant(montantAffiche)}
</Text>
    </View>
  </View>
</View>

        {/* Mode de paiement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mode de paiement</Text>
          <View style={styles.modeContainer}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                modePaiement === 'espece' && styles.modeButtonActive,
              ]}
              onPress={() => setModePaiement('espece')}
            >
              <MaterialIcons
                name="money"
                size={24}
                color={modePaiement === 'espece' ? '#2563eb' : '#64748b'}
              />
              <Text
                style={[
                  styles.modeText,
                  modePaiement === 'espece' && styles.modeTextActive,
                ]}
              >
                Espèces
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                modePaiement === 'cheque' && styles.modeButtonActive,
              ]}
              onPress={() => setModePaiement('cheque')}
            >
              <MaterialIcons
                name="receipt"
                size={24}
                color={modePaiement === 'cheque' ? '#2563eb' : '#64748b'}
              />
              <Text
                style={[
                  styles.modeText,
                  modePaiement === 'cheque' && styles.modeTextActive,
                ]}
              >
                Chèque
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                modePaiement === 'virement' && styles.modeButtonActive,
              ]}
              onPress={() => setModePaiement('virement')}
            >
              <MaterialIcons
                name="account-balance"
                size={24}
                color={modePaiement === 'virement' ? '#2563eb' : '#64748b'}
              />
              <Text
                style={[
                  styles.modeText,
                  modePaiement === 'virement' && styles.modeTextActive,
                ]}
              >
                Virement
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Numéro de quittance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Numéro de quittance *</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="receipt-long" size={24} color="#64748b" />
            <TextInput
              style={styles.input}
              placeholder="Entrez le numéro de quittance"
              placeholderTextColor="#94a3b8"
              value={numeroQuittance}
              onChangeText={setNumeroQuittance}
            />
          </View>
        </View>

        {/* Informations supplémentaires */}
        {marchand && (
          <View style={styles.infoCard}>
            <MaterialIcons name="info-outline" size={20} color="#3b82f6" />
            <View style={styles.infoCardContent}>
              <Text style={styles.infoCardTitle}>Historique de paiement</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Payé</Text>
                  <Text style={styles.statValue}>
                    {formatMontant(parseFloat(marchand.totalPaiementEffectuer) || 0)}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Restant</Text>
                  <Text style={[styles.statValue, styles.statRestant]}>
                    {formatMontant(parseFloat(marchand.totalPaiementRestant) || 0)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
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
  marchandCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  marchandInfo: {
    gap: 10,
  },
  sessionInfo: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusInactive: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  amountHighlight: {
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
  typeContent: {
    flex: 1,
    marginLeft: 12,
  },
  typeButtonText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  typeMontant: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 4,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  montantFinal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  modeButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  modeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  modeTextActive: {
    color: '#2563eb',
    fontWeight: '600',
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    gap: 12,
    marginBottom: 20,
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#3b82f6',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  statRestant: {
    color: '#f59e0b',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#bfdbfe',
    marginHorizontal: 12,
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