/**
 * Meta Wearables Module Types
 *
 * TypeScript definitions matching the native Meta Wearables DAT SDK.
 * Uses union types for type-safe string literals.
 */

// =============================================================================
// LOG LEVEL
// =============================================================================

/**
 * Log levels for the Meta Wearables module
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "none";

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * Registration state with the Meta AI platform
 * - unavailable: Registration is not available, typically due to system constraints
 * - available: Registration is available and can be initiated
 * - registering: Registration process is in progress
 * - registered: User is successfully registered with the platform
 */
export type RegistrationState = "unavailable" | "available" | "registering" | "registered";

// =============================================================================
// PERMISSIONS
// =============================================================================

/**
 * Permission types that can be requested from AI glasses
 */
export type Permission = "camera";

/**
 * Status of a permission request
 */
export type PermissionStatus = "granted" | "denied";

// =============================================================================
// DEVICE
// =============================================================================

/**
 * Unique identifier for a device
 */
export type DeviceIdentifier = string;

/**
 * Connection state of a device
 */
export type LinkState = "connected" | "disconnected";

/**
 * Device compatibility with the DAT SDK
 */
export type Compatibility = "compatible" | "incompatible";

/**
 * Type of wearable device
 */
export type DeviceType = "rayBanMeta" | "unknown";

/**
 * State of the device's hinge mechanism
 */
export type HingeState = "open" | "closed" | "unknown";

/**
 * Current state of a device including battery and hinge
 */
export interface DeviceState {
  /** Battery level as percentage (0-100) */
  batteryLevel: number;
  /** Current hinge state */
  hingeState: HingeState;
}

/**
 * Represents a connected wearable device
 */
export interface Device {
  /** Unique identifier for this device */
  identifier: DeviceIdentifier;
  /** Human-readable device name, or empty string if unavailable */
  name: string;
  /** Current connection state */
  linkState: LinkState;
  /** Device type */
  deviceType: DeviceType;
  /** Compatibility status with the SDK */
  compatibility: Compatibility;
}

// =============================================================================
// STREAMING
// =============================================================================

/**
 * Video streaming resolution options
 * - high: 720 × 1280
 * - medium: 504 × 896
 * - low: 360 × 640
 */
export type StreamingResolution = "high" | "medium" | "low";

/**
 * Video codec options for streaming
 */
export type VideoCodec = "raw" | "h264" | "h265";

/**
 * Configuration for a camera stream session
 */
export interface StreamSessionConfig {
  /** Video codec to use */
  videoCodec: VideoCodec;
  /** Streaming resolution */
  resolution: StreamingResolution;
  /** Frame rate (valid values: 2, 7, 15, 24, 30) */
  frameRate: number;
}

/**
 * State of a streaming session
 */
export type StreamSessionState =
  | "stopping"
  | "stopped"
  | "waitingForDevice"
  | "starting"
  | "streaming"
  | "paused";

/**
 * Video frame data from a stream
 */
export interface VideoFrame {
  /** Frame width in pixels */
  width: number;
  /** Frame height in pixels */
  height: number;
  /** Frame timestamp in milliseconds */
  timestamp: number;
  /** Base64 encoded frame data (only if not using native view) */
  base64?: string;
}

// =============================================================================
// PHOTO CAPTURE
// =============================================================================

/**
 * Photo capture format options
 */
export type PhotoCaptureFormat = "jpeg" | "heic";

/**
 * Captured photo data
 */
export interface PhotoData {
  /** Photo width in pixels */
  width: number;
  /** Photo height in pixels */
  height: number;
  /** Photo format */
  format: PhotoCaptureFormat;
  /** Capture timestamp in milliseconds */
  timestamp: number;
  /** File path to the saved photo */
  filePath: string;
  /** Base64 encoded photo data (optional, for small photos) */
  base64?: string;
}

// =============================================================================
// ERRORS
// =============================================================================

/**
 * Base error type for Meta Wearables
 */
export interface MetaWearablesError {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Wearables SDK configuration errors
 */
export type WearablesErrorCode = "alreadyConfigured" | "configurationFailed" | "notConfigured";

/**
 * Registration flow errors
 */
export type RegistrationErrorCode = "unavailable" | "cancelled" | "failed" | "metaAppNotInstalled";

/**
 * Permission request errors
 */
export type PermissionErrorCode = "requestFailed" | "denied" | "notRegistered";

/**
 * Stream session errors
 */
export type StreamSessionErrorCode =
  | "deviceNotFound"
  | "deviceNotConnected"
  | "timeout"
  | "permissionDenied"
  | "internalError"
  | "sessionAlreadyActive"
  | "sessionNotActive";

/**
 * Video decoder errors
 */
export type DecoderErrorCode = "decodeFailed" | "invalidData" | "unsupportedCodec";

// =============================================================================
// CALLBACK TYPES
// =============================================================================

/**
 * Callback function types for the useMetaWearables hook
 */
export interface MetaWearablesCallbacks {
  /** Called when registration state changes */
  onRegistrationStateChange?: (state: RegistrationState) => void;
  /** Called when the device list changes */
  onDevicesChange?: (devices: Device[]) => void;
  /** Called when a device's link state changes */
  onDeviceLinkStateChange?: (deviceId: DeviceIdentifier, linkState: LinkState) => void;
  /** Called when stream session state changes */
  onStreamStateChange?: (state: StreamSessionState) => void;
  /** Called when a stream error occurs */
  onStreamError?: (error: MetaWearablesError) => void;
  /** Called when a photo is captured */
  onPhotoCaptured?: (photo: PhotoData) => void;
  /** Called when permission status changes */
  onPermissionStatusChange?: (permission: Permission, status: PermissionStatus) => void;
}

// =============================================================================
// NATIVE MODULE EVENTS
// =============================================================================

/**
 * Event names emitted by the native module
 */
export const MetaWearablesEvents = {
  RegistrationStateChange: "onRegistrationStateChange",
  DevicesChange: "onDevicesChange",
  DeviceLinkStateChange: "onDeviceLinkStateChange",
  StreamStateChange: "onStreamStateChange",
  StreamError: "onStreamError",
  PhotoCaptured: "onPhotoCaptured",
  PermissionStatusChange: "onPermissionStatusChange",
} as const;

export type MetaWearablesEventName = (typeof MetaWearablesEvents)[keyof typeof MetaWearablesEvents];

// =============================================================================
// SESSION STATE (for DeviceStateSession)
// =============================================================================

/**
 * State of a device monitoring session
 * NOTE: DeviceStateSession (battery/hinge monitoring) is available in the native SDK
 * but not implemented in this module. See DeviceStateSession.md for details.
 */
export type SessionState = "idle" | "active" | "stopped";
