import { SessionDetails } from '@/app/component/session/sessiondetails';
import { SessionList } from '@/app/component/session/sessionlist';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';


export default function SessionsScreen() {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  const handleSelectSession = (sessionId: number) => {
    setSelectedSessionId(sessionId);
  };

  const handleBack = () => {
    setSelectedSessionId(null);
  };

  return (
    <View style={styles.container}>
      {selectedSessionId === null ? (
        <SessionList onSelectSession={handleSelectSession} />
      ) : (
        <SessionDetails sessionId={selectedSessionId} onBack={handleBack} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  }
});