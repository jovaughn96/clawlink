import { useEffect, useMemo, useState } from "react";
import { Alert, Button, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { createService, deleteService, listServices } from "../../lib/api";
import type { Service } from "../../types/domain";
import { supabase } from "../../lib/supabase";

export function ServicesScreen({ workspaceId }: { workspaceId: string }) {
  const [items, setItems] = useState<Service[]>([]);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("50");
  const [duration, setDuration] = useState("60");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) => s.name.toLowerCase().includes(q));
  }, [items, query]);

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

  async function saveEdit() {
    if (!editingId || !editName) return;
    await supabase.from("services").update({ name: editName }).eq("id", editingId);
    setEditingId(null);
    await load();
  }

  async function remove(id: string) {
    await deleteService(id);
    await load();
  }

  useEffect(() => {
    load();
  }, [workspaceId]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Services</Text>
      <TextInput style={styles.input} placeholder="Search services" value={query} onChangeText={setQuery} />
      <View style={styles.row}>
        <TextInput style={[styles.input, { flex: 2 }]} placeholder="Service" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Min" value={duration} onChangeText={setDuration} keyboardType="numeric" />
        <Button title="Add" onPress={add} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            {editingId === item.id ? (
              <>
                <TextInput style={[styles.input, { flex: 1 }]} value={editName} onChangeText={setEditName} />
                <Button title="Save" onPress={saveEdit} />
              </>
            ) : (
              <>
                <Text>• {item.name} — ${item.price_cents / 100} / {item.duration_min}m</Text>
                <View style={styles.actionRow}>
                  <Button title="Edit" onPress={() => {
                    setEditingId(item.id);
                    setEditName(item.name);
                  }} />
                  <Button title="Delete" color="#b91c1c" onPress={() => Alert.alert("Delete service?", item.name, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => remove(item.id) },
                  ])} />
                </View>
              </>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 8 },
  title: { fontSize: 18, fontWeight: "700" },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  actionRow: { flexDirection: "row", gap: 6 },
  input: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8 },
});
