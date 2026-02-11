import { Feather } from "@expo/vector-icons";
import { EMWDATStreamView } from "expo-meta-wearables-dat";
import type {
  PhotoCaptureFormat,
  StreamingResolution,
  StreamSessionState,
} from "expo-meta-wearables-dat";
import { Alert, StyleSheet, Text, View } from "react-native";

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
  onResolutionChange: (v: StreamingResolution) => void;
  onFrameRateChange: (v: number) => void;
  onPhotoFormatChange: (v: PhotoCaptureFormat) => void;
  onStartStream: () => void;
  onStopStream: () => void;
  onCapturePhoto: () => void;
}) {
  const streamActive = streamState === "streaming" || streamState === "starting";

  return (
    <Section title="Streaming">
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
