import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { DashboardScreen } from "./src/features/dashboard/DashboardScreen";
import { ClientsScreen } from "./src/features/clients/ClientsScreen";
import { ServicesScreen } from "./src/features/services/ServicesScreen";
import { AppointmentsScreen } from "./src/features/appointments/AppointmentsScreen";
import { env } from "./src/config/env";

export default function App() {
  const hasEnv = Boolean(env.supabaseUrl && env.supabaseAnonKey);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>NicheBooker</Text>
        <Text style={styles.sub}>Booking + CRM scaffold (Expo + Supabase)</Text>

        <View style={[styles.banner, !hasEnv && styles.bannerWarn]}>
          <Text style={styles.bannerText}>
            {hasEnv
              ? "Supabase env detected. Ready to connect auth + data."
              : "Missing Supabase env. Copy .env.example to .env and fill keys."}
          </Text>
        </View>

        <DashboardScreen />
        <ClientsScreen />
        <ServicesScreen />
        <AppointmentsScreen />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  content: { padding: 16, gap: 12 },
  h1: { fontSize: 28, fontWeight: "800", color: "#111827" },
  sub: { color: "#4b5563", marginBottom: 8 },
  banner: { backgroundColor: "#dcfce7", borderRadius: 10, padding: 12 },
  bannerWarn: { backgroundColor: "#fef3c7" },
  bannerText: { color: "#1f2937", fontWeight: "500" },
});
