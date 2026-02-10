# Wearables iOS Swift API Reference

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4

## Overview

The Wearables Device Access Toolkit SDK enables developers to integrate Meta's Wearables into iOS applications, providing APIs for device registration, connection management, and advanced features like real-time camera streaming and sensor access. This SDK simplifies permission handling and device selection, allowing apps to securely request and manage access to hardware features such as cameras and microphones, unlocking new interactive experiences for users.

## Swift API Surface

The SDK is organized into three main modules:

### MWDATCamera

Provides APIs for camera streaming and photo capture from Meta Wearables devices.

**Key Components:**

- **Classes:** `StreamSession`
- **Enumerations:** `DecoderError`, `PhotoCaptureFormat`, `StreamingResolution`, `StreamSessionError`, `StreamSessionState`, `VideoCodec`
- **Structs:** `PhotoData`, `StreamSessionConfig`, `VideoFrame`, `VideoFrameSize`

### MWDATCore

Core functionality for device registration, connection management, permissions, and session lifecycle.

**Key Components:**

- **Classes:** `AutoDeviceSelector`, `Device`, `DeviceStateSession`, `SpecificDeviceSelector`
- **Enumerations:** `DeviceType`, `HingeState`, `LinkState`, `Permission`, `PermissionError`, `PermissionStatus`, `RegistrationError`, `RegistrationState`, `SessionState`, `UnregistrationError`, `Wearables`, `WearablesError`, `WearablesHandleURLError`
- **Protocols:** `Announcer`, `AnyListenerToken`, `DeviceSelector`, `WearablesInterface`
- **Structs:** `DeviceState`, `Mutex`
- **Type Aliases:** `DeviceIdentifier`

### MWDATMockDevice

Testing and development utilities for simulating Meta Wearables devices without physical hardware.

**Key Components:**

- **Enumerations:** `MockDeviceKit`, `MockDeviceKitError`
- **Protocols:** `MockCameraKit`, `MockDevice`, `MockDeviceKitInterface`, `MockDisplaylessGlasses`, `MockRayBanMeta`

## Lifecycle and Threading Notes

- The SDK uses async/await patterns for asynchronous operations
- Device sessions must be properly managed through the session lifecycle
- Permission requests should be handled before accessing device features
- Thread-safe operations are provided through the `Mutex` struct in MWDATCore

## TypeScript

Mapping notes for TypeScript wrapper:

- Swift module names translate to TypeScript namespaces or prefixed type names
- Swift async methods map to Promise-based APIs in TypeScript
- Swift enums with associated values become discriminated unions in TypeScript
- Swift optionals (`T?`) map to `T | null` in TypeScript
- Swift protocols become TypeScript interfaces
- Device identifiers are string-based for cross-platform consistency

```ts
/**
 * Wearables Device Access Toolkit SDK for iOS
 *
 * Enables integration of Meta Wearables into applications with APIs for:
 * - Device registration and connection management
 * - Real-time camera streaming and photo capture
 * - Permission handling for hardware features (cameras, microphones)
 * - Sensor data access
 */

/**
 * Core namespace containing fundamental types and functionality
 */
export namespace MWDATCore {
  // Type aliases
  export type DeviceIdentifier = string;

  // Device types supported by the SDK
  export type DeviceType = "raybanMeta" | "displaylessGlasses" | "unknown";

  // Physical hinge state of wearable devices
  export type HingeState = "open" | "closed" | "unknown";

  // Connection state between app and device
  export type LinkState = "connected" | "disconnected" | "connecting";

  // Available hardware permissions
  export type Permission = "camera" | "microphone" | "sensors";

  // Permission request outcomes
  export type PermissionStatus = "granted" | "denied" | "notDetermined";

  // Device registration states
  export type RegistrationState = "registered" | "unregistered" | "registering";

  // Session lifecycle states
  export type SessionState = "active" | "inactive" | "starting" | "stopping";

  // Error types
  export type PermissionError =
    | { type: "denied"; permission: Permission }
    | { type: "notDetermined"; permission: Permission }
    | { type: "restricted"; permission: Permission };

  export type RegistrationError =
    | { type: "alreadyRegistered" }
    | { type: "deviceNotFound" }
    | { type: "networkError"; message: string }
    | { type: "invalidConfiguration" };

  export type UnregistrationError =
    | { type: "notRegistered" }
    | { type: "networkError"; message: string };

  export type WearablesError =
    | { type: "deviceNotConnected" }
    | { type: "sessionNotActive" }
    | { type: "permissionDenied"; permission: Permission }
    | { type: "unknownError"; message: string };

  export type WearablesHandleURLError =
    | { type: "invalidURL" }
    | { type: "unsupportedScheme" }
    | { type: "handlingFailed"; message: string };

  /**
   * Represents the current state of a wearable device
   */
  export interface DeviceState {
    deviceIdentifier: DeviceIdentifier;
    deviceType: DeviceType;
    linkState: LinkState;
    hingeState: HingeState;
    batteryLevel: number | null;
    isCharging: boolean;
  }
}

/**
 * Camera namespace for streaming and photo capture functionality
 */
export namespace MWDATCamera {
  // Streaming resolutions supported by device cameras
  export type StreamingResolution = "720p" | "1080p" | "1440p";

  // Video codec options
  export type VideoCodec = "h264" | "h265" | "av1";

  // Photo capture format options
  export type PhotoCaptureFormat = "jpeg" | "png" | "heic";

  // Stream session states
  export type StreamSessionState =
    | "inactive"
    | "starting"
    | "streaming"
    | "paused"
    | "stopping"
    | "error";

  // Error types
  export type DecoderError =
    | { type: "invalidData" }
    | { type: "unsupportedFormat" }
    | { type: "decodingFailed"; message: string };

  export type StreamSessionError =
    | { type: "notConnected" }
    | { type: "permissionDenied" }
    | { type: "configurationInvalid" }
    | { type: "streamFailed"; message: string };

  /**
   * Configuration for camera streaming session
   */
  export interface StreamSessionConfig {
    resolution: StreamingResolution;
    codec: VideoCodec;
    frameRate: number;
    enableAudio: boolean;
  }

  /**
   * Dimensions of a video frame
   */
  export interface VideoFrameSize {
    width: number;
    height: number;
  }

  /**
   * Represents a single video frame from the camera stream
   */
  export interface VideoFrame {
    data: Uint8Array;
    size: VideoFrameSize;
    timestamp: number;
    format: VideoCodec;
  }

  /**
   * Captured photo data from the device camera
   */
  export interface PhotoData {
    data: Uint8Array;
    format: PhotoCaptureFormat;
    timestamp: number;
    width: number;
    height: number;
  }
}

/**
 * Mock device namespace for testing and development
 */
export namespace MWDATMockDevice {
  // Mock device kit error types
  export type MockDeviceKitError =
    | { type: "deviceNotFound" }
    | { type: "simulationFailed"; message: string }
    | { type: "configurationInvalid" };
}
```
