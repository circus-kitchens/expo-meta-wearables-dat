# iOS Integration Overview

## Overview

This guide explains how to add Wearables Device Access Toolkit registration, streaming, and photo capture to an existing iOS app. The integration involves configuring Info.plist properties, adding the SDK via Swift Package Manager, initializing the toolkit, managing device registration and permissions, establishing camera streams, and capturing photos.

For a complete working sample, see the [provided sample app](https://github.com/facebook/meta-wearables-dat-ios/tree/main/samples).

## Prerequisites

- Complete the [Setup](https://wearables.developer.meta.com/docs/getting-started-toolkit) guide for environment, glasses, and GitHub configuration.
- Register your app's bundle identifier with Apple via [Register an App ID](https://developer.apple.com/help/account/identifiers/register-an-app-id/) and [Bundle IDs](https://developer.apple.com/documentation/appstoreconnectapi/bundle-ids) documentation.

## Configuration: Info.plist

Configure the following keys in your app's `Info.plist` or via Xcode UI to enable callback handling and device discovery:

### Required Properties

- **CFBundleURLTypes** / **CFBundleURLSchemes**: Configure a custom URL scheme so the Meta AI app can callback to your application (e.g., `myexampleapp://`).
- **LSApplicationQueriesSchemes**: Add `fb-viewapp` to allow discovery of the Meta AI app.
- **UISupportedExternalAccessoryProtocols**: Add `com.meta.ar.wearable` for wearables communication.
- **UIBackgroundModes**: Add `bluetooth-peripheral` and `external-accessory` for background operation.
- **NSBluetoothAlwaysUsageDescription**: Permission string for Bluetooth access.
- **MWDAT** (dictionary):
  - **AppLinkURLScheme**: Your app's URL scheme (e.g., `myexampleapp://`).
  - **MetaAppID**: Your application ID (use `0` for Developer Mode; published apps receive a dedicated value from the Wearables Developer Center).

**Note**: If you pre-process Info.plist, the `://` suffix may be stripped unless you add the `-traditional-cpp` flag. See [Apple Technical Note TN2175](https://developer.apple.com/library/archive/technotes/tn2175/_index.html).

Example Info.plist configuration:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLName</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>myexampleapp</string>
    </array>
  </dict>
</array>
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>fb-viewapp</string>
</array>
<key>UISupportedExternalAccessoryProtocols</key>
<array>
  <string>com.meta.ar.wearable</string>
</array>
<key>UIBackgroundModes</key>
<array>
  <string>bluetooth-peripheral</string>
  <string>external-accessory</string>
</array>
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Needed to connect to Meta Wearables</string>
<key>MWDAT</key>
<dict>
  <key>AppLinkURLScheme</key>
  <string>myexampleapp://</string>
  <key>MetaAppID</key>
  <string>0</string>
</dict>
```

## Step 1: Add the SDK via Swift Package Manager

1. In Xcode, select **File** > **Add Package Dependencies...**
2. Search for `https://github.com/facebook/meta-wearables-dat-ios` in the top right corner.
3. Select `meta-wearables-dat-ios`.
4. Set the version to one of the [available versions](https://github.com/facebook/meta-wearables-dat-ios/tags).
5. Click **Add Package** and select your target.

Import the modules:

```swift
import MWDATCamera
import MWDATCore
```

## Step 2: Initialize the SDK

Call `Wearables.configure()` once when your app launches:

```swift
func configureWearables() {
    do {
        try Wearables.configure()
    } catch {
        assertionFailure("Failed to configure Wearables SDK: \(error)")
    }
}
```

## Step 3: Registration Flow

Register your application with the Meta AI app either at startup or when the user enables wearables integration:

```swift
func startRegistration() throws {
    try Wearables.shared.startRegistration()
}

func startUnregistration() throws {
    try Wearables.shared.startUnregistration()
}

func handleWearablesCallback(url: URL) async throws {
    _ = try await Wearables.shared.handleUrl(url)
}
```

Observe registration and device state changes:

```swift
let wearables = Wearables.shared

Task {
    for await state in wearables.registrationStateStream() {
        // Update your registration UI or model
    }
}

Task {
    for await devices in wearables.devicesStream() {
        // Update the list of available glasses
    }
}
```

## Step 4: Camera Permissions

Check and request camera permission before starting streams:

```swift
var cameraStatus: PermissionStatus = .denied

// Check current permission status
cameraStatus = try await wearables.checkPermissionStatus(.camera)

// Request permission from user
cameraStatus = try await wearables.requestPermission(.camera)
```

**PermissionStatus** values: `.denied`, `.granted`, `.pending`

## Step 5: Camera Streaming

Create and manage a `StreamSession` to capture video frames from the glasses.

### Configuration

Use `StreamSessionConfig` to control resolution and frame rate:

- **frameRate**: Valid values are `2`, `7`, `15`, `24`, or `30` FPS.
- **resolution**: Valid values are:
  - `high`: 720 × 1280
  - `medium`: 504 × 896
  - `low`: 360 × 640
- **videoCodec**: Codec selection (e.g., `VideoCodec.raw`)

**Note**: Resolution and frame rate are constrained by Bluetooth Classic bandwidth. An automatic ladder reduces quality as needed: first by lowering resolution, then by reducing frame rate (never below 15 fps). The delivered image may appear lower quality even at "High" or "Medium" due to per-frame compression adapting to available bandwidth.

### StreamSessionState

A `StreamSession` transitions through these states: `stopping`, `stopped`, `waitingForDevice`, `starting`, `streaming`, and `paused`.

### Device Selection

Use `AutoDeviceSelector` to let the SDK choose an optimal device, or `SpecificDeviceSelector` for user-selected devices.

### Example: Create and Observe a Stream Session

```swift
// Let the SDK auto-select from available devices
let deviceSelector = AutoDeviceSelector(wearables: wearables)

let config = StreamSessionConfig(
    videoCodec: VideoCodec.raw,
    resolution: StreamingResolution.low,
    frameRate: 24
)

let streamSession = StreamSession(streamSessionConfig: config, deviceSelector: deviceSelector)

// Observe state changes
let stateToken = streamSession.statePublisher.listen { state in
    Task { @MainActor in
        // Update your streaming UI state
    }
}

// Observe video frames
let frameToken = streamSession.videoFramePublisher.listen { frame in
    guard let image = frame.makeUIImage() else { return }
    Task { @MainActor in
        // Render the frame in your preview surface
    }
}

// Start streaming
Task { await streamSession.start() }
```

## Step 6: Photo Capture

Listen for photo events and capture photos from an active stream:

```swift
// Listen for captured photos
_ = streamSession.photoDataPublisher.listen { photoData in
    let data = photoData.data
    // Convert to UIImage or hand off to your storage layer
}

// Trigger photo capture
streamSession.capturePhoto(format: .jpeg)
```

**PhotoData** contains the captured image data along with metadata (format indicates `.jpeg`, `.heic`, or `.raw`).

## Usage Example

A complete integration example combining all steps:

```swift
import MWDATCamera
import MWDATCore

class WearablesController {
    let wearables = Wearables.shared
    var streamSession: StreamSession?

    func setupWearables() {
        // 1. Configure SDK
        do {
            try Wearables.configure()
        } catch {
            print("Failed to configure: \(error)")
            return
        }

        // 2. Observe registration state
        Task {
            for await state in wearables.registrationStateStream() {
                print("Registration state: \(state)")
            }
        }

        // 3. Observe devices
        Task {
            for await devices in wearables.devicesStream() {
                print("Available devices: \(devices)")
            }
        }
    }

    func startStreaming() async throws {
        // Check permissions
        let permStatus = try await wearables.checkPermissionStatus(.camera)
        if permStatus == .denied {
            let granted = try await wearables.requestPermission(.camera)
            if granted != .granted {
                throw NSError(domain: "Permissions", code: -1)
            }
        }

        // Create stream session
        let deviceSelector = AutoDeviceSelector(wearables: wearables)
        let config = StreamSessionConfig(
            videoCodec: VideoCodec.raw,
            resolution: StreamingResolution.medium,
            frameRate: 15
        )

        streamSession = StreamSession(
            streamSessionConfig: config,
            deviceSelector: deviceSelector
        )

        guard let session = streamSession else { return }

        // Observe state
        _ = session.statePublisher.listen { state in
            Task { @MainActor in
                print("Stream state: \(state)")
            }
        }

        // Observe frames
        _ = session.videoFramePublisher.listen { frame in
            guard let image = frame.makeUIImage() else { return }
            Task { @MainActor in
                // Update preview with image
            }
        }

        // Observe photos
        _ = session.photoDataPublisher.listen { photoData in
            // Handle captured photo
        }

        // Start streaming
        try await session.start()
    }

    func capturePhoto() {
        streamSession?.capturePhoto(format: .jpeg)
    }
}
```

## Next Steps

- [Permissions and registration](https://wearables.developer.meta.com/docs/permissions-requests) — Detailed permission flows.
- [Session lifecycle](https://wearables.developer.meta.com/docs/lifecycle-events) — Detailed session management.
- [Mock Device Kit](https://wearables.developer.meta.com/docs/testing-mdk-ios) — Test without physical hardware.
- [Manage projects](https://wearables.developer.meta.com/docs/manage-projects) — Prepare for release.
- [Set up release channels](https://wearables.developer.meta.com/docs/set-up-release-channels) — Distribution setup.

---

## TypeScript

### Notes on Swift-to-TypeScript Conversion

- Swift optional properties (`T?`) map to `T | null` or nullable field markers in interfaces.
- Async/await patterns in Swift translate to `Promise`-based async in TypeScript.
- Swift enums with associated values may require union types or discriminated unions in TypeScript.
- Swift `Codable` structs map to interfaces; Swift `.raw` or codec values become string literals or enums.
- Stream publishers become `Observable<T>` or async iterables; for simplicity here, we model them as event-based.

```ts
/**
 * Permission status for camera access.
 */
export enum PermissionStatus {
  Denied = "denied",
  Granted = "granted",
  Pending = "pending",
}

/**
 * Camera streaming resolution options.
 */
export enum StreamingResolution {
  High = "high",
  Medium = "medium",
  Low = "low",
}

/**
 * Video codec options for streaming.
 */
export enum VideoCodec {
  Raw = "raw",
  H264 = "h264",
  H265 = "h265",
}

/**
 * Streaming session states.
 */
export enum StreamSessionState {
  Stopping = "stopping",
  Stopped = "stopped",
  WaitingForDevice = "waitingForDevice",
  Starting = "starting",
  Streaming = "streaming",
  Paused = "paused",
}

/**
 * Photo capture format options.
 */
export enum PhotoCaptureFormat {
  JPEG = "jpeg",
  HEIC = "heic",
  Raw = "raw",
}

/**
 * Configuration for a camera stream session.
 */
export interface StreamSessionConfig {
  videoCodec: VideoCodec;
  resolution: StreamingResolution;
  frameRate: number; // Valid values: 2, 7, 15, 24, 30
}

/**
 * Video frame data from a stream.
 */
export interface VideoFrame {
  data: Uint8Array;
  timestamp: number;
  width: number;
  height: number;
}

/**
 * Captured photo data.
 */
export interface PhotoData {
  data: Uint8Array;
  format: PhotoCaptureFormat;
  timestamp: number;
}

/**
 * Device information for wearables.
 */
export interface WearableDevice {
  id: string;
  name: string;
  type: "glasses" | "unknown";
}

/**
 * Configuration dictionary for Info.plist.
 */
export interface MWDATConfig {
  appLinkURLScheme: string;
  metaAppID: string; // "0" for Developer Mode, or application-specific ID
}

/**
 * Main Wearables singleton interface.
 */
export interface WearablesInterface {
  configure(): Promise<void>;
  startRegistration(): Promise<void>;
  startUnregistration(): Promise<void>;
  handleUrl(url: string): Promise<void>;
  checkPermissionStatus(permission: "camera"): Promise<PermissionStatus>;
  requestPermission(permission: "camera"): Promise<PermissionStatus>;
  registrationStateStream(): AsyncIterable<string>; // e.g., "registered", "unregistered"
  devicesStream(): AsyncIterable<WearableDevice[]>;
}

/**
 * Stream session for camera operations.
 */
export interface StreamSession {
  start(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  stop(): Promise<void>;
  capturePhoto(format: PhotoCaptureFormat): void;
  onStateChanged(callback: (state: StreamSessionState) => void): void;
  onVideoFrame(callback: (frame: VideoFrame) => void): void;
  onPhotoCapture(callback: (photo: PhotoData) => void): void;
}

/**
 * Device selector for automatic device choice.
 */
export interface AutoDeviceSelector {
  selectDevice(devices: WearableDevice[]): Promise<WearableDevice | null>;
}

/**
 * Device selector for user-specified selection.
 */
export interface SpecificDeviceSelector {
  deviceId: string;
  selectDevice(devices: WearableDevice[]): Promise<WearableDevice | null>;
}
```
