import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import AppHeaderMenu from "./(_menu)/appHeaderMenu";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitle: "e-GMC",
        headerStyle: {
          backgroundColor: "#f5f5f5",
          elevation: 10, // 🔹 Ombre pour Android
          shadowOpacity: 0.1, // 🔹 Ombre pour iOS
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 2 },
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "600",
          color: "#000",
        },
        headerRight: () => <AppHeaderMenu />,

        tabBarActiveTintColor: "#e81010ff",
        tabBarInactiveTintColor: "#0144b8ff",
        tabBarStyle: {
          height: Platform.OS === "ios" ? 88 : 60,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          backgroundColor: "#f5f5f5",
          elevation: 8,
          shadowOpacity: 0.1,
        },
      }}
    >
      <Tabs.Screen
        name="paiement/index"
        options={{
          title: "Paiement",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "card" : "card-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="marchand/index"
        options={{
          title: "Marchands",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="store" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="scan/index"
        options={{
          title: "Scan",
          tabBarIcon: ({ color }) => (
            <Ionicons name="qr-code-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="session/index"
        options={{
          title: "Session",
          tabBarIcon: ({ color }) => (
            <Ionicons name="time-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quittance/index"
        options={{
          title: "Quittance",
          tabBarIcon: ({ color }) => (
            <Ionicons name="receipt-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="(_menu)/profile/index"
        options={{
          href: null, // 🔹 Cache tout le groupe (_menu)
        }}
      />
      <Tabs.Screen
        name="(_menu)/appHeaderMenu"
        options={{
          href: null, // 🔹 Cache tout le groupe (_menu)
        }}
      />
      <Tabs.Screen
        name="(_menu)/synchro/index"
        options={{
          href: null, // 🔹 Cache tout le groupe (_menu)
        }}
      />
      <Tabs.Screen
        name="(_menu)/note/index"
        options={{
          href: null, // 🔹 Cache tout le groupe (_menu)
        }}
      />
    </Tabs>
  );
}
