import { QuittancesDetail } from '@/app/component/quittance/quittancedetails';
import { QuittancesList } from '@/app/component/quittance/quittancelist';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export const QuittancesScreen: React.FC = () => {
  const [selectedQuittanceId, setSelectedQuittanceId] = useState<number | null>(null);

  const handleSelectQuittance = (quittanceId: number) => {
    setSelectedQuittanceId(quittanceId);
  };

  const handleBack = () => {
    setSelectedQuittanceId(null);
  };

  return (
    <View style={styles.container}>
      {selectedQuittanceId === null ? (
        <QuittancesList onSelectQuittance={handleSelectQuittance} />
      ) : (
        <QuittancesDetail 
          quittanceId={selectedQuittanceId} 
          onBack={handleBack} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default QuittancesScreen;