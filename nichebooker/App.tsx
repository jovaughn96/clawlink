import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useEffect, useState } from "react";
import { DashboardScreen } from "./src/features/dashboard/DashboardScreen";
import { RemindersScreen } from "./src/features/dashboard/RemindersScreen";
import { ClientsScreen } from "./src/features/clients/ClientsScreen";
import { ServicesScreen } from "./src/features/services/ServicesScreen";
import { AppointmentsScreen } from "./src/features/appointments/AppointmentsScreen";
import { env } from "./src/config/env";
import { AuthGate } from "./src/features/auth/AuthGate";
import { ensureWorkspace } from "./src/lib/api";
import { supabase } from "./src/lib/supabase";
import type { Workspace } from "./src/types/domain";

type TabKey = "dashboard" | "clients" | "services" | "appointments" | "reminders";

export default function App() {
  const hasEnv = Boolean(env.supabaseUrl && env.supabaseAnonKey);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [tab, setTab] = useState<TabKey>("dashboard");

  useEffect(() => {
    if (!hasEnv) return;
    ensureWorkspace().then(setWorkspace).catch(console.error);
  }, [hasEnv]);

  if (!hasEnv) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.h1}>NicheBooker</Text>
          <Text style={styles.sub}>Missing Supabase env. Copy .env.example to .env and fill keys.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AuthGate>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.h1}>NicheBooker</Text>
            <TouchableOpacity onPress={() => supabase.auth.signOut()}>
              <Text style={styles.signOut}>Sign out</Text>
            </TouchableOpacity>
          </View>

          {!workspace ? (
            <Text style={styles.sub}>Bootstrapping workspace...</Text>
          ) : (
            <>
              <Text style={styles.sub}>{workspace.name} • {workspace.niche_key}</Text>
              <View style={styles.tabs}>
                {(["dashboard", "clients", "services", "appointments", "reminders"] as TabKey[]).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.tab, tab === key && styles.tabActive]}
                    onPress={() => setTab(key)}
                  >
                    <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{key}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {tab === "dashboard" && <DashboardScreen workspaceName={workspace.name} />}
              {tab === "clients" && <ClientsScreen workspaceId={workspace.id} />}
              {tab === "services" && <ServicesScreen workspaceId={workspace.id} />}
              {tab === "appointments" && <AppointmentsScreen workspaceId={workspace.id} />}
              {tab === "reminders" && <RemindersScreen workspaceId={workspace.id} />}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  content: { padding: 16, gap: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  h1: { fontSize: 28, fontWeight: "800", color: "#111827" },
  sub: { color: "#4b5563", marginBottom: 8 },
  signOut: { color: "#1d4ed8", fontWeight: "600" },
  tabs: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  tab: { backgroundColor: "#e5e7eb", borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  tabActive: { backgroundColor: "#111827" },
  tabText: { color: "#111827", textTransform: "capitalize" },
  tabTextActive: { color: "#fff" },
});
