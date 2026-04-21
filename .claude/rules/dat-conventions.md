---
description: Kotlin patterns, DatResult, coroutines/Flow, naming conventions for DAT SDK v0.6 Android development
---

# DAT SDK Conventions (Android, v0.6)

## Architecture

The SDK is organized into three modules:

- **mwdat-core**: Device discovery, registration, permissions, device selectors, session management
- **mwdat-camera**: Stream capability, VideoFrame, photo capture (StreamSession is deprecated — use Stream via Session)
- **mwdat-mockdevice**: MockDeviceKit for testing without hardware

## Session Model (v0.6)

Streaming is now session-based. Create a `Session`, start it, then attach capabilities:

```kotlin
val session = Wearables.createSession(AutoDeviceSelector())
session.start()
val stream = session.addStream(StreamConfiguration(VideoQuality.MEDIUM, 24))
// Collect from stream.videoStream, stream.state, stream.errorStream
session.stop() // Terminal — create a new session to stream again
```

`DeviceSessionState` lifecycle: `IDLE → STARTING → STARTED → PAUSED → STOPPING → STOPPED`

## Kotlin Patterns

- Use `suspend` functions for async operations — no callbacks
- Use `StateFlow` / `Flow` for observing state changes
- Use `DatResult<T, E>` for error handling — not exceptions
- Prefer immutable collections
- Use `sealed interface` for state hierarchies
- `Session.start()` and `Session.stop()` are sync fire-and-forget — observe `session.state` for completion

## Error Handling

The SDK uses `DatResult<T, E>` for type-safe error handling:

```kotlin
val result = Wearables.someOperation()
result.fold(
    onSuccess = { value -> /* handle success */ },
    onFailure = { error -> /* handle error */ }
)
```

Do **not** use `getOrThrow()` — always handle both paths.

## Naming Conventions

| Suffix     | Purpose                        | Example               |
| ---------- | ------------------------------ | --------------------- |
| `*Manager` | Long-lived resource management | `RegistrationManager` |
| `*Session` | Short-lived flow component     | `Session`             |
| `*Result`  | DatResult type aliases         | `RegistrationResult`  |
| `*Error`   | Error sealed interfaces        | `SessionError`        |

Methods: `get*`, `set*`, `check*`, `request*`, `observe*`

## Imports

```kotlin
import com.meta.wearable.dat.core.Wearables              // Entry point
import com.meta.wearable.dat.core.session.Session         // Device session
import com.meta.wearable.dat.core.session.DeviceSessionState
import com.meta.wearable.dat.core.session.SessionError
import com.meta.wearable.dat.camera.Stream                // Stream capability
import com.meta.wearable.dat.camera.types.*                // VideoFrame, PhotoData, etc.
```

For testing:

```kotlin
import com.meta.wearable.dat.mockdevice.MockDeviceKit
import com.meta.wearable.dat.mockdevice.api.MockDeviceKitConfig
import com.meta.wearable.dat.mockdevice.api.permissions.MockPermissions
import com.meta.wearable.dat.mockdevice.api.camera.CameraFacing
```

## Key Types

- `Wearables` — SDK entry point. Call `Wearables.initialize(context)` at startup
- `Session` — Device session created via `Wearables.createSession(deviceSelector)`
- `Stream` — Camera streaming capability attached to a Session via `session.addStream(config)`
- `DeviceSessionState` — Session lifecycle: `IDLE`, `STARTING`, `STARTED`, `PAUSED`, `STOPPING`, `STOPPED`
- `SessionError` — Session errors: `DEVICE_DISCONNECTED`, `DEVICE_POWERED_OFF`, etc.
- `StreamConfiguration` — Configure video quality, frame rate, compressVideo
- `VideoFrame` — Individual video frame with buffer data and `isCompressed` flag
- `AutoDeviceSelector` — Auto-selects the best available device
- `SpecificDeviceSelector` — Selects a specific device by identifier
- `MockDeviceKit` — Factory for creating simulated devices in tests
- `MockDeviceKitConfig` — Config with `initiallyRegistered` and `initialPermissionsGranted`
- `MockPermissions` — Interface for `set(permission, status)` and `setRequestResult(permission, result)`
- `CameraFacing` — `FRONT` or `BACK` for mock phone camera feed
- `LinkState` — Device connection state enum: `CONNECTED`, `CONNECTING`, `DISCONNECTED`
- `DeviceType` — Includes `RAYBAN_META_OPTICS` (new in 0.6)
- `CaptureError` — Sealed interface for photo capture errors

## Dependencies (v0.6)

Dependencies use Maven coordinates via GitHub Packages:

```gradle
implementation "com.meta.wearable:mwdat-core:0.6.0"
implementation "com.meta.wearable:mwdat-camera:0.6.0"
implementation "com.meta.wearable:mwdat-mockdevice:0.6.0"
```

Requires GitHub Packages Maven repository with `GITHUB_ACTOR`/`GITHUB_TOKEN` credentials.

## Links

- [Android API Reference](https://wearables.developer.meta.com/docs/reference/android/dat/0.6)
- [Developer Documentation](https://wearables.developer.meta.com/docs/develop/)
- [GitHub Repository](https://github.com/facebook/meta-wearables-dat-android)
