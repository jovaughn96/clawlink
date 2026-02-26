import { View, Text, StyleSheet } from "react-native";

export function ServicesScreen() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Services</Text>
      <Text>MVP: duration, price, deposit defaults, active toggle.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 8 },
  title: { fontSize: 18, fontWeight: "700" },
});
