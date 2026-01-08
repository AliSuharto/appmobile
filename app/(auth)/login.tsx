import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../hooks/AuthContext';
import { useTheme } from '../hooks/useTheme';

export default function LoginScreen() {
  const { login } = useAuth();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validation des champs
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Tentative de connexion depuis LoginScreen...');
      
      // Utiliser la fonction login du contexte
      const result = await login(email.trim(), password);

      if (!result.success) {
        Alert.alert('Erreur', result.message || 'Identifiants invalides');
      } else {
        // Connexion réussie - la navigation est gérée automatiquement par AuthContext
        console.log('✅ Connexion réussie, attente de la navigation automatique...');
        
        // Optionnel: Afficher un message de succès temporaire
        Alert.alert('Succès', result.message || 'Connexion réussie');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la connexion:', error);
      Alert.alert(
        'Erreur', 
        error.message || 'Échec de la connexion. Vérifiez votre connexion internet.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Connexion
        </Text>

        <Text style={[styles.subtitle, { color: theme.colors.text + '80' }]}>
          Première connexion via internet, puis mode hors-ligne disponible
        </Text>
        
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          placeholder="Email"
          placeholderTextColor={theme.colors.text + '80'}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
          returnKeyType="next"
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          placeholder="Mot de passe"
          placeholderTextColor={theme.colors.text + '80'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.colors.primary },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" />
              <Text style={[styles.buttonText, { marginLeft: 12 }]}>
                Connexion...
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.forgotPassword}
          disabled={loading}
          onPress={() => {
            Alert.alert(
              'Mot de passe oublié',
              'Contactez votre administrateur pour réinitialiser votre mot de passe.'
            );
          }}
        >
          <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
            Mot de passe oublié ?
          </Text>
        </TouchableOpacity>

        {/* Section d'aide */}
        <View style={styles.helpContainer}>
          <Text style={[styles.helpText, { color: theme.colors.text + '60' }]}>
            💡 Après la première connexion, vous pourrez vous connecter même sans internet
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forgotPassword: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  helpContainer: {
    marginTop: 32,
    padding: 16,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});