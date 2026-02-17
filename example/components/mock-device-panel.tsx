import { Feather } from "@expo/vector-icons";
import {
  createMockDevice,
  removeMockDevice,
  getMockDevices,
  mockDevicePowerOn,
  mockDevicePowerOff,
  mockDeviceDon,
  mockDeviceDoff,
  mockDeviceFold,
  mockDeviceUnfold,
} from "expo-meta-wearables-dat";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Btn, Row, Section } from "./ui";

interface MockDeviceInfo {
  id: string;
  powered: boolean;
  donned: boolean;
  unfolded: boolean;
}

export function MockDevicePanel() {
  const [devices, setDevices] = useState<MockDeviceInfo[]>([]);

  const safe = (fn: () => Promise<unknown> | unknown) => async () => {
    try {
      await fn();
    } catch (err) {
      Alert.alert("Mock Device Error", err instanceof Error ? err.message : String(err));
    }
  };

  const handleCreate = useCallback(async () => {
    const id = await createMockDevice();
    setDevices((prev) => [...prev, { id, powered: false, donned: false, unfolded: true }]);
  }, []);

  const handleRemove = useCallback(async (id: string) => {
    await removeMockDevice(id);
    setDevices((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const handlePowerToggle = useCallback(async (device: MockDeviceInfo) => {
    if (device.powered) {
      await mockDevicePowerOff(device.id);
    } else {
      await mockDevicePowerOn(device.id);
    }
    setDevices((prev) => prev.map((d) => (d.id === device.id ? { ...d, powered: !d.powered } : d)));
  }, []);

  const handleDonToggle = useCallback(async (device: MockDeviceInfo) => {
    if (device.donned) {
      await mockDeviceDoff(device.id);
    } else {
      await mockDeviceDon(device.id);
    }
    setDevices((prev) => prev.map((d) => (d.id === device.id ? { ...d, donned: !d.donned } : d)));
  }, []);

  const handleFoldToggle = useCallback(async (device: MockDeviceInfo) => {
    if (device.unfolded) {
      await mockDeviceFold(device.id);
    } else {
      await mockDeviceUnfold(device.id);
    }
    setDevices((prev) =>
      prev.map((d) => (d.id === device.id ? { ...d, unfolded: !d.unfolded } : d))
    );
  }, []);

  const refreshList = useCallback(async () => {
    const ids = await getMockDevices();
    setDevices((prev) => {
      const known = new Map(prev.map((d) => [d.id, d]));
      return ids.map(
        (id) => known.get(id) ?? { id, powered: false, donned: false, unfolded: true }
      );
    });
  }, []);

  return (
    <Section
      title={`Mock Devices (${devices.length})`}
      action={
        <Pressable onPress={refreshList} style={styles.sectionAction}>
          <Feather name="refresh-cw" size={14} color="#64748b" />
          <Text style={styles.sectionActionText}>Refresh</Text>
        </Pressable>
      }
    >
      <Btn label="Create Mock Device" onPress={safe(handleCreate)} />

      {devices.map((device) => (
        <View key={device.id} style={styles.deviceCard}>
          <View style={styles.deviceHeader}>
            <Text style={styles.deviceId}>{device.id.slice(0, 12)}...</Text>
            <Pressable onPress={safe(() => handleRemove(device.id))}>
              <Feather name="trash-2" size={16} color="#ef4444" />
            </Pressable>
          </View>

          <View style={styles.statusRow}>
            <StatusChip
              label="Power"
              active={device.powered}
              activeLabel="ON"
              inactiveLabel="OFF"
            />
            <StatusChip
              label="Wear"
              active={device.donned}
              activeLabel="DON"
              inactiveLabel="DOFF"
            />
            <StatusChip
              label="Hinge"
              active={device.unfolded}
              activeLabel="OPEN"
              inactiveLabel="FOLD"
            />
          </View>

          <Row>
            <Btn
              label={device.powered ? "Off" : "On"}
              variant={device.powered ? "destructive" : "success"}
              onPress={safe(() => handlePowerToggle(device))}
            />
            <Btn
              label={device.donned ? "Doff" : "Don"}
              onPress={safe(() => handleDonToggle(device))}
            />
            <Btn
              label={device.unfolded ? "Fold" : "Unfold"}
              onPress={safe(() => handleFoldToggle(device))}
            />
          </Row>
        </View>
      ))}

      {devices.length === 0 && (
        <Text style={styles.hint}>No mock devices. Tap "Create" to simulate a Ray-Ban Meta.</Text>
      )}
    </Section>
  );
}

function StatusChip({
  label,
  active,
  activeLabel,
  inactiveLabel,
}: {
  label: string;
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <View style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={[styles.chipValue, active ? styles.chipValueActive : styles.chipValueInactive]}>
        {active ? activeLabel : inactiveLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sectionActionText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  deviceCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  deviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  deviceId: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    fontFamily: "Courier",
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: "#dcfce7",
  },
  chipInactive: {
    backgroundColor: "#fee2e2",
  },
  chipLabel: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "500",
  },
  chipValue: {
    fontSize: 11,
    fontWeight: "700",
  },
  chipValueActive: {
    color: "#16a34a",
  },
  chipValueInactive: {
    color: "#dc2626",
  },
  hint: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 6,
  },
});
