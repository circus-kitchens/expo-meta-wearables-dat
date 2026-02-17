import { Feather } from "@expo/vector-icons";
import { getDocumentAsync } from "expo-document-picker";
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
  mockDeviceSetCameraFeed,
  mockDeviceSetCapturedImage,
} from "expo-meta-wearables-dat";
import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Btn, Section } from "./ui";

interface MockDeviceInfo {
  id: string;
  powered: boolean;
  donned: boolean;
  unfolded: boolean;
  cameraFeedSet: boolean;
  capturedImageSet: boolean;
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
    setDevices((prev) => [
      ...prev,
      {
        id,
        powered: false,
        donned: false,
        unfolded: true,
        cameraFeedSet: false,
        capturedImageSet: false,
      },
    ]);
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

  const handleSetCameraFeed = useCallback(async (id: string) => {
    const result = await getDocumentAsync({ type: "video/*", copyToCacheDirectory: true });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    await mockDeviceSetCameraFeed(id, uri);
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, cameraFeedSet: true } : d)));
  }, []);

  const handleSetCapturedImage = useCallback(async (id: string) => {
    const result = await getDocumentAsync({ type: "image/*", copyToCacheDirectory: true });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    await mockDeviceSetCapturedImage(id, uri);
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, capturedImageSet: true } : d)));
  }, []);

  const refreshList = useCallback(async () => {
    const ids = await getMockDevices();
    setDevices((prev) => {
      const known = new Map(prev.map((d) => [d.id, d]));
      return ids.map(
        (id) =>
          known.get(id) ?? {
            id,
            powered: false,
            donned: false,
            unfolded: true,
            cameraFeedSet: false,
            capturedImageSet: false,
          }
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

          <View style={styles.toggleRow}>
            <ToggleChip
              label={device.powered ? "ON" : "OFF"}
              active={device.powered}
              onPress={safe(() => handlePowerToggle(device))}
            />
            <ToggleChip
              label={device.donned ? "DON" : "DOFF"}
              active={device.donned}
              onPress={safe(() => handleDonToggle(device))}
            />
            <ToggleChip
              label={device.unfolded ? "OPEN" : "FOLD"}
              active={device.unfolded}
              onPress={safe(() => handleFoldToggle(device))}
            />
          </View>

          <View style={styles.toggleRow}>
            <ToggleChip
              label={device.cameraFeedSet ? "Feed SET" : "Set Feed"}
              active={device.cameraFeedSet}
              onPress={safe(() => handleSetCameraFeed(device.id))}
            />
            <ToggleChip
              label={device.capturedImageSet ? "Photo SET" : "Set Photo"}
              active={device.capturedImageSet}
              onPress={safe(() => handleSetCapturedImage(device.id))}
            />
          </View>
        </View>
      ))}

      {devices.length === 0 && (
        <Text style={styles.hint}>No mock devices. Tap "Create" to simulate a Ray-Ban Meta.</Text>
      )}
    </Section>
  );
}

function ToggleChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toggle,
        active ? styles.toggleActive : styles.toggleInactive,
        pressed && styles.togglePressed,
      ]}
    >
      <Text
        style={[styles.toggleText, active ? styles.toggleTextActive : styles.toggleTextInactive]}
      >
        {label}
      </Text>
    </Pressable>
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
  toggleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  toggle: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  toggleActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
  },
  toggleInactive: {
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
  },
  togglePressed: {
    opacity: 0.7,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "700",
  },
  toggleTextActive: {
    color: "#16a34a",
  },
  toggleTextInactive: {
    color: "#dc2626",
  },
  hint: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 6,
  },
});
