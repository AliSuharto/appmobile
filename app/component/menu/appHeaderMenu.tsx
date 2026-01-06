import { useAuth } from '@/app/hooks/AuthContext';
import { useTheme } from '@/app/hooks/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AppHeaderMenu() {
  const router = useRouter();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const animation = useState(new Animated.Value(0))[0];

  const toggleMenu = () => {
    Animated.timing(animation, {
      toValue: open ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setOpen(!open);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              toggleMenu();
              await logout();
              // La navigation sera gérée automatiquement par AuthContext
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            }
          },
        },
      ]
    );
  };

  const handleThemeToggle = () => {
    toggleMenu();
    toggleTheme();
  };

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  // Détecter si le thème est sombre
  const isDark = theme.dark;

  return (
    <>
      {/* Overlay transparent pour fermer le menu - couvre tout l'écran */}
      {open && (
        <TouchableOpacity
          style={styles.fullScreenOverlay}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}

      <View style={styles.container}>
        <TouchableOpacity 
          onPress={toggleMenu}
          style={styles.menuButton}
        >
          <Ionicons 
            name="menu" 
            size={36} 
            color={theme.colors.primary}
          />
        </TouchableOpacity>

        {open && (
          <Animated.View
            style={[
              styles.menu,
              { 
                backgroundColor: theme.colors.card,
                opacity: animation, 
                transform: [{ translateY }] 
              },
            ]}
          >
            <TouchableOpacity
              style={styles.item}
              onPress={() => {
                toggleMenu();
                router.push('/component/menu/profile');
              }}
            >
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={theme.colors.text}
              />
              <Text style={[styles.text, { color: theme.colors.text }]}>
                Profil
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.item} 
              onPress={handleThemeToggle}
            >
              <Ionicons 
                name={isDark ? "sunny-outline" : "moon-outline"} 
                size={20} 
                color={theme.colors.text}
              />
              <Text style={[styles.text, { color: theme.colors.text }]}>
                {isDark ? 'Mode clair' : 'Mode sombre'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.item} 
              onPress={() => {
                toggleMenu();
                router.push('/component/menu/synchro');
              }}
            >
              <Ionicons 
                name= "sync-outline" 
                size={20} 
                color={theme.colors.text}
              />
              <Text style={[styles.text, { color: theme.colors.text }]}>
                Synchroniser
              </Text>
            </TouchableOpacity>

            <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity
              style={styles.item}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={20} color="#e81010ff" />
              <Text style={[styles.text, { color: '#e81010ff' }]}>
                Déconnexion
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 998,
  },
  container: {
    position: 'relative',
    zIndex: 999,
  },
  menuButton: {
    padding: 4,
    marginRight: 8,
  },
  menu: {
    position: 'absolute',
    top: 40,
    right: -8,
    borderRadius: 12,
    paddingVertical: 8,
    width: 180,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1000,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    marginVertical: 4,
    marginHorizontal: 12,
  },
});