import { Feather } from "@expo/vector-icons";
import { File as ExpoFile } from "expo-file-system";
import { useMetaWearables } from "expo-meta-wearables-dat";
import type {
  PhotoData,
  PhotoCaptureFormat,
  StreamingResolution,
  DeviceIdentifier,
  LogLevel,
} from "expo-meta-wearables-dat";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { DeviceCard } from "./components/device-card";
import { EventLog } from "./components/event-log";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import { MockDevicePanel } from "./components/mock-device-panel";
import { PhotoPreview } from "./components/photo-preview";
import { StreamPreview } from "./components/stream-preview";
import { Btn, OptionRow, Row, Section, StatusRow } from "./components/ui";
import {
  LOG_LEVELS,
  MAX_LOG_ENTRIES,
  formatError,
  registrationColor,
  streamColor,
} from "./components/utils";
import type { LogEntry } from "./components/utils";

// =============================================================================
// Main App
// =============================================================================

let logId = Date.now();

export default function App() {
  const [lastPhoto, setLastPhoto] = useState<PhotoData | null>(null);
  const [resolution, setResolution] = useState<StreamingResolution>("low");
  const [frameRate, setFrameRate] = useState<number>(15);
  const [photoFormat, setPhotoFormat] = useState<PhotoCaptureFormat>("jpeg");
  const [selectedDeviceId, setSelectedDeviceId] = useState<DeviceIdentifier | null>(null);
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
          <Header />

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
          <Section
            title={`Devices (${devices.length})`}
            action={
              <Pressable
                onPress={safe(refreshDevices)}
                disabled={!isConfigured || registrationState !== "registered"}
                style={[
                  styles.sectionAction,
                  { opacity: !isConfigured || registrationState !== "registered" ? 0.3 : 1 },
                ]}
              >
                <Feather name="refresh-cw" size={14} color="#64748b" />
                <Text style={styles.sectionActionText}>Refresh</Text>
              </Pressable>
            }
          >
            {devices.map((device) => (
              <DeviceCard key={device.identifier} device={device} />
            ))}
            {devices.length === 0 && <Text style={styles.hint}>No devices found.</Text>}
          </Section>

          {/* Mock Devices (DEBUG only) */}
          {__DEV__ && <MockDevicePanel />}

          {/* Streaming */}
          <StreamPreview
            streamState={streamState}
            fps={fps}
            frameDimensions={frameDimensions}
            resolution={resolution}
            frameRate={frameRate}
            photoFormat={photoFormat}
            isConfigured={isConfigured}
            registrationState={registrationState}
            permissionStatus={permissionStatus}
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            onDeviceSelect={setSelectedDeviceId}
            onResolutionChange={setResolution}
            onFrameRateChange={setFrameRate}
            onPhotoFormatChange={setPhotoFormat}
            onStartStream={safe(async () => {
              if (permissionStatus !== "granted") {
                const status = await requestPermission("camera");
                if (status !== "granted") {
                  throw new Error("Camera permission is required to stream.");
                }
              }
              await startStream({
                resolution,
                frameRate,
                videoCodec: "raw",
                ...(selectedDeviceId ? { deviceId: selectedDeviceId } : {}),
              });
            })}
            onStopStream={safe(stopStream)}
            onCapturePhoto={safe(() => capturePhoto(photoFormat))}
          />

          {/* Last Photo */}
          {lastPhoto && <PhotoPreview photo={lastPhoto} onDelete={deletePhoto} />}

          {/* Log Level */}
          <Section title="Log Level">
            <OptionRow options={LOG_LEVELS} selected={logLevel} onSelect={handleLogLevelChange} />
          </Section>

          {/* Event Log */}
          <EventLog eventLog={eventLog} onClear={() => setEventLog([])} />

          <Footer />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
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
    padding: 20,
    paddingBottom: 48,
  },
  hint: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 6,
  },
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
});
