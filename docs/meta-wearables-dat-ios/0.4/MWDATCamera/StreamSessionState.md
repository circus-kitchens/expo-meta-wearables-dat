# StreamSessionState Enum

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcamera_streamsessionstate

## Overview

Represents the current state of a media streaming session with a Meta Wearables device.

## Swift API

### Type

`enum StreamSessionState`

### Enumeration Constants

| Case               | Description                                                         |
| ------------------ | ------------------------------------------------------------------- |
| `stopping`         | The session is in the process of stopping.                          |
| `stopped`          | The session is completely stopped and not attempting to connect.    |
| `waitingForDevice` | The session is waiting for a compatible device to become available. |
| `starting`         | The session is in the process of starting up.                       |
| `streaming`        | The session is actively streaming media data.                       |
| `paused`           | The session is temporarily paused but maintains its connection.     |

### State Lifecycle

The enum represents a typical streaming session lifecycle:

1. **stopped** → initial state
2. **starting** → session initialization
3. **waitingForDevice** → awaiting device connection
4. **streaming** → active data flow
5. **paused** → temporary suspension (connection maintained)
6. **stopping** → teardown in progress
7. **stopped** → final state

## Usage Example

```swift
import MWDATCamera

// Observe session state changes
streamSession.statePublisher
    .sink { state in
        switch state {
        case .stopped:
            print("Session is stopped")
        case .starting:
            print("Session is starting...")
        case .waitingForDevice:
            print("Waiting for device to connect...")
        case .streaming:
            print("Actively streaming!")
        case .paused:
            print("Session paused")
        case .stopping:
            print("Stopping session...")
        }
    }
    .store(in: &cancellables)
```

## TypeScript

**Mapping notes:**

- Swift enum cases map to TypeScript string literal union
- Use this type for state change events/callbacks in the React Native module
- Consider exporting constants for each state value to avoid magic strings

```ts
/**
 * Represents the current state of a media streaming session with a Meta Wearables device.
 */
export type StreamSessionState =
  | "stopping"
  | "stopped"
  | "waitingForDevice"
  | "starting"
  | "streaming"
  | "paused";

/**
 * Constant values for StreamSessionState to avoid magic strings.
 */
export const StreamSessionState = {
  STOPPING: "stopping" as const,
  STOPPED: "stopped" as const,
  WAITING_FOR_DEVICE: "waitingForDevice" as const,
  STARTING: "starting" as const,
  STREAMING: "streaming" as const,
  PAUSED: "paused" as const,
} as const;
```
