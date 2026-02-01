import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Tabs, usePathname } from "expo-router";
import { Platform, Text, View } from "react-native";
import AppHeaderMenu from "./(_menu)/appHeaderMenu";

const getHeaderTitle = (pathname: string): string => {
  if (pathname.includes("(_menu)/profile")) return "Mon Profil";
  if (pathname.includes("(_menu)/note")) return "Notes";
  if (pathname.includes("(_menu)/synchro")) return "Synchronisation";
  if (pathname.includes("/paiement")) return "Paiement";
  if (pathname.includes("/marchand")) return "Marchands";
  if (pathname.includes("/scan")) return "Scanner QR";
  if (pathname.includes("/profile")) return "Profil";
  if (pathname.includes("/session")) return "Session";
  if (pathname.includes("/quittance")) return "Quittance";
  return "";
};

export default function TabsLayout() {
  const pathname = usePathname();
  const headerTitle = getHeaderTitle(pathname);

  return (
    <Tabs
      screenOptions={{
        headerTitle: headerTitle,
        headerTitleAlign: "center", // Titre au centre
        headerStyle: {
          backgroundColor: "#f5f5f5",
          elevation: 10,
          shadowOpacity: 0.1,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 2 },
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: "800", // Plus gras (bold = 700, extra-bold = 800)
          color: "#333",
        },
        headerLeft: () => (
          // Logo e-GMC à gauche
          <View style={{ marginLeft: 15 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "rgb(34, 7, 237)",
              }}
            >
              e-GMC
            </Text>
          </View>
        ),
        headerRight: () => <AppHeaderMenu />, // Menu à droite

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
          href: null,
          headerTitle: "Mon Profil",
        }}
      />

      <Tabs.Screen
        name="(_menu)/appHeaderMenu"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="(_menu)/synchro/index"
        options={{
          href: null,
          headerTitle: "Synchronisation",
        }}
      />

      <Tabs.Screen
        name="(_menu)/note/index"
        options={{
          href: null,
          headerTitle: "Notes",
        }}
      />
    </Tabs>
  );
}
