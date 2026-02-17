import { Feather } from "@expo/vector-icons";
import { EMWDATStreamView } from "expo-meta-wearables-dat";
import type {
  Device,
  DeviceIdentifier,
  PhotoCaptureFormat,
  StreamingResolution,
  StreamSessionState,
} from "expo-meta-wearables-dat";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Btn, OptionRow, Row, Section } from "./ui";
import { FRAME_RATES, PHOTO_FORMATS, RESOLUTIONS } from "./utils";

export function StreamPreview({
  streamState,
  fps,
  frameDimensions,
  resolution,
  frameRate,
  photoFormat,
  isConfigured,
  registrationState,
  permissionStatus,
  devices,
  selectedDeviceId,
  onDeviceSelect,
  onResolutionChange,
  onFrameRateChange,
  onPhotoFormatChange,
  onStartStream,
  onStopStream,
  onCapturePhoto,
}: {
  streamState: StreamSessionState;
  fps: number;
  frameDimensions: string;
  resolution: StreamingResolution;
  frameRate: number;
  photoFormat: PhotoCaptureFormat;
  isConfigured: boolean;
  registrationState: string;
  permissionStatus: string;
  devices: Device[];
  selectedDeviceId: DeviceIdentifier | null;
  onDeviceSelect: (id: DeviceIdentifier | null) => void;
  onResolutionChange: (v: StreamingResolution) => void;
  onFrameRateChange: (v: number) => void;
  onPhotoFormatChange: (v: PhotoCaptureFormat) => void;
  onStartStream: () => void;
  onStopStream: () => void;
  onCapturePhoto: () => void;
}) {
  const streamActive = streamState !== "stopped";

  return (
    <Section title="Streaming">
      {/* Device selector */}
      <Text style={styles.optionLabel}>Device</Text>
      <View style={styles.deviceSelector}>
        <Pressable
          onPress={() => onDeviceSelect(null)}
          disabled={streamActive}
          style={[
            styles.deviceChip,
            !selectedDeviceId && styles.deviceChipActive,
            streamActive && styles.deviceChipDisabled,
          ]}
        >
          <Text
            style={[
              styles.deviceChipText,
              !selectedDeviceId && styles.deviceChipTextActive,
              streamActive && styles.deviceChipTextDisabled,
            ]}
          >
            Auto
          </Text>
        </Pressable>
        {devices.map((device) => {
          const active = selectedDeviceId === device.identifier;
          const isConnected = device.linkState === "connected";
          return (
            <Pressable
              key={device.identifier}
              onPress={() => onDeviceSelect(device.identifier)}
              disabled={streamActive}
              style={[
                styles.deviceChip,
                active && styles.deviceChipActive,
                streamActive && styles.deviceChipDisabled,
              ]}
            >
              <View style={styles.deviceChipContent}>
                <View
                  style={[
                    styles.deviceChipDot,
                    { backgroundColor: isConnected ? "#22c55e" : "#cbd5e1" },
                  ]}
                />
                <Text
                  style={[
                    styles.deviceChipText,
                    active && styles.deviceChipTextActive,
                    streamActive && styles.deviceChipTextDisabled,
                  ]}
                  numberOfLines={1}
                >
                  {device.name || device.identifier.slice(0, 8)}
                </Text>
              </View>
            </Pressable>
          );
        })}
        {devices.length === 0 && <Text style={styles.deviceHint}>No devices available</Text>}
      </View>

      <Text style={styles.optionLabel}>Resolution</Text>
      <OptionRow
        options={RESOLUTIONS}
        selected={resolution}
        onSelect={(v) => onResolutionChange(v as StreamingResolution)}
        disabled={streamActive}
      />
      <Text style={styles.optionLabel}>Frame Rate</Text>
      <OptionRow
        options={FRAME_RATES}
        selected={String(frameRate)}
        onSelect={(v) => onFrameRateChange(Number(v))}
        disabled={streamActive}
      />
      <Row>
        <Btn
          label="Start Stream"
          variant="success"
          onPress={onStartStream}
          disabled={!isConfigured || registrationState !== "registered" || streamActive}
        />
        <Btn
          label="Stop Stream"
          variant="destructive"
          onPress={onStopStream}
          disabled={streamState === "stopped"}
        />
      </Row>

      <Text style={styles.optionLabel}>Photo Format</Text>
      <OptionRow
        options={PHOTO_FORMATS}
        selected={photoFormat}
        onSelect={(v) => onPhotoFormatChange(v as PhotoCaptureFormat)}
      />
      <Btn
        label={`Capture Photo (${photoFormat.toUpperCase()})`}
        variant="success"
        onPress={
          streamState !== "streaming"
            ? () => Alert.alert("Stream required", "Start a stream before capturing a photo.")
            : onCapturePhoto
        }
        icon={<Feather name="camera" size={14} color="#ffffff" />}
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
  );
}

const styles = StyleSheet.create({
  optionLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  deviceSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  deviceChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  deviceChipActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  deviceChipDisabled: {
    opacity: 0.5,
  },
  deviceChipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deviceChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  deviceChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#334155",
  },
  deviceChipTextActive: {
    color: "#ffffff",
  },
  deviceChipTextDisabled: {
    color: "#94a3b8",
  },
  deviceHint: {
    fontSize: 12,
    color: "#94a3b8",
    paddingVertical: 8,
  },
  previewContainer: {
    height: 240,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#0f172a",
    marginTop: 12,
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
});
