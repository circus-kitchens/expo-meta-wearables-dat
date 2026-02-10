# StreamSession

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcamera_streamsession

**Module:** MWDATCamera

**Modifiers:** `final`

## Overview

A class for managing media streaming sessions with Meta Wearables devices. Handles video streaming, photo capture, and provides real-time state updates.

The `StreamSession` class provides a high-level interface for streaming video from Meta Ray-Ban glasses and capturing photos. It manages the connection lifecycle, monitors device availability, and delivers media through Combine publishers.

## Swift API

### Class Declaration

```swift
final class StreamSession
```

### Constructors

#### `init(deviceSelector:)`

Creates a streaming session using the specified device selector.

```swift
public init(deviceSelector: DeviceSelector)
```

The session is created in `.stopped` state. Call `start()` to begin streaming. Uses the default `StreamSessionConfig` configuration.

**Parameters:**

- `deviceSelector: DeviceSelector` - The device selector that determines which device to stream from. The selector's `activeDevice` can be nil initially.

---

#### `init(streamSessionConfig:deviceSelector:)`

Creates a streaming session with custom configuration.

```swift
public init(
    streamSessionConfig: StreamSessionConfig,
    deviceSelector: DeviceSelector
)
```

The session is created in `.stopped` state. Call `start()` to begin streaming.

**Parameters:**

- `streamSessionConfig: StreamSessionConfig` - Configuration specifying resolution, frame rate, and codec settings.
- `deviceSelector: DeviceSelector` - The device selector that determines which device to stream from.

### Properties

#### `errorPublisher`

```swift
var errorPublisher: AnyPublisher<StreamSessionError, Never> { get }
```

Publisher for errors that occur during the streaming session.

Errors include:

- `StreamSessionError.deviceNotFound(_:)`
- `StreamSessionError.deviceNotConnected(_:)`
- `StreamSessionError.timeout`
- `StreamSessionError.permissionDenied`
- `StreamSessionError.hingesClosed`
- `StreamSessionError.internalError`

---

#### `photoDataPublisher`

```swift
var photoDataPublisher: AnyPublisher<PhotoData, Never> { get }
```

Publisher for photo data captured during the streaming session.

Photos are delivered through this publisher after calling `capturePhoto(format:)`.

---

#### `state`

```swift
var state: StreamSessionState { get set }
```

The current state of the streaming session.

Possible states:

- `.stopped` - Session is not active
- `.waitingForDevice` - Session started but no device available
- `.starting` - Connecting to device and initializing stream
- `.streaming` - Actively streaming video
- `.stopping` - Shutting down stream

---

#### `statePublisher`

```swift
var statePublisher: AnyPublisher<StreamSessionState, Never> { get }
```

Publisher for streaming session state changes.

Subscribe to this to receive notifications when the session transitions between states.

---

#### `streamSessionConfig`

```swift
var streamSessionConfig: StreamSessionConfig { get set }
```

The configuration used for this streaming session.

Specifies resolution, frame rate, codec, and other streaming parameters.

---

#### `videoFramePublisher`

```swift
var videoFramePublisher: AnyPublisher<VideoFrame, Never> { get }
```

Publisher for video frames received from the streaming session.

Video frames are delivered through this publisher while the session is in `.streaming` state.

### Functions

#### `capturePhoto(format:)`

Captures a still photo during streaming.

```swift
public func capturePhoto(format: PhotoCaptureFormat) -> Bool
```

Triggers a photo capture while video streaming is active. The captured photo is delivered through `photoDataPublisher`. Video streaming is temporarily paused during capture and automatically resumes after photo delivery.

**Parameters:**

- `format: PhotoCaptureFormat` - The desired image format.

**Returns:**

- `Bool` - `true` if the capture request was accepted, `false` if no device session is active, a capture is already in progress, or the underlying capture request fails.

---

#### `start()`

Starts video streaming from the device.

```swift
public func start()
```

Begins streaming video frames from the currently available device. If no device is currently available, the session enters `.waitingForDevice` state and automatically connects when a device becomes available. Video frames are delivered through `videoFramePublisher`.

**State transitions:**

- `.stopped` -> `.waitingForDevice` (no device)
- `.stopped` -> `.starting` -> `.streaming` (with device)

The session monitors for device availability and automatically connects when a device becomes available. It publishes errors if the device is invalid and automatically stops when an error occurs or when the device session ends externally (e.g., device powered off).

---

#### `stop()`

Stops video streaming and releases all resources.

```swift
public func stop()
```

Shuts down the streaming pipeline and transitions to `.stopped` state.

**State transitions:**

- Any state -> `.stopping` -> `.stopped`

## Lifecycle and Threading Notes

- The session is created in `.stopped` state and must be started explicitly.
- State changes are published through `statePublisher` for reactive UI updates.
- Video frames are delivered continuously while in `.streaming` state.
- Photo capture temporarily pauses video streaming.
- The session automatically handles device disconnection and reconnection.
- All publishers use Combine's `AnyPublisher` with `Never` failure type, delivering errors/data through their value channels.

## Usage Example

```swift
import MWDATCamera
import MWDATCore
import Combine

class CameraStreamManager {
    private let streamSession: StreamSession
    private var cancellables = Set<AnyCancellable>()

    init() {
        // Create a device selector (auto-select first available device)
        let deviceSelector = AutoDeviceSelector()

        // Create stream session with default config
        streamSession = StreamSession(deviceSelector: deviceSelector)

        // Subscribe to video frames
        streamSession.videoFramePublisher
            .sink { frame in
                print("Received frame: \(frame.size)")
                // Process video frame
            }
            .store(in: &cancellables)

        // Subscribe to state changes
        streamSession.statePublisher
            .sink { state in
                print("Session state: \(state)")
            }
            .store(in: &cancellables)

        // Subscribe to errors
        streamSession.errorPublisher
            .sink { error in
                print("Session error: \(error)")
            }
            .store(in: &cancellables)

        // Subscribe to captured photos
        streamSession.photoDataPublisher
            .sink { photoData in
                print("Captured photo: \(photoData.data.count) bytes")
                // Process photo
            }
            .store(in: &cancellables)
    }

    func startStreaming() {
        streamSession.start()
    }

    func stopStreaming() {
        streamSession.stop()
    }

    func takePhoto() {
        let success = streamSession.capturePhoto(format: .jpeg)
        if !success {
            print("Failed to capture photo")
        }
    }
}
```

## TypeScript

### Mapping Notes

- Swift `AnyPublisher<T, Never>` maps to event emitters or React Native's `EventEmitter` pattern; consider using RxJS `Observable<T>` or callbacks
- Swift optionals (`T?`) become `T | null` in TypeScript
- Swift `Bool` -> `boolean`, `Data` -> `Uint8Array`
- All async Swift methods that don't explicitly use completion handlers are synchronous; we'll make the TS interface explicit about return types
- The `start()` and `stop()` methods are synchronous in Swift; consider making them `Promise<void>` in TS for consistency with React Native patterns
- Combine publishers will be exposed as event listeners in the React Native module

```ts
import type { DeviceSelector } from "./MWDATCore/DeviceSelector";
import type { PhotoCaptureFormat } from "./PhotoCaptureFormat";
import type { PhotoData } from "./PhotoData";
import type { StreamSessionConfig } from "./StreamSessionConfig";
import type { StreamSessionError } from "./StreamSessionError";
import type { StreamSessionState } from "./StreamSessionState";
import type { VideoFrame } from "./VideoFrame";

/**
 * Configuration options for creating a StreamSession
 */
export interface StreamSessionOptions {
  /**
   * Device selector determining which device to stream from
   */
  deviceSelector: DeviceSelector;

  /**
   * Optional streaming configuration (resolution, codec, frame rate)
   * If not provided, uses default configuration
   */
  streamSessionConfig?: StreamSessionConfig;
}

/**
 * Event payload types for StreamSession events
 */
export interface StreamSessionEvents {
  /** Emitted when a video frame is received */
  onVideoFrame: VideoFrame;

  /** Emitted when the session state changes */
  onStateChange: StreamSessionState;

  /** Emitted when an error occurs */
  onError: StreamSessionError;

  /** Emitted when a photo is captured */
  onPhotoData: PhotoData;
}

/**
 * Manages media streaming sessions with Meta Wearables devices.
 *
 * Handles video streaming, photo capture, and provides real-time state updates
 * through event listeners. The session lifecycle is managed through start() and
 * stop() methods.
 */
export interface StreamSession {
  /**
   * Current state of the streaming session
   */
  readonly state: StreamSessionState;

  /**
   * Configuration used for this streaming session
   */
  readonly streamSessionConfig: StreamSessionConfig;

  /**
   * Starts video streaming from the device.
   *
   * If no device is available, enters waitingForDevice state and automatically
   * connects when a device becomes available. Video frames are delivered through
   * the onVideoFrame event.
   *
   * @returns Promise that resolves when streaming has started or rejects on error
   */
  start(): Promise<void>;

  /**
   * Stops video streaming and releases all resources.
   *
   * Shuts down the streaming pipeline and transitions to stopped state.
   *
   * @returns Promise that resolves when streaming has stopped
   */
  stop(): Promise<void>;

  /**
   * Captures a still photo during streaming.
   *
   * Video streaming is temporarily paused during capture and automatically
   * resumes after photo delivery. The photo is delivered through the
   * onPhotoData event.
   *
   * @param format - Desired image format (jpeg or heif)
   * @returns Promise resolving to true if capture was accepted, false otherwise
   */
  capturePhoto(format: PhotoCaptureFormat): Promise<boolean>;

  /**
   * Adds an event listener for video frames
   *
   * @param event - Event name
   * @param listener - Callback invoked with each video frame
   * @returns Subscription object with remove() method
   */
  addListener(event: "onVideoFrame", listener: (frame: VideoFrame) => void): { remove(): void };

  /**
   * Adds an event listener for state changes
   *
   * @param event - Event name
   * @param listener - Callback invoked when session state changes
   * @returns Subscription object with remove() method
   */
  addListener(
    event: "onStateChange",
    listener: (state: StreamSessionState) => void
  ): { remove(): void };

  /**
   * Adds an event listener for errors
   *
   * @param event - Event name
   * @param listener - Callback invoked when an error occurs
   * @returns Subscription object with remove() method
   */
  addListener(event: "onError", listener: (error: StreamSessionError) => void): { remove(): void };

  /**
   * Adds an event listener for captured photos
   *
   * @param event - Event name
   * @param listener - Callback invoked when a photo is captured
   * @returns Subscription object with remove() method
   */
  addListener(event: "onPhotoData", listener: (photoData: PhotoData) => void): { remove(): void };

  /**
   * Removes a specific event listener
   *
   * @param event - Event name
   * @param listener - The listener function to remove
   */
  removeListener(event: keyof StreamSessionEvents, listener: (...args: any[]) => void): void;

  /**
   * Removes all listeners for a specific event or all events
   *
   * @param event - Optional event name. If omitted, removes all listeners.
   */
  removeAllListeners(event?: keyof StreamSessionEvents): void;
}

/**
 * Factory function for creating a StreamSession instance
 *
 * @param options - Configuration for the stream session
 * @returns A new StreamSession instance
 */
export function createStreamSession(options: StreamSessionOptions): StreamSession;
```
