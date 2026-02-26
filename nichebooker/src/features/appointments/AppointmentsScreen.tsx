import { View, Text, StyleSheet } from "react-native";

export function AppointmentsScreen() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Appointments</Text>
      <Text>MVP: calendar/day list, confirm/cancel/no-show.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 8 },
  title: { fontSize: 18, fontWeight: "700" },
});
