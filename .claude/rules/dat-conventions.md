---
description: Kotlin patterns, DatResult, coroutines/Flow, naming conventions for DAT SDK v0.5 Android development
---

# DAT SDK Conventions (Android, v0.5)

## Architecture

The SDK is organized into three modules:

- **mwdat-core**: Device discovery, registration, permissions, device selectors
- **mwdat-camera**: StreamSession, VideoFrame, photo capture
- **mwdat-mockdevice**: MockDeviceKit for testing without hardware

## Kotlin Patterns

- Use `suspend` functions for async operations — no callbacks
- Use `StateFlow` / `Flow` for observing state changes
- Use `DatResult<T, E>` for error handling — not exceptions
- Prefer immutable collections
- Use `sealed interface` for state hierarchies

## Error Handling

The SDK uses `DatResult<T, E>` for type-safe error handling:

```kotlin
val result = Wearables.someOperation()
result.fold(
    onSuccess = { value -> /* handle success */ },
    onFailure = { error -> /* handle error */ }
)

// Or partial handling:
result.onSuccess { value -> /* handle success */ }
result.onFailure { error -> /* handle error */ }
```

Do **not** use `getOrThrow()` — always handle both paths.

## Naming Conventions

| Suffix     | Purpose                        | Example               |
| ---------- | ------------------------------ | --------------------- |
| `*Manager` | Long-lived resource management | `RegistrationManager` |
| `*Session` | Short-lived flow component     | `StreamSession`       |
| `*Result`  | DatResult type aliases         | `RegistrationResult`  |
| `*Error`   | Error sealed interfaces        | `WearablesError`      |

Methods: `get*`, `set*`, `check*`, `request*`, `observe*`

## Imports

```kotlin
import com.meta.wearable.dat.core.Wearables          // Entry point
import com.meta.wearable.dat.camera.StreamSession     // Camera streaming
import com.meta.wearable.dat.camera.types.*            // VideoFrame, PhotoData, etc.
```

For testing:

```kotlin
import com.meta.wearable.dat.mockdevice.MockDeviceKit  // MockDeviceKit
```

## Key Types

- `Wearables` — SDK entry point. Call `Wearables.initialize(context)` at startup
- `StreamSession` — Camera streaming session
- `VideoFrame` — Individual video frame with bitmap data
- `AutoDeviceSelector` — Auto-selects the best available device
- `SpecificDeviceSelector` — Selects a specific device by identifier
- `StreamConfiguration` — Configure video quality, frame rate
- `MockDeviceKit` — Factory for creating simulated devices in tests
- `LinkState` — Device connection state enum: `CONNECTED`, `CONNECTING`, `DISCONNECTED`
- `CaptureError` — Sealed interface for photo capture errors: `DeviceDisconnected`, `NotStreaming`, `CaptureInProgress`, `CaptureFailed`

## Dependencies (v0.5)

SDK v0.5 resolved the fat AAR issue. Dependencies use Maven coordinates via GitHub Packages:

```gradle
implementation "com.meta.wearable:mwdat-core:0.5.0"
implementation "com.meta.wearable:mwdat-camera:0.5.0"
implementation "com.meta.wearable:mwdat-mockdevice:0.5.0"
```

Requires GitHub Packages Maven repository with `GITHUB_ACTOR`/`GITHUB_TOKEN` credentials.

## Links

- [Android API Reference](https://wearables.developer.meta.com/docs/reference/android/dat/0.5)
- [Developer Documentation](https://wearables.developer.meta.com/docs/develop/)
- [GitHub Repository](https://github.com/facebook/meta-wearables-dat-android)
