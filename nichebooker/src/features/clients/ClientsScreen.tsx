import { useEffect, useMemo, useState } from "react";
import { Alert, Button, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { createClient, deleteClient, listClients } from "../../lib/api";
import type { Client } from "../../types/domain";
import { supabase } from "../../lib/supabase";

export function ClientsScreen({ workspaceId }: { workspaceId: string }) {
  const [items, setItems] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => `${c.first_name} ${c.last_name}`.toLowerCase().includes(q));
  }, [items, query]);

  async function load() {
    setItems(await listClients(workspaceId));
  }

  async function add() {
    if (!firstName || !lastName) return;
    await createClient(workspaceId, { first_name: firstName, last_name: lastName, phone: "", email: "" });
    setFirstName("");
    setLastName("");
    await load();
  }

  async function saveEdit() {
    if (!editingId) return;
    await supabase
      .from("clients")
      .update({ first_name: editFirst, last_name: editLast })
      .eq("id", editingId);
    setEditingId(null);
    await load();
  }

  async function remove(id: string) {
    await deleteClient(id);
    await load();
  }

  useEffect(() => {
    load();
  }, [workspaceId]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Clients</Text>
      <TextInput style={styles.input} placeholder="Search clients" value={query} onChangeText={setQuery} />
      <View style={styles.row}>
        <TextInput style={styles.input} placeholder="First" value={firstName} onChangeText={setFirstName} />
        <TextInput style={styles.input} placeholder="Last" value={lastName} onChangeText={setLastName} />
        <Button title="Add" onPress={add} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            {editingId === item.id ? (
              <>
                <TextInput style={[styles.input, { flex: 1 }]} value={editFirst} onChangeText={setEditFirst} />
                <TextInput style={[styles.input, { flex: 1 }]} value={editLast} onChangeText={setEditLast} />
                <Button title="Save" onPress={saveEdit} />
              </>
            ) : (
              <>
                <Text>• {item.first_name} {item.last_name}</Text>
                <View style={styles.actionRow}>
                  <Button title="Edit" onPress={() => {
                    setEditingId(item.id);
                    setEditFirst(item.first_name);
                    setEditLast(item.last_name);
                  }} />
                  <Button title="Delete" color="#b91c1c" onPress={() => Alert.alert("Delete client?", `${item.first_name} ${item.last_name}`, [
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
