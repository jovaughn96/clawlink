import { View, Text, StyleSheet } from "react-native";

export function ClientsScreen() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Clients</Text>
      <Text>MVP: list, create, edit, tags, notes.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 8 },
  title: { fontSize: 18, fontWeight: "700" },
});
