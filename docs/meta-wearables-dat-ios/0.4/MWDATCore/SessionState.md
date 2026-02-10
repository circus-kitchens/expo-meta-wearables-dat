# SessionState Enum

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_sessionstate

**Module:** MWDATCore

**Extends:** Int, Sendable

## Overview

Represents the current state of a device session in the Wearables Device Access Toolkit.

## Signature

```swift
enum SessionState: Int, Sendable
```

## Enumeration Constants

| Member             | Description                                                             |
| ------------------ | ----------------------------------------------------------------------- |
| `stopped`          | The session is not active and not attempting to connect.                |
| `waitingForDevice` | The session is waiting for a device to become available for connection. |
| `running`          | The session is actively running and processing data from the device.    |
| `paused`           | The session is temporarily paused but maintains its connection.         |
| `unknown`          | The session state is not currently determinable.                        |

## Properties

### description

**Type:** `String` (get-only)

Provides a human-readable description of the session state.

## Swift Usage Example

```swift
import MWDATCore

// Observing session state changes
let session = DeviceStateSession(/* ... */)

session.addSessionStateListener { state in
    switch state {
    case .stopped:
        print("Session stopped")
    case .waitingForDevice:
        print("Waiting for device to connect...")
    case .running:
        print("Session is active and processing data")
    case .paused:
        print("Session paused but connection maintained")
    case .unknown:
        print("Session state unknown: \(state.description)")
    }
}
```

## TypeScript

**Mapping Notes:**

- Swift `SessionState` enum maps to TypeScript string literal union for type safety
- The `description` property is exposed as a helper function for runtime string conversion
- Cases use camelCase naming consistent with Swift API

```ts
/**
 * Represents the current state of a device session in the Wearables Device Access Toolkit.
 */
export type SessionState = "stopped" | "waitingForDevice" | "running" | "paused" | "unknown";

/**
 * Provides a human-readable description of the session state.
 * @param state - The session state
 * @returns A string description of the state
 */
export function getSessionStateDescription(state: SessionState): string {
  switch (state) {
    case "stopped":
      return "The session is not active and not attempting to connect.";
    case "waitingForDevice":
      return "The session is waiting for a device to become available for connection.";
    case "running":
      return "The session is actively running and processing data from the device.";
    case "paused":
      return "The session is temporarily paused but maintains its connection.";
    case "unknown":
      return "The session state is not currently determinable.";
  }
}

/**
 * Type guard to check if a value is a valid SessionState
 */
export function isSessionState(value: unknown): value is SessionState {
  return (
    typeof value === "string" &&
    ["stopped", "waitingForDevice", "running", "paused", "unknown"].includes(value)
  );
}
```
