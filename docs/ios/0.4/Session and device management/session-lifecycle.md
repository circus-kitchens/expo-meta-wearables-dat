# Session lifecycle

**Updated: Nov 17, 2025**

## Overview

The Wearables Device Access Toolkit runs work inside sessions. Meta glasses expose two experience types:

- **Device sessions** grant sustained access to device sensors and outputs.
- **Transactions** are short, system-owned interactions (for example, notifications or "Hey Meta").

When your app requests a device session, the glasses grant or revoke access as needed, the app observes state, and the system decides when to change it.

## Device session states

`SessionState` is device-driven and delivered asynchronously through `StateFlow`.

| State     | Meaning                                   | App expectation                       |
| --------- | ----------------------------------------- | ------------------------------------- |
| `STOPPED` | Session is inactive and not reconnecting. | Free resources. Wait for user action. |
| `RUNNING` | Session is active and streaming data.     | Perform live work.                    |
| `PAUSED`  | Session is temporarily suspended.         | Hold work. Paths may resume.          |

> **Note:** `SessionState` does not expose the reason for a transition.

## Observe device session transitions

Use the SDK flow to track `SessionState` and react without assuming the cause of a change.

```kotlin
Wearables.getDeviceSessionState(deviceId).collect { state ->
  when (state) {
    SessionState.RUNNING -> onRunning()
    SessionState.PAUSED -> onPaused()
    SessionState.STOPPED -> onStopped()
  }
}
```

Recommended reactions:

- On `RUNNING`, confirm UI shows that the device session is live.
- On `PAUSED`, keep the connection and wait for `RUNNING` or `STOPPED`.
- On `STOPPED`, release device resources and allow the user to restart.

## Common device session transitions

The device can change `SessionState` when:

- The user performs a system gesture that opens another experience.
- Another app or system feature starts a device session.
- The user removes or folds the glasses, disconnecting Bluetooth.
- The user removes the app from the Meta AI companion app.
- Connectivity between the companion app and the glasses drops.

Many events lead to `STOPPED`, while some gestures pause a session and later resume it.

## Pause and resume

When `SessionState` changes to `PAUSED`:

- The device keeps the connection alive.
- Streams stop delivering data while paused.
- The device resumes streaming by returning to `RUNNING`.

Your app should not attempt to restart a device session while it is paused.

## Device availability

Use device metadata to detect availability. Hinge position is not exposed, but it influences connectivity.

```kotlin
Wearables.devicesMetadata[deviceId]?.collect { metadata ->
  if (metadata.available) {
    onDeviceAvailable()
  } else {
    onDeviceUnavailable()
  }
}
```

Expected effects:

- Closing the hinges disconnects Bluetooth, stops active streams, and forces `SessionState` to `STOPPED`.
- Opening the hinges restores Bluetooth when the glasses are nearby, but does not restart the device session. Start a new session after `metadata.available` becomes `true`.

## Implementation checklist

- Subscribe to `getDeviceSessionState` and handle all `SessionState` values.
- Monitor `devicesMetadata` for availability before starting work.
- Release resources only after receiving `STOPPED` or loss of availability.
- Avoid inferring transition causes; rely only on observable state.
