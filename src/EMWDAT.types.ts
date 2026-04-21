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
  | "rayBanMetaOptics"
  | "unknown";

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

export type VideoCodec = "raw" | "hvc1";

export interface StreamSessionConfig {
  videoCodec: VideoCodec;
  resolution: StreamingResolution;
  frameRate: number;
  /** Target a specific device by identifier. When omitted, auto-selects a connected device. */
  deviceId?: DeviceIdentifier;
  /**
   * When true, the SDK delivers compressed HEVC buffers instead of decoded YUV pixel data.
   * On iOS this maps to videoCodec "hvc1". On Android it uses StreamConfiguration.compressVideo.
   * Default: false.
   */
  compressVideo?: boolean;
  /**
   * Whether to skip launching the native app on the device when starting the stream.
   * iOS only. Default: false.
   */
  skipAppLaunch?: boolean;
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
  /** Whether this frame contains compressed HEVC data (true) or decoded pixel data (false). */
  isCompressed?: boolean;
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
// DEVICE SESSION
// =============================================================================

/**
 * Lifecycle of a DeviceSession: idle → starting → started → paused → stopping → stopped.
 * `stopped` is terminal — create a new session via createSession().
 */
export type DeviceSessionState =
  | "idle"
  | "starting"
  | "started"
  | "paused"
  | "stopping"
  | "stopped";

/**
 * Errors that can occur during DeviceSession operations.
 */
export type DeviceSessionErrorCode =
  | "noEligibleDevice"
  | "sessionAlreadyStopped"
  | "sessionAlreadyExists"
  | "sessionIdle"
  | "capabilityAlreadyActive"
  | "capabilityNotFound"
  | "unexpectedError";

/**
 * State of a capability (e.g. Stream) attached to a DeviceSession.
 */
export type CapabilityState = "active" | "stopped";

// =============================================================================
// MOCK DEVICE
// =============================================================================

/**
 * Configuration for enabling MockDeviceKit.
 */
export interface MockDeviceKitConfig {
  /** Whether to start in registered state. Default: true. */
  initiallyRegistered?: boolean;
  /** Whether camera permission starts as granted. Default: true. */
  initialPermissionsGranted?: boolean;
}

/**
 * Which phone camera to use as mock device camera source.
 */
export type CameraFacing = "front" | "back";

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
  | { type: "permissionDenied" }
  | { type: "hingesClosed" }
  | { type: "thermalCritical" };

export type StreamSessionErrorCode = StreamSessionError["type"];

export type CaptureError =
  | "deviceDisconnected"
  | "notStreaming"
  | "captureInProgress"
  | "captureFailed";

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
  onDeviceSessionStateChange: (payload: { sessionId: string; state: DeviceSessionState }) => void;
  onDeviceSessionError: (payload: {
    sessionId: string;
    error: DeviceSessionErrorCode;
    message?: string;
  }) => void;
  onCapabilityStateChange: (payload: { sessionId: string; state: CapabilityState }) => void;
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
  onDeviceSessionStateChange?: (sessionId: string, state: DeviceSessionState) => void;
  onDeviceSessionError?: (
    sessionId: string,
    error: DeviceSessionErrorCode,
    message?: string
  ) => void;
  onCapabilityStateChange?: (sessionId: string, state: CapabilityState) => void;
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
  isConfiguring: boolean;
  configError: Error | null;
  registrationState: RegistrationState;
  permissionStatus: PermissionStatus;
  devices: Device[];
  deviceSessionStates: Record<string, DeviceSessionState>;
  deviceSessionErrors: Record<string, { error: DeviceSessionErrorCode; message?: string }>;
  capabilityStates: Record<string, CapabilityState>;
  streamState: StreamSessionState;

  // Actions — configuration
  configure: () => Promise<void>;
  setLogLevel: (level: LogLevel) => void;

  // Actions — registration
  startRegistration: () => Promise<void>;
  startUnregistration: () => Promise<void>;

  // Actions — permissions
  checkPermissionStatus: (permission: Permission) => Promise<PermissionStatus>;
  requestPermission: (permission: Permission) => Promise<PermissionStatus>;

  // Actions — devices
  getDevice: (identifier: DeviceIdentifier) => Promise<Device | null>;
  refreshDevices: () => Promise<Device[]>;

  // Actions — session-based streaming
  createSession: (deviceId?: DeviceIdentifier) => Promise<string>;
  startSession: (sessionId: string) => Promise<void>;
  stopSession: (sessionId: string) => Promise<void>;
  addStreamToSession: (sessionId: string, config?: Partial<StreamSessionConfig>) => Promise<void>;
  removeStreamFromSession: (sessionId: string) => Promise<void>;
  capturePhoto: (format?: PhotoCaptureFormat) => Promise<void>;

  // Actions — mock device kit
  enableMockDeviceKit: (config?: MockDeviceKitConfig) => Promise<void>;
  disableMockDeviceKit: () => Promise<void>;
  isMockDeviceKitEnabled: () => Promise<boolean>;
  pairMockDevice: () => Promise<string>;
  unpairMockDevice: (deviceId: string) => Promise<void>;
  mockSetPermissionStatus: (permission: Permission, status: PermissionStatus) => Promise<void>;
  mockSetPermissionRequestResult: (
    permission: Permission,
    result: PermissionStatus
  ) => Promise<void>;
  mockDeviceSetCameraFeedFromCamera: (id: string, facing: CameraFacing) => Promise<void>;
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
  /** Client Token from Meta Wearables Developer Center */
  clientToken?: string;
  /** Custom NSBluetoothAlwaysUsageDescription */
  bluetoothUsageDescription?: string;
  /** GitHub token for accessing Meta Wearables Maven packages. Falls back to GITHUB_TOKEN env var. */
  githubToken?: string;
}
