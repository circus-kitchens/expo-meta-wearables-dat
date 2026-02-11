import type {
  RegistrationState,
  StreamSessionState,
  StreamSessionError,
} from "expo-meta-wearables-dat";

// =============================================================================
// Types
// =============================================================================

export interface LogEntry {
  id: number;
  time: string;
  message: string;
  color?: string;
}

// =============================================================================
// Constants
// =============================================================================

export const MAX_LOG_ENTRIES = 50;

export const LOG_LEVELS = [
  { label: "Debug", value: "debug" },
  { label: "Info", value: "info" },
  { label: "Warn", value: "warn" },
  { label: "Error", value: "error" },
  { label: "None", value: "none" },
];

export const RESOLUTIONS = [
  { label: "Low\n(360x640)", value: "low" },
  { label: "Medium\n(504x896)", value: "medium" },
  { label: "High\n(720x1280)", value: "high" },
];

export const FRAME_RATES = [
  { label: "2", value: "2" },
  { label: "7", value: "7" },
  { label: "15", value: "15" },
  { label: "24", value: "24" },
  { label: "30", value: "30" },
];

export const PHOTO_FORMATS = [
  { label: "JPEG", value: "jpeg" },
  { label: "HEIC", value: "heic" },
];

// =============================================================================
// Helpers
// =============================================================================

export function registrationColor(state: RegistrationState): string {
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

export function streamColor(state: StreamSessionState): string {
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

export function formatError(error: StreamSessionError): string {
  if ("deviceId" in error) {
    return `${error.type} (${error.deviceId})`;
  }
  return error.type;
}
