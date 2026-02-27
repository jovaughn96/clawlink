import { useEffect, useMemo, useState } from "react";
import { Alert, Button, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { createAppointment, createDepositIntent, deleteAppointment, listAppointments, listClients, listServices } from "../../lib/api";
import type { Appointment, Client, Service } from "../../types/domain";

export function AppointmentsScreen({ workspaceId }: { workspaceId: string }) {
  const [items, setItems] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [serviceQuery, setServiceQuery] = useState("");
  const [isoStart, setIsoStart] = useState(new Date().toISOString().slice(0, 16));
  const [depositLog, setDepositLog] = useState("");

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => `${c.first_name} ${c.last_name}`.toLowerCase().includes(q));
  }, [clients, clientQuery]);

  const filteredServices = useMemo(() => {
    const q = serviceQuery.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, serviceQuery]);

  const selectedService = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);

  async function load() {
    const [a, c, s] = await Promise.all([
      listAppointments(workspaceId),
      listClients(workspaceId),
      listServices(workspaceId),
    ]);
    setItems(a);
    setClients(c);
    setServices(s);
    if (!clientId && c[0]) setClientId(c[0].id);
    if (!serviceId && s[0]) setServiceId(s[0].id);
  }

  async function add() {
    if (!clientId || !serviceId || !selectedService) return;
    const start = new Date(isoStart);
    const end = new Date(start.getTime() + selectedService.duration_min * 60_000);
    await createAppointment(workspaceId, {
      client_id: clientId,
      service_id: serviceId,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      subtotal_cents: selectedService.price_cents,
      deposit_required_cents:
        selectedService.deposit_type === "percent"
          ? Math.round((selectedService.price_cents * selectedService.deposit_value) / 100)
          : selectedService.deposit_type === "fixed"
            ? selectedService.deposit_value
            : 0,
    });
    await load();
  }

  async function remove(id: string) {
    await deleteAppointment(id);
    await load();
  }

  async function startDepositIntent(appointmentId: string) {
    const res = await createDepositIntent(appointmentId);
    setDepositLog(`Deposit intent: ${res.paymentIntentId ?? "n/a"}`);
  }

  useEffect(() => {
    load();
  }, [workspaceId]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Appointments</Text>

      <Text style={styles.section}>Client</Text>
      <TextInput style={styles.input} value={clientQuery} onChangeText={setClientQuery} placeholder="Search clients" />
      <View style={styles.chipWrap}>
        {filteredClients.map((c) => (
          <TouchableOpacity key={c.id} style={[styles.chip, clientId === c.id && styles.chipActive]} onPress={() => setClientId(c.id)}>
            <Text style={[styles.chipText, clientId === c.id && styles.chipTextActive]}>{c.first_name} {c.last_name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>Service</Text>
      <TextInput style={styles.input} value={serviceQuery} onChangeText={setServiceQuery} placeholder="Search services" />
      <View style={styles.chipWrap}>
        {filteredServices.map((s) => (
          <TouchableOpacity key={s.id} style={[styles.chip, serviceId === s.id && styles.chipActive]} onPress={() => setServiceId(s.id)}>
            <Text style={[styles.chipText, serviceId === s.id && styles.chipTextActive]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} value={isoStart} onChangeText={setIsoStart} placeholder="YYYY-MM-DDTHH:mm" />
      <Button title="Create appointment" onPress={add} />
      {!!depositLog && <Text style={styles.subtle}>{depositLog}</Text>}

      <Text style={styles.section}>Upcoming</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>• {new Date(item.starts_at).toLocaleString()} — ${(item.subtotal_cents / 100).toFixed(2)} ({item.status})</Text>
            <View style={styles.row}>
              <Button title="Deposit" onPress={() => startDepositIntent(item.id)} />
              <Button title="Delete" color="#b91c1c" onPress={() => Alert.alert("Delete appointment?", "This cannot be undone.", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => remove(item.id) },
              ])} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 8 },
  title: { fontSize: 18, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8 },
  subtle: { color: "#6b7280", fontSize: 12 },
  section: { fontWeight: "700", marginTop: 8 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: "#e5e7eb", borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  chipActive: { backgroundColor: "#111827" },
  chipText: { color: "#111827" },
  chipTextActive: { color: "white" },
  item: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e5e7eb", gap: 6 },
  row: { flexDirection: "row", gap: 8 },
});
