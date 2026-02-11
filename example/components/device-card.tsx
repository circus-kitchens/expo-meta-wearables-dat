import { Ionicons } from "@expo/vector-icons";
import type { Device } from "expo-meta-wearables-dat";
import { StyleSheet, Text, View } from "react-native";

import { StatusRow } from "./ui";

export function DeviceCard({ device }: { device: Device }) {
  const isDisconnected = device.linkState === "disconnected";
  return (
    <View style={[styles.deviceCard, isDisconnected && styles.deviceCardDisconnected]}>
      <View style={styles.deviceHeader}>
        <View style={styles.deviceNameRow}>
          <Ionicons
            name="glasses-outline"
            size={18}
            color={isDisconnected ? "#94a3b8" : "#64748b"}
          />
          <Text style={[styles.deviceName, isDisconnected && styles.deviceNameDisconnected]}>
            {device.name || "Unnamed Device"}
          </Text>
        </View>
        <View
          style={[
            styles.deviceDot,
            {
              backgroundColor:
                device.linkState === "connected"
                  ? "#22c55e"
                  : device.linkState === "connecting"
                    ? "#f59e0b"
                    : "#cbd5e1",
            },
          ]}
        />
      </View>
      <StatusRow label="ID" value={device.identifier} />
      <StatusRow label="Type" value={device.deviceType} />
      <StatusRow
        label="Link"
        value={device.linkState}
        color={
          device.linkState === "connected"
            ? "#22c55e"
            : device.linkState === "connecting"
              ? "#f59e0b"
              : "#94a3b8"
        }
      />
      <StatusRow label="Compatibility" value={device.compatibility} />
    </View>
  );
}

const styles = StyleSheet.create({
  deviceCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 14,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#22c55e",
  },
  deviceCardDisconnected: {
    opacity: 0.55,
    borderLeftColor: "#cbd5e1",
  },
  deviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  deviceNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  deviceNameDisconnected: {
    color: "#94a3b8",
  },
  deviceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
