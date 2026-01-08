import MarchandDetails from '@/app/component/marchands/marchandDetails';
import MarchandsList from '@/app/component/marchands/marchandsList';

import { Marchand } from '@/app/core/services/marchandService';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';


export default function MarchandsScreen() {
  const [selectedMarchandId, setSelectedMarchandId] = useState<number | null>(null);

  const handleSelectMarchand = (marchand: Marchand) => {
    setSelectedMarchandId(marchand.id);
  };

  const handleBack = () => {
    setSelectedMarchandId(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {selectedMarchandId ? (
        <MarchandDetails 
          marchandId={selectedMarchandId}
          onBack={handleBack}
        />
      ) : (
        <MarchandsList 
          onSelectMarchand={handleSelectMarchand}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6'
  }
});