import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark';

interface Theme {
  dark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
  };
}

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
}

// Définition des couleurs pour chaque thème
const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#0144b8',
    background: '#ffffff',
    card: '#f8f9fa',
    text: '#000000',
    border: '#e0e0e0',
    notification: '#ff3b30',
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#4a9eff',
    background: '#121212',
    card: '#1e1e1e',
    text: '#ffffff',
    border: '#2c2c2c',
    notification: '#ff453a',
  },
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemTheme = Appearance.getColorScheme() ?? 'light';
  const [themeMode, setThemeMode] = useState<ThemeMode>(systemTheme);

  // Charger le thème sauvegardé au démarrage
  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.error('Erreur chargement thème:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    
    // Sauvegarder le choix
    try {
      await AsyncStorage.setItem('app_theme', newTheme);
      console.log('✅ Thème sauvegardé:', newTheme);
    } catch (error) {
      console.error('Erreur sauvegarde thème:', error);
    }
  };

  // Retourner l'objet complet avec les couleurs
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit être utilisé dans ThemeProvider');
  return ctx;
};