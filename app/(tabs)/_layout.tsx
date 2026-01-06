import AppHeaderMenu from '@/app/component/menu/appHeaderMenu';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: 'e-GMC',
      
        headerStyle: {
          backgroundColor: '#ffd900ff',
        },
        headerRight: () => <AppHeaderMenu />,

        tabBarActiveTintColor: '#e81010ff',
        tabBarInactiveTintColor: '#0144b8ff',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          backgroundColor: '#ffd900ff',
        },
      }}
    >
      <Tabs.Screen
        name="paiement/index"
        options={{
          title: 'Paiement',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'card' : 'card-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="marchand/index"
        options={{
          title: 'Marchands',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="store" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="scan/index"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => (
            <Ionicons name="qr-code-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
      {/* <Tabs.Screen
        name="synchro/index"
        options={{
          title: 'Synchronisation',
          tabBarIcon: ({ color }) => (
            <Ionicons name="sync-outline" size={24} color={color} />
          ),
        }}
      /> */}
    </Tabs>
  );
}
