import type { StyleProp, ViewStyle } from "react-native";

// =============================================================================
// LOG LEVEL
// =============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error" | "none";

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * Registration state flow: unavailable → available → registering → registered
 */
export type RegistrationState = "unavailable" | "available" | "registering" | "registered";

// =============================================================================
// PERMISSIONS
// =============================================================================

export type Permission = "camera";

export type PermissionStatus = "granted" | "denied";

// =============================================================================
// DEVICE
// =============================================================================

export type DeviceIdentifier = string;

export type LinkState = "connected" | "disconnected" | "connecting";

export type Compatibility =
  | "compatible"
  | "undefined"
  | "deviceUpdateRequired"
  | "sdkUpdateRequired";

export type DeviceType =
  | "rayBanMeta"
  | "oakleyMetaHSTN"
  | "oakleyMetaVanguard"
  | "metaRayBanDisplay"
  | "unknown";

/** Forward declaration — SDK 0.4 has no public publisher for hinge state yet. */
export type HingeState = "open" | "closed";

/** Forward declaration — SDK 0.4 has no public publisher for device state yet. */
export interface DeviceState {
  batteryLevel: number;
  hingeState: HingeState;
}

export interface Device {
  identifier: DeviceIdentifier;
  name: string;
  linkState: LinkState;
  deviceType: DeviceType;
  compatibility: Compatibility;
}

// =============================================================================
// STREAMING
// =============================================================================

export type StreamingResolution = "high" | "medium" | "low";

export type VideoCodec = "raw";

export interface StreamSessionConfig {
  videoCodec: VideoCodec;
  resolution: StreamingResolution;
  frameRate: number;
}

/**
 * Stream session state flow: stopped → waitingForDevice → starting → streaming/paused → stopping → stopped
 */
export type StreamSessionState =
  | "stopping"
  | "stopped"
  | "waitingForDevice"
  | "starting"
  | "streaming"
  | "paused";

/**
 * Metadata sent over the bridge for each video frame.
 * Actual pixel data stays on the native side (rendered via EMWDATStreamView).
 */
export interface VideoFrameMetadata {
  timestamp: number;
  width: number;
  height: number;
}

// =============================================================================
// PHOTO CAPTURE
// =============================================================================

export type PhotoCaptureFormat = "jpeg" | "heic";

export interface PhotoData {
  filePath: string;
  format: PhotoCaptureFormat;
  timestamp: number;
  width?: number;
  height?: number;
  base64?: string;
}

// =============================================================================
// SESSION STATE (DeviceStateSession)
// =============================================================================

/**
 * Device session state lifecycle: stopped → waitingForDevice → running/paused → unknown
 * Exposed via onDeviceSessionStateChange event and deviceSessionStates in the hook.
 */
export type SessionState = "stopped" | "waitingForDevice" | "running" | "paused" | "unknown";

// =============================================================================
// ERRORS
// =============================================================================

export type WearablesErrorCode = "internalError" | "alreadyConfigured" | "configurationError";

export type RegistrationErrorCode =
  | "alreadyRegistered"
  | "configurationInvalid"
  | "metaAINotInstalled"
  | "networkUnavailable"
  | "unknown";

export type UnregistrationErrorCode =
  | "alreadyUnregistered"
  | "configurationInvalid"
  | "metaAINotInstalled"
  | "unknown";

export type PermissionErrorCode =
  | "noDevice"
  | "noDeviceWithConnection"
  | "connectionError"
  | "metaAINotInstalled"
  | "requestInProgress"
  | "requestTimeout"
  | "internalError";

export type WearablesHandleURLErrorCode = "registrationError" | "unregistrationError";

/** Discriminated union — errors with associated values carry extra fields. */
export type StreamSessionError =
  | { type: "internalError" }
  | { type: "deviceNotFound"; deviceId: DeviceIdentifier }
  | { type: "deviceNotConnected"; deviceId: DeviceIdentifier }
  | { type: "timeout" }
  | { type: "videoStreamingError" }
  | { type: "audioStreamingError" }
  | { type: "permissionDenied" }
  | { type: "hingesClosed" };

export type StreamSessionErrorCode = StreamSessionError["type"];

export type DecoderError =
  | { type: "unexpected" }
  | { type: "cancelled" }
  | { type: "invalidFormat" }
  | { type: "configurationError"; status: number }
  | { type: "decodingFailed"; status: number };

export type DecoderErrorCode = DecoderError["type"];

// =============================================================================
// NATIVE MODULE EVENTS
// =============================================================================

/** Event map — function signatures as required by Expo NativeModule<EventsMap>. */
export type EMWDATModuleEvents = {
  onRegistrationStateChange: (payload: { state: RegistrationState }) => void;
  onDevicesChange: (payload: { devices: Device[] }) => void;
  onLinkStateChange: (payload: { deviceId: DeviceIdentifier; linkState: LinkState }) => void;
  onStreamStateChange: (payload: { state: StreamSessionState }) => void;
  onVideoFrame: (payload: VideoFrameMetadata) => void;
  onPhotoCaptured: (payload: PhotoData) => void;
  onStreamError: (payload: StreamSessionError) => void;
  onPermissionStatusChange: (payload: { permission: Permission; status: PermissionStatus }) => void;
  onCompatibilityChange: (payload: {
    deviceId: DeviceIdentifier;
    compatibility: Compatibility;
  }) => void;
  onDeviceSessionStateChange: (payload: {
    deviceId: DeviceIdentifier;
    sessionState: SessionState;
  }) => void;
};

export type EMWDATEventName = keyof EMWDATModuleEvents;

// =============================================================================
// CALLBACKS (for hook consumers)
// =============================================================================

export interface MetaWearablesCallbacks {
  onRegistrationStateChange?: (state: RegistrationState) => void;
  onDevicesChange?: (devices: Device[]) => void;
  onLinkStateChange?: (deviceId: DeviceIdentifier, linkState: LinkState) => void;
  onStreamStateChange?: (state: StreamSessionState) => void;
  onVideoFrame?: (metadata: VideoFrameMetadata) => void;
  onPhotoCaptured?: (photo: PhotoData) => void;
  onStreamError?: (error: StreamSessionError) => void;
  onPermissionStatusChange?: (permission: Permission, status: PermissionStatus) => void;
  onCompatibilityChange?: (deviceId: DeviceIdentifier, compatibility: Compatibility) => void;
  onDeviceSessionStateChange?: (deviceId: DeviceIdentifier, sessionState: SessionState) => void;
}

// =============================================================================
// HOOK TYPES
// =============================================================================

export interface UseMetaWearablesOptions extends MetaWearablesCallbacks {
  /** Call configure() automatically on mount (default: true) */
  autoConfig?: boolean;
  /** Initial log level (default: "info") */
  logLevel?: LogLevel;
}

export interface UseMetaWearablesReturn {
  // State
  isConfigured: boolean;
  registrationState: RegistrationState;
  permissionStatus: PermissionStatus;
  devices: Device[];
  streamState: StreamSessionState;
  lastError: StreamSessionError | null;
  deviceSessionStates: Record<DeviceIdentifier, SessionState>;

  // Actions
  configure: () => Promise<void>;
  setLogLevel: (level: LogLevel) => void;
  startRegistration: () => Promise<void>;
  startUnregistration: () => Promise<void>;
  checkPermissionStatus: (permission: Permission) => Promise<PermissionStatus>;
  requestPermission: (permission: Permission) => Promise<PermissionStatus>;
  getDevice: (identifier: DeviceIdentifier) => Promise<Device | null>;
  refreshDevices: () => Promise<Device[]>;
  startStream: (config?: Partial<StreamSessionConfig>) => Promise<void>;
  stopStream: () => Promise<void>;
  capturePhoto: (format?: PhotoCaptureFormat) => Promise<void>;
}

// =============================================================================
// VIEW PROPS
// =============================================================================

export type StreamViewResizeMode = "contain" | "cover" | "stretch";

export interface EMWDATStreamViewProps {
  isActive?: boolean;
  resizeMode?: StreamViewResizeMode;
  style?: StyleProp<ViewStyle>;
}

// =============================================================================
// CONFIG PLUGIN
// =============================================================================

export interface EMWDATPluginProps {
  /** URL scheme for Meta AI app callback (required) */
  urlScheme: string;
  /** Meta App ID (defaults to "0") */
  metaAppId?: string;
  /** Custom NSBluetoothAlwaysUsageDescription */
  bluetoothUsageDescription?: string;
}
