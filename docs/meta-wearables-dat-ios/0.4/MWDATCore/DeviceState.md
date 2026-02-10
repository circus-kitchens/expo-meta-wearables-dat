# DeviceState Struct

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_devicestate

**Module:** MWDATCore

**Conformances:** Equatable, Sendable

## Overview

Represents the current state of a Meta Wearables device, including battery and hinge information.

## Swift API

### Signature

```swift
struct DeviceState: Equatable, Sendable
```

### Properties

| Property       | Description                                                      |
| -------------- | ---------------------------------------------------------------- |
| `batteryLevel` | The current battery level of the device as a percentage (0-100). |
| `hingeState`   | The current state of the device's hinge mechanism.               |

### Property Details

#### batteryLevel

```swift
var batteryLevel: Int
```

The current battery level of the device as a percentage (0-100).

- **Type:** `Int`
- **Range:** 0-100

#### hingeState

```swift
var hingeState: HingeState
```

The current state of the device's hinge mechanism.

- **Type:** `HingeState`
- **See also:** [HingeState](https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_hingestate) enum

## Swift Usage Example

```swift
import MWDATCore

// Observing device state from a DeviceStateSession
let session = DeviceStateSession(/* ... */)

session.statePublisher
    .sink { deviceState in
        print("Battery level: \(deviceState.batteryLevel)%")
        print("Hinge state: \(deviceState.hingeState)")

        // React to battery level
        if deviceState.batteryLevel < 20 {
            print("⚠️ Low battery warning")
        }

        // React to hinge state
        switch deviceState.hingeState {
        case .open:
            print("Device is open")
        case .closed:
            print("Device is closed")
        case .unknown:
            print("Hinge state unknown")
        }
    }
```

## TypeScript

### Conversion Notes

- Swift `Int` maps to TypeScript `number`
- Swift `HingeState` enum maps to TypeScript string literal union (must be defined separately)
- Struct properties are required (non-optional) in both Swift and TypeScript
- Value type in Swift → plain interface in TypeScript

### TypeScript Definition

```ts
/**
 * Represents the current state of a Meta Wearables device, including battery and hinge information.
 */
export interface DeviceState {
  /**
   * The current battery level of the device as a percentage (0-100).
   */
  batteryLevel: number;

  /**
   * The current state of the device's hinge mechanism.
   */
  hingeState: HingeState;
}

/**
 * Type guard to check if an object is a valid DeviceState.
 */
export function isDeviceState(value: unknown): value is DeviceState {
  return (
    typeof value === "object" &&
    value !== null &&
    "batteryLevel" in value &&
    typeof (value as DeviceState).batteryLevel === "number" &&
    (value as DeviceState).batteryLevel >= 0 &&
    (value as DeviceState).batteryLevel <= 100 &&
    "hingeState" in value &&
    typeof (value as DeviceState).hingeState === "string"
  );
}
```
