import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { QuittanceDetail } from '../../core/repositories/quittanceRepository';
import { quittanceService } from '../../core/services/quittanceService';

interface QuittancesDetailProps {
  quittanceId: number;
  onBack: () => void;
}

export const QuittancesDetail: React.FC<QuittancesDetailProps> = ({ quittanceId, onBack }) => {
  const [quittance, setQuittance] = useState<QuittanceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuittanceDetails();
  }, [quittanceId]);

  const loadQuittanceDetails = async () => {
    try {
      setLoading(true);
      const data = await quittanceService.getQuittanceDetails(quittanceId);
      setQuittance(data);
    } catch (error) {
      console.error('Erreur chargement détails:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la quittance');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!quittance) return;

    const newStatus = quittance.etat === 'DISPONIBLE' ? 'UTILISE' : 'DISPONIBLE';
    
    Alert.alert(
      'Confirmer',
      `Voulez-vous marquer cette quittance comme ${newStatus} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              if (newStatus === 'DISPONIBLE') {
                await quittanceService.marquerCommeDisponible(quittanceId);
              }
              await loadQuittanceDetails();
              Alert.alert('Succès', 'Statut mis à jour avec succès');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de modifier le statut');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!quittance) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Quittance introuvable</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButtonTop}>
          <Text style={styles.backButtonTopText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Détails de la Quittance</Text>
      </View>

      {/* Informations principales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations générales</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Nom:</Text>
          <Text style={styles.value}>{quittance.nom}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>État:</Text>
          <View style={[
            styles.statusBadge,
            quittance.etat === 'DISPONIBLE' ? styles.statusDisponible : styles.statusUtilise
          ]}>
            <Text style={styles.statusText}>{quittance.etat}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Date de création:</Text>
          <Text style={styles.value}>
            {quittanceService.formatDate(quittance.creation_date)}
          </Text>
        </View>

        {quittance.date_utilisation && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date d'utilisation:</Text>
            <Text style={styles.value}>
              {quittanceService.formatDate(quittance.date_utilisation)}
            </Text>
          </View>
        )}
      </View>

      {/* Informations du paiement */}
      {quittance.paiement_id && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations du paiement</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Montant:</Text>
              <Text style={[styles.value, styles.montant]}>
                {quittanceService.formatMontant(quittance.paiement_montant)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Type de paiement:</Text>
              <Text style={styles.value}>
                {quittance.paiement_type || 'N/A'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Date du paiement:</Text>
              <Text style={styles.value}>
                {quittanceService.formatDate(quittance.paiement_date)}
              </Text>
            </View>

            {quittance.place_nom && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Place:</Text>
                <Text style={styles.value}>{quittance.place_nom}</Text>
              </View>
            )}
          </View>

          {/* Informations du marchand */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations du marchand</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Nom complet:</Text>
              <Text style={styles.value}>
                {quittance.marchand_nom} {quittance.marchand_prenom}
              </Text>
            </View>

            {quittance.marchand_telephone && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Téléphone:</Text>
                <Text style={styles.value}>{quittance.marchand_telephone}</Text>
              </View>
            )}
          </View>

          {/* Informations de l'agent */}
          {quittance.agent_nom && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Agent ayant enregistré le paiement</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Agent:</Text>
                <Text style={styles.value}>
                  {quittance.agent_nom} {quittance.agent_prenom}
                </Text>
              </View>
            </View>
          )}
        </>
      )}

      {/* Pas de paiement associé */}
      {!quittance.paiement_id && quittance.etat === 'DISPONIBLE' && (
        <View style={styles.section}>
          <View style={styles.noPaymentContainer}>
            <Text style={styles.noPaymentText}>
              Cette quittance est disponible et n'a pas encore été utilisée pour un paiement.
            </Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsSection}>
        {quittance.etat === 'UTILISE' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonSecondary]} 
            onPress={handleChangeStatus}
          >
            <Text style={styles.actionButtonTextSecondary}>Marquer comme disponible</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonTop: {
    marginBottom: 10,
  },
  backButtonTopText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  montant: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDisponible: {
    backgroundColor: '#4CAF50',
  },
  statusUtilise: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  noPaymentContainer: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  noPaymentText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  actionsSection: {
    padding: 15,
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});