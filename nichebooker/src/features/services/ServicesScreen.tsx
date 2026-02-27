import { useEffect, useState } from "react";
import { Button, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { createService, listServices } from "../../lib/api";
import type { Service } from "../../types/domain";

export function ServicesScreen({ workspaceId }: { workspaceId: string }) {
  const [items, setItems] = useState<Service[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("50");
  const [duration, setDuration] = useState("60");

  async function load() {
    setItems(await listServices(workspaceId));
  }

  async function add() {
    if (!name) return;
    await createService(workspaceId, {
      name,
      duration_min: Number(duration) || 60,
      price_cents: Math.round((Number(price) || 0) * 100),
    });
    setName("");
    await load();
  }

  useEffect(() => {
    load();
  }, [workspaceId]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Services</Text>
      <View style={styles.row}>
        <TextInput style={[styles.input, { flex: 2 }]} placeholder="Service" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Min" value={duration} onChangeText={setDuration} keyboardType="numeric" />
        <Button title="Add" onPress={add} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Text>• {item.name} — ${item.price_cents / 100} / {item.duration_min}m</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 8 },
  title: { fontSize: 18, fontWeight: "700" },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8 },
});
