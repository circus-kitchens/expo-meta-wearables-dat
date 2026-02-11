import { Feather } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Section } from "./ui";
import type { LogEntry } from "./utils";

export function EventLog({ eventLog, onClear }: { eventLog: LogEntry[]; onClear: () => void }) {
  return (
    <Section
      title="Event Log"
      action={
        eventLog.length > 0 ? (
          <Pressable onPress={onClear} style={styles.action}>
            <Feather name="trash-2" size={14} color="#ef4444" />
            <Text style={styles.actionText}>Clear</Text>
          </Pressable>
        ) : undefined
      }
    >
      <View style={styles.eventLog}>
        <ScrollView style={styles.eventLogScroll} nestedScrollEnabled>
          {eventLog.length === 0 && <Text style={styles.hint}>No events yet.</Text>}
          {eventLog.map((entry) => (
            <View key={entry.id} style={styles.eventLogEntry}>
              <Text style={styles.eventLogTime}>{entry.time}</Text>
              <Text
                style={[styles.eventLogMessage, entry.color ? { color: entry.color } : undefined]}
              >
                {entry.message}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    color: "#ef4444",
    fontWeight: "500",
  },
  hint: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4,
  },
  eventLog: {
    height: 200,
    backgroundColor: "#0f172a",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  eventLogScroll: {
    flex: 1,
  },
  eventLogEntry: {
    flexDirection: "row",
    marginBottom: 5,
  },
  eventLogTime: {
    color: "#475569",
    fontSize: 11,
    fontFamily: "Courier",
    marginRight: 8,
    minWidth: 60,
  },
  eventLogMessage: {
    color: "#e2e8f0",
    fontSize: 11,
    fontFamily: "Courier",
    flex: 1,
  },
});
