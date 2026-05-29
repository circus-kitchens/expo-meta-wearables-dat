---
description: DAT SDK 0.7 conventions, DeviceSession model, Display module, and Expo bridge patterns
---

# DAT SDK Conventions (v0.7)

## Architecture

Four SDK modules:

- **mwdat-core** — `DeviceSession`, registration, permissions, device selectors
- **mwdat-camera** — `Stream` capability, `VideoFrame`, photo capture
- **mwdat-display** — Display capability, declarative UI DSL (requires DAM)
- **mwdat-mockdevice** — MockDeviceKit (camera only; no display simulation)

## Session + capabilities

```kotlin
Wearables.createSession(deviceSelector).fold(
    onSuccess = { session ->
        session.start()
        val stream = session.addStream(StreamConfiguration(VideoQuality.MEDIUM, 24))
        // launch { stream.start() } in 0.7
    },
    onFailure = { /* DeviceSessionError */ }
)
```

Display (DAM required):

```kotlin
session.addDisplay(DisplayConfiguration()).fold(
    onSuccess = { display -> /* observe display.state, sendContent { } */ },
    onFailure = { /* DisplayError */ }
)
```

## 0.7 renames

| 0.6                  | 0.7                  |
| -------------------- | -------------------- |
| `Session`            | `DeviceSession`      |
| `SessionError`       | `DeviceSessionError` |
| `StreamSessionState` | `StreamState`        |

Android: `RegistrationState`, `PermissionStatus` are plain enums. iOS: `StreamSession` → `Stream`, `StreamSessionConfig` → `StreamConfiguration`.

## Expo bridge (this repo)

| File                    | Role                            |
| ----------------------- | ------------------------------- |
| `WearablesManager`      | Sessions, registration, devices |
| `StreamSessionManager`  | Camera stream                   |
| `DisplaySessionManager` | Display lifecycle + events      |
| `DisplayContentBuilder` | JSON tree → native Display DSL  |

TypeScript: `addDisplayToSession`, `sendDisplayContent`, `DisplayContentNode` in `EMWDAT.types.ts`.

Config plugin: `damEnabled: true` for Display.

## Error handling

Use `DatResult.fold()` in Kotlin bridge code. Do not use `getOrThrow()`.

## Dependencies (this repo)

```
mwdat-core:0.7.0, mwdat-camera:0.7.0, mwdat-display:0.7.0, mwdat-mockdevice:0.7.0
```

## Links

- [CLAUDE.md](../../CLAUDE.md) · [CODEX.md](../../CODEX.md) · [display-api skill](../skills/display-api.md)
- [Android 0.7 reference](https://wearables.developer.meta.com/docs/reference/android/dat/0.7)
