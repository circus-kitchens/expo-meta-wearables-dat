import { useMetaWearables, EMWDATStreamView, handleUrl } from "expo-meta-wearables-dat";
import type {
  Device,
  StreamSessionError,
  PhotoData,
  StreamSessionState,
  RegistrationState,
  PermissionStatus,
} from "expo-meta-wearables-dat";
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// =============================================================================
// Main App
// =============================================================================

export default function App() {
  const [lastPhoto, setLastPhoto] = useState<PhotoData | null>(null);

  const {
    // State
    isConfigured,
    registrationState,
    permissionStatus,
    devices,
    streamState,
    lastError,
    // Actions
    startRegistration,
    startUnregistration,
    checkPermissionStatus,
    requestPermission,
    refreshDevices,
    startStream,
    stopStream,
    capturePhoto,
  } = useMetaWearables({
    logLevel: "debug",
    onRegistrationStateChange: (state) => {
      console.log("[EMWDAT] Registration:", state);
    },
    onDevicesChange: (deviceList) => {
      console.log("[EMWDAT] Devices:", deviceList.length);
    },
    onLinkStateChange: (deviceId, linkState) => {
      console.log("[EMWDAT] Link:", deviceId, linkState);
    },
    onStreamStateChange: (state) => {
      console.log("[EMWDAT] Stream:", state);
    },
    onVideoFrame: (metadata) => {
      console.log("[EMWDAT] Frame:", metadata.width, "x", metadata.height);
    },
    onPhotoCaptured: (photo) => {
      console.log("[EMWDAT] Photo:", photo.filePath);
      setLastPhoto(photo);
    },
    onStreamError: (error) => {
      console.warn("[EMWDAT] Stream error:", error.type);
    },
    onPermissionStatusChange: (permission, status) => {
      console.log("[EMWDAT] Permission:", permission, status);
    },
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const safe = (fn: () => Promise<unknown>) => async () => {
    try {
      await fn();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : String(err));
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={styles.title}>EMWDAT Example</Text>

          {/* Status */}
          <Section title="Status">
            <StatusRow label="Configured" value={String(isConfigured)} />
            <StatusRow
              label="Registration"
              value={registrationState}
              color={registrationColor(registrationState)}
            />
            <StatusRow
              label="Permission"
              value={permissionStatus}
              color={permissionColor(permissionStatus)}
            />
            <StatusRow label="Stream" value={streamState} color={streamColor(streamState)} />
            {lastError && (
              <StatusRow label="Last Error" value={formatError(lastError)} color="#ef4444" />
            )}
          </Section>

          {/* Registration */}
          <Section title="Registration">
            <Row>
              <Btn
                label="Register"
                onPress={safe(startRegistration)}
                disabled={!isConfigured || registrationState === "registered"}
              />
              <Btn
                label="Unregister"
                onPress={safe(startUnregistration)}
                disabled={!isConfigured || registrationState !== "registered"}
              />
            </Row>
            <Text style={styles.hint}>Opens Meta AI app for registration flow.</Text>
          </Section>

          {/* Permissions */}
          <Section title="Permissions">
            <Row>
              <Btn
                label="Check"
                onPress={safe(() => checkPermissionStatus("camera"))}
                disabled={!isConfigured}
              />
              <Btn
                label="Request"
                onPress={safe(() => requestPermission("camera"))}
                disabled={
                  !isConfigured ||
                  registrationState !== "registered" ||
                  permissionStatus === "granted"
                }
              />
            </Row>
            {permissionStatus === "granted" && (
              <Text style={styles.hint}>Camera permission already granted.</Text>
            )}
          </Section>

          {/* Devices */}
          <Section title={`Devices (${devices.length})`}>
            <Btn label="Refresh Devices" onPress={safe(refreshDevices)} disabled={!isConfigured} />
            {devices.map((device) => (
              <DeviceCard key={device.identifier} device={device} />
            ))}
            {devices.length === 0 && <Text style={styles.hint}>No devices found.</Text>}
          </Section>

          {/* Streaming */}
          <Section title="Streaming">
            <Row>
              <Btn
                label="Start Stream"
                onPress={safe(() => startStream())}
                disabled={
                  !isConfigured ||
                  registrationState !== "registered" ||
                  permissionStatus !== "granted" ||
                  streamState === "streaming" ||
                  streamState === "starting"
                }
              />
              <Btn
                label="Stop Stream"
                onPress={safe(stopStream)}
                disabled={streamState === "stopped"}
              />
            </Row>
            <Btn
              label="Capture Photo (JPEG)"
              onPress={safe(() => capturePhoto("jpeg"))}
              disabled={streamState !== "streaming"}
            />

            {/* Camera preview */}
            <View style={styles.previewContainer}>
              <EMWDATStreamView
                isActive={streamState === "streaming"}
                resizeMode="contain"
                style={styles.preview}
              />
              {streamState !== "streaming" && (
                <View style={styles.previewOverlay}>
                  <Text style={styles.previewText}>
                    {streamState === "stopped" ? "Stream not active" : streamState}
                  </Text>
                </View>
              )}
            </View>
          </Section>

          {/* Last Photo */}
          {lastPhoto && (
            <Section title="Last Photo">
              <Image
                source={{ uri: `file://${lastPhoto.filePath}` }}
                style={styles.photoPreview}
                resizeMode="contain"
              />
              <StatusRow label="Format" value={lastPhoto.format} />
              <StatusRow
                label="Size"
                value={
                  lastPhoto.width && lastPhoto.height
                    ? `${lastPhoto.width}x${lastPhoto.height}`
                    : "unknown"
                }
              />
              <Text style={styles.filePath} numberOfLines={2}>
                {lastPhoto.filePath}
              </Text>
              <Btn label="Delete Photo" onPress={() => setLastPhoto(null)} />
            </Section>
          )}

          {/* URL Handling */}
          <Section title="URL Handling">
            <Btn
              label="Test handleUrl"
              onPress={async () => {
                const handled = await handleUrl("emwdat-example://callback");
                Alert.alert("handleUrl", `Handled: ${handled}`);
              }}
              disabled={!isConfigured}
            />
            <Text style={styles.hint}>
              In production, URLs are handled automatically via AppDelegateSubscriber.
            </Text>
          </Section>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// =============================================================================
// Components
// =============================================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

function Btn({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        disabled && styles.btnDisabled,
        pressed && !disabled && styles.btnPressed,
      ]}
    >
      <Text style={[styles.btnText, disabled && styles.btnTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

function StatusRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={[styles.statusValue, color ? { color } : undefined]}>{value}</Text>
    </View>
  );
}

function DeviceCard({ device }: { device: Device }) {
  return (
    <View style={styles.deviceCard}>
      <Text style={styles.deviceName}>{device.name || "Unnamed Device"}</Text>
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

// =============================================================================
// Helpers
// =============================================================================

function registrationColor(state: RegistrationState): string {
  switch (state) {
    case "registered":
      return "#22c55e";
    case "registering":
      return "#f59e0b";
    case "available":
      return "#3b82f6";
    default:
      return "#94a3b8";
  }
}

function permissionColor(status: PermissionStatus): string {
  return status === "granted" ? "#22c55e" : "#ef4444";
}

function streamColor(state: StreamSessionState): string {
  switch (state) {
    case "streaming":
      return "#22c55e";
    case "starting":
    case "waitingForDevice":
      return "#f59e0b";
    case "stopping":
    case "paused":
      return "#3b82f6";
    default:
      return "#94a3b8";
  }
}

function formatError(error: StreamSessionError): string {
  if ("deviceId" in error) {
    return `${error.type} (${error.deviceId})`;
  }
  return error.type;
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
    color: "#0f172a",
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  btn: {
    flex: 1,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 8,
  },
  btnPressed: {
    backgroundColor: "#2563eb",
  },
  btnDisabled: {
    backgroundColor: "#e2e8f0",
  },
  btnText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  btnTextDisabled: {
    color: "#94a3b8",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  statusLabel: {
    color: "#64748b",
    fontSize: 14,
  },
  statusValue: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "500",
  },
  hint: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4,
  },
  previewContainer: {
    height: 240,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#0f172a",
    marginTop: 8,
  },
  preview: {
    flex: 1,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  previewText: {
    color: "#64748b",
    fontSize: 14,
  },
  photoPreview: {
    height: 240,
    borderRadius: 8,
    backgroundColor: "#0f172a",
    marginBottom: 8,
  },
  filePath: {
    color: "#64748b",
    fontSize: 11,
    fontFamily: "Courier",
    marginTop: 4,
  },
  deviceCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
});
