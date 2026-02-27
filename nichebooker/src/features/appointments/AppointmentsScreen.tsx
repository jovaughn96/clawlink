import { useEffect, useMemo, useState } from "react";
import { Button, FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { createAppointment, listAppointments, listClients, listServices } from "../../lib/api";
import type { Appointment, Client, Service } from "../../types/domain";

export function AppointmentsScreen({ workspaceId }: { workspaceId: string }) {
  const [items, setItems] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [isoStart, setIsoStart] = useState(new Date().toISOString().slice(0, 16));

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

  useEffect(() => {
    load();
  }, [workspaceId]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Appointments</Text>
      <TextInput style={styles.input} value={clientId} onChangeText={setClientId} placeholder="client id" />
      <TextInput style={styles.input} value={serviceId} onChangeText={setServiceId} placeholder="service id" />
      <TextInput style={styles.input} value={isoStart} onChangeText={setIsoStart} placeholder="YYYY-MM-DDTHH:mm" />
      <Button title="Create appointment" onPress={add} />
      <Text style={styles.subtle}>Tip: copy IDs from list below for now (UI picker next).</Text>

      <Text style={styles.section}>Client IDs</Text>
      {clients.map((c) => (
        <Text key={c.id} style={styles.mono}>{c.id.slice(0, 8)}… → {c.first_name} {c.last_name}</Text>
      ))}

      <Text style={styles.section}>Service IDs</Text>
      {services.map((s) => (
        <Text key={s.id} style={styles.mono}>{s.id.slice(0, 8)}… → {s.name}</Text>
      ))}

      <Text style={styles.section}>Upcoming</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Text>• {new Date(item.starts_at).toLocaleString()} — ${(item.subtotal_cents / 100).toFixed(2)} ({item.status})</Text>
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
  mono: { fontFamily: "Courier", fontSize: 12 },
});
