import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-get-random-values';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initDatabase } from './core/database/migration';
import { AuthProvider, useAuth } from './hooks/AuthContext';
import { ThemeProvider } from './hooks/ThemeContext';

function RootLayoutNav() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      {/* Écran de paiement en modal */}
      <Stack.Screen 
        name="paiement" 
        options={{ 
          presentation: 'modal',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setIsReady(true))
      .catch((error) => {
        console.error('Database init error:', error);
        setIsReady(true);
      });
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaView>
  );
}