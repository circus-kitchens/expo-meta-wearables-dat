# HingeState Enum

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_hingestate

**Module:** MWDATCore

## Overview

Represents the physical state of the device's hinge mechanism. This enum indicates whether a foldable device (such as smart glasses) is in an open or closed position.

## Swift API

### Type

```swift
enum HingeState: Equatable, Sendable
```

### Conformances

- `Equatable` - Supports value comparison
- `Sendable` - Safe to pass across concurrency boundaries

### Enumeration Cases

| Case     | Description                                                     |
| -------- | --------------------------------------------------------------- |
| `open`   | The device is in an open position (e.g., glasses are unfolded). |
| `closed` | The device is in a closed position (e.g., glasses are folded).  |

## Usage Example

```swift
import MWDATCore

// Example: Observing device hinge state
func handleHingeStateChange(_ state: HingeState) {
    switch state {
    case .open:
        print("Device is open - ready to use")
        // Enable camera streaming, sensors, etc.
    case .closed:
        print("Device is closed - entering low power mode")
        // Disable features, conserve battery
    }
}

// Comparing hinge states
let currentState: HingeState = .open
let previousState: HingeState = .closed

if currentState != previousState {
    print("Hinge state changed")
}
```

## TypeScript

### Conversion Notes

- Simple Swift enum maps to TypeScript string literal union
- `Equatable` conformance is implicit in TypeScript (use `===` for comparison)
- `Sendable` conformance has no direct TypeScript equivalent but indicates thread-safe value semantics

### TypeScript Definition

```ts
/**
 * Represents the physical state of the device's hinge mechanism.
 *
 * Indicates whether a foldable device (such as smart glasses) is in an open or closed position.
 */
export type HingeState =
  | "open" // Device is in an open position (e.g., glasses are unfolded)
  | "closed"; // Device is in a closed position (e.g., glasses are folded)
```
