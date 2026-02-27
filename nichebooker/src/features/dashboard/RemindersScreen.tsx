import { useEffect, useState } from "react";
import { Button, FlatList, StyleSheet, Text, View } from "react-native";
import { listMessageLogs, listReminderJobs } from "../../lib/api";
import type { MessageLog, ReminderJob } from "../../types/domain";

export function RemindersScreen({ workspaceId }: { workspaceId: string }) {
  const [jobs, setJobs] = useState<ReminderJob[]>([]);
  const [logs, setLogs] = useState<MessageLog[]>([]);

  async function load() {
    const [nextJobs, nextLogs] = await Promise.all([
      listReminderJobs(workspaceId),
      listMessageLogs(workspaceId),
    ]);
    setJobs(nextJobs);
    setLogs(nextLogs);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [workspaceId]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Reminders</Text>
        <Button title="Refresh" onPress={() => load().catch(console.error)} />
      </View>

      <Text style={styles.section}>Scheduled jobs</Text>
      <FlatList
        scrollEnabled={false}
        data={jobs.slice(0, 8)}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.subtle}>No reminder jobs yet.</Text>}
        renderItem={({ item }) => (
          <Text style={styles.item}>
            • {item.reminder_type} @ {new Date(item.scheduled_for).toLocaleString()} — {item.status}
          </Text>
        )}
      />

      <Text style={styles.section}>Recent sends</Text>
      <FlatList
        scrollEnabled={false}
        data={logs.slice(0, 8)}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.subtle}>No message logs yet.</Text>}
        renderItem={({ item }) => (
          <Text style={styles.item}>
            • {item.channel.toUpperCase()} {item.recipient ? `to ${item.recipient}` : ""} — {item.status}
          </Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 8 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  section: { marginTop: 8, fontWeight: "700" },
  item: { color: "#111827" },
  subtle: { color: "#6b7280" },
});
