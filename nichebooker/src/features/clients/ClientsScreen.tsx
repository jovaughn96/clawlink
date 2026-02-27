import { useEffect, useState } from "react";
import { Alert, Button, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { createClient, deleteClient, listClients } from "../../lib/api";
import type { Client } from "../../types/domain";

export function ClientsScreen({ workspaceId }: { workspaceId: string }) {
  const [items, setItems] = useState<Client[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

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
      <View style={styles.row}>
        <TextInput style={styles.input} placeholder="First" value={firstName} onChangeText={setFirstName} />
        <TextInput style={styles.input} placeholder="Last" value={lastName} onChangeText={setLastName} />
        <Button title="Add" onPress={add} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Text>• {item.first_name} {item.last_name}</Text>
            <Button title="Delete" color="#b91c1c" onPress={() => Alert.alert("Delete client?", `${item.first_name} ${item.last_name}`, [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => remove(item.id) },
            ])} />
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
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  input: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8 },
});
