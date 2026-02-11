import { File as ExpoFile } from "expo-file-system";
import { useMetaWearables, EMWDATStreamView } from "expo-meta-wearables-dat";
import type {
  Device,
  StreamSessionError,
  PhotoData,
  PhotoCaptureFormat,
  StreamingResolution,
  StreamSessionState,
  RegistrationState,
  LogLevel,
} from "expo-meta-wearables-dat";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// =============================================================================
// Types
// =============================================================================

interface LogEntry {
  id: number;
  time: string;
  message: string;
  color?: string;
}

// =============================================================================
// Main App
// =============================================================================

const MAX_LOG_ENTRIES = 50;
let logId = Date.now();

export default function App() {
  const [lastPhoto, setLastPhoto] = useState<PhotoData | null>(null);
  const [resolution, setResolution] = useState<StreamingResolution>("low");
  const [frameRate, setFrameRate] = useState<number>(15);
  const [photoFormat, setPhotoFormat] = useState<PhotoCaptureFormat>("jpeg");
  const [logLevel, setLogLevelState] = useState<LogLevel>("debug");
  const [eventLog, setEventLog] = useState<LogEntry[]>([]);

  // Frame stats
  const [fps, setFps] = useState(0);
  const [frameDimensions, setFrameDimensions] = useState("");
  const frameCountRef = useRef(0);
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLogEntry = useCallback((message: string, color?: string) => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setEventLog((prev) => {
      const next = [{ id: ++logId, time, message, color }, ...prev];
      return next.length > MAX_LOG_ENTRIES ? next.slice(0, MAX_LOG_ENTRIES) : next;
    });
  }, []);

  const {
    // State
    isConfigured,
    registrationState,
    permissionStatus,
    devices,
    streamState,
    lastError,
    // Actions
    setLogLevel: nativeSetLogLevel,
    startRegistration,
    startUnregistration,
    requestPermission,
    refreshDevices,
    startStream,
    stopStream,
    capturePhoto,
  } = useMetaWearables({
    logLevel,
    onRegistrationStateChange: (state) => {
      addLogEntry(`Registration → ${state}`, registrationColor(state));
    },
    onDevicesChange: (deviceList) => {
      addLogEntry(`Devices updated (${deviceList.length})`);
    },
    onLinkStateChange: (deviceId, linkState) => {
      const color =
        linkState === "connected" ? "#22c55e" : linkState === "connecting" ? "#f59e0b" : "#94a3b8";
      addLogEntry(`Device ${deviceId.slice(0, 8)}… → ${linkState}`, color);
    },
    onStreamStateChange: (state) => {
      addLogEntry(`Stream → ${state}`, streamColor(state));
    },
    onVideoFrame: (metadata) => {
      frameCountRef.current++;
      setFrameDimensions(`${metadata.width}×${metadata.height}`);
    },
    onPhotoCaptured: (photo) => {
      addLogEntry(`Photo captured (${photo.format})`, "#22c55e");
      setLastPhoto(photo);
    },
    onStreamError: (error) => {
      addLogEntry(`Stream error: ${formatError(error)}`, "#ef4444");
    },
    onPermissionStatusChange: (permission, status) => {
      const color = status === "granted" ? "#22c55e" : "#ef4444";
      addLogEntry(`Permission ${permission} → ${status}`, color);
    },
  });

  // FPS counter interval
  useEffect(() => {
    if (streamState === "streaming") {
      frameCountRef.current = 0;
      setFps(0);
      fpsIntervalRef.current = setInterval(() => {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
      }, 1000);
    } else {
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current);
        fpsIntervalRef.current = null;
      }
      setFps(0);
      setFrameDimensions("");
    }
    return () => {
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current);
      }
    };
  }, [streamState]);

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

  const handleLogLevelChange = (level: string) => {
    const l = level as LogLevel;
    setLogLevelState(l);
    nativeSetLogLevel(l);
    addLogEntry(`Log level → ${l}`);
  };

  const deletePhoto = () => {
    if (!lastPhoto) return;
    try {
      const file = new ExpoFile(`file://${lastPhoto.filePath}`);
      if (file.exists) {
        file.delete();
      }
      addLogEntry("Photo deleted from disk", "#ef4444");
    } catch {
      // File may already be gone
    }
    setLastPhoto(null);
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
              value={permissionStatus === "granted" ? "granted" : "not granted"}
              color={permissionStatus === "granted" ? "#22c55e" : "#ef4444"}
            />
            <StatusRow label="Stream" value={streamState} color={streamColor(streamState)} />
            {lastError && (
              <StatusRow label="Last Error" value={formatError(lastError)} color="#ef4444" />
            )}
          </Section>

          {/* Log Level */}
          <Section title="Log Level">
            <OptionRow options={LOG_LEVELS} selected={logLevel} onSelect={handleLogLevelChange} />
          </Section>

          {/* Registration */}
          <Section title="Registration">
            <Row>
              <Btn
                label="Register"
                onPress={safe(startRegistration)}
                disabled={
                  !isConfigured ||
                  registrationState === "registered" ||
                  registrationState === "registering"
                }
              />
              <Btn
                label="Unregister"
                variant="destructive"
                onPress={safe(startUnregistration)}
                disabled={!isConfigured || registrationState !== "registered"}
              />
            </Row>
            <Text style={styles.hint}>Opens Meta AI app for registration flow.</Text>
          </Section>

          {/* Permissions */}
          <Section title="Permissions">
            <Btn
              label="Request Camera Permission"
              onPress={safe(() => requestPermission("camera"))}
              disabled={
                !isConfigured ||
                registrationState !== "registered" ||
                permissionStatus === "granted"
              }
            />
            {permissionStatus === "granted" && (
              <Text style={styles.hint}>Camera permission already granted.</Text>
            )}
          </Section>

          {/* Devices */}
          <Section title={`Devices (${devices.length})`}>
            <Btn
              label="Refresh Devices"
              onPress={safe(refreshDevices)}
              disabled={!isConfigured || registrationState !== "registered"}
            />
            {devices.map((device) => (
              <DeviceCard key={device.identifier} device={device} />
            ))}
            {devices.length === 0 && <Text style={styles.hint}>No devices found.</Text>}
          </Section>

          {/* Streaming */}
          <Section title="Streaming">
            <Text style={styles.optionLabel}>Resolution</Text>
            <OptionRow
              options={RESOLUTIONS}
              selected={resolution}
              onSelect={(v) => setResolution(v as StreamingResolution)}
              disabled={streamState === "streaming" || streamState === "starting"}
            />
            <Text style={styles.optionLabel}>Frame Rate</Text>
            <OptionRow
              options={FRAME_RATES}
              selected={String(frameRate)}
              onSelect={(v) => setFrameRate(Number(v))}
              disabled={streamState === "streaming" || streamState === "starting"}
            />
            <Row>
              <Btn
                label="Start Stream"
                variant="success"
                onPress={safe(async () => {
                  if (permissionStatus !== "granted") {
                    const status = await requestPermission("camera");
                    if (status !== "granted") {
                      throw new Error("Camera permission is required to stream.");
                    }
                  }
                  await startStream({ resolution, frameRate, videoCodec: "raw" });
                })}
                disabled={
                  !isConfigured ||
                  registrationState !== "registered" ||
                  streamState === "streaming" ||
                  streamState === "starting"
                }
              />
              <Btn
                label="Stop Stream"
                variant="destructive"
                onPress={safe(stopStream)}
                disabled={streamState === "stopped"}
              />
            </Row>

            <Text style={styles.optionLabel}>Photo Format</Text>
            <OptionRow
              options={PHOTO_FORMATS}
              selected={photoFormat}
              onSelect={(v) => setPhotoFormat(v as PhotoCaptureFormat)}
            />
            <Btn
              label={`Capture Photo (${photoFormat.toUpperCase()})`}
              variant="success"
              onPress={safe(() => capturePhoto(photoFormat))}
              disabled={streamState !== "streaming"}
            />

            {/* Camera preview */}
            <View style={styles.previewContainer}>
              <EMWDATStreamView
                isActive={streamState === "streaming"}
                resizeMode="contain"
                style={styles.preview}
              />
              {streamState === "streaming" && (fps > 0 || frameDimensions) ? (
                <View style={styles.frameStats}>
                  <Text style={styles.frameStatsText}>
                    {fps} fps{frameDimensions ? ` | ${frameDimensions}` : ""}
                  </Text>
                </View>
              ) : null}
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
              <View style={{ height: 8 }} />
              <Btn variant="destructive" label="Delete Photo" onPress={deletePhoto} />
            </Section>
          )}

          {/* Event Log */}
          <Section title="Event Log">
            <View style={styles.eventLog}>
              <ScrollView style={styles.eventLogScroll} nestedScrollEnabled>
                {eventLog.length === 0 && <Text style={styles.hint}>No events yet.</Text>}
                {eventLog.map((entry) => (
                  <View key={entry.id} style={styles.eventLogEntry}>
                    <Text style={styles.eventLogTime}>{entry.time}</Text>
                    <Text
                      style={[
                        styles.eventLogMessage,
                        entry.color ? { color: entry.color } : undefined,
                      ]}
                    >
                      {entry.message}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
            {eventLog.length > 0 && (
              <Btn label="Clear Log" variant="destructive" onPress={() => setEventLog([])} />
            )}
          </Section>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// =============================================================================
// Constants
// =============================================================================

const LOG_LEVELS = [
  { label: "Debug", value: "debug" },
  { label: "Info", value: "info" },
  { label: "Warn", value: "warn" },
  { label: "Error", value: "error" },
  { label: "None", value: "none" },
];

const RESOLUTIONS = [
  { label: "Low\n(360x640)", value: "low" },
  { label: "Medium\n(504x896)", value: "medium" },
  { label: "High\n(720x1280)", value: "high" },
];

const FRAME_RATES = [
  { label: "2", value: "2" },
  { label: "7", value: "7" },
  { label: "15", value: "15" },
  { label: "24", value: "24" },
  { label: "30", value: "30" },
];

const PHOTO_FORMATS = [
  { label: "JPEG", value: "jpeg" },
  { label: "HEIC", value: "heic" },
];

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

function OptionRow({
  options,
  selected,
  onSelect,
  disabled,
}: {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.optionRow}>
      {options.map((opt) => {
        const active = opt.value === selected;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            disabled={disabled}
            style={[
              styles.optionChip,
              active && styles.optionChipActive,
              disabled && styles.optionChipDisabled,
            ]}
          >
            <Text
              style={[
                styles.optionChipText,
                active && styles.optionChipTextActive,
                disabled && styles.optionChipTextDisabled,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Btn({
  label,
  onPress,
  disabled,
  variant,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive" | "success";
}) {
  const isDestructive = variant === "destructive";
  const isSuccess = variant === "success";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        isDestructive && styles.btnDestructive,
        isSuccess && styles.btnSuccess,
        disabled && styles.btnDisabled,
        pressed &&
          !disabled &&
          (isDestructive
            ? styles.btnDestructivePressed
            : isSuccess
              ? styles.btnSuccessPressed
              : styles.btnPressed),
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
  const isDisconnected = device.linkState === "disconnected";
  return (
    <View style={[styles.deviceCard, isDisconnected && styles.deviceCardDisconnected]}>
      <View style={styles.deviceHeader}>
        <Text style={[styles.deviceName, isDisconnected && styles.deviceNameDisconnected]}>
          {device.name || "Unnamed Device"}
        </Text>
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
  optionLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  optionRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  optionChip: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  optionChipActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  optionChipDisabled: {
    opacity: 0.5,
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#334155",
    textAlign: "center",
  },
  optionChipTextActive: {
    color: "#ffffff",
  },
  optionChipTextDisabled: {
    color: "#94a3b8",
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
  btnDestructive: {
    backgroundColor: "#ef4444",
  },
  btnPressed: {
    backgroundColor: "#2563eb",
  },
  btnSuccess: {
    backgroundColor: "#22c55e",
  },
  btnSuccessPressed: {
    backgroundColor: "#16a34a",
  },
  btnDestructivePressed: {
    backgroundColor: "#dc2626",
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
  frameStats: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  frameStatsText: {
    color: "#22c55e",
    fontSize: 12,
    fontFamily: "Courier",
    fontWeight: "600",
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
    marginBottom: 4,
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
  eventLog: {
    height: 200,
    backgroundColor: "#0f172a",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  eventLogScroll: {
    flex: 1,
  },
  eventLogEntry: {
    flexDirection: "row",
    marginBottom: 4,
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
