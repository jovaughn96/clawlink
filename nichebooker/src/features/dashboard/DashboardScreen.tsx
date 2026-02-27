import { View, Text, StyleSheet } from "react-native";

export function DashboardScreen({ workspaceName }: { workspaceName: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Dashboard</Text>
      <Text>Workspace: {workspaceName}</Text>
      <Text>• Bookings today</Text>
      <Text>• No-show rate</Text>
      <Text>• Revenue this week</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 8 },
  title: { fontSize: 18, fontWeight: "700" },
});
