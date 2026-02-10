# LinkState Enum

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_linkstate

**Module:** MWDATCore

**Extends:** Equatable, Sendable

## Overview

Represents the connection state between a device and the Wearables Device Access Toolkit.

## Swift API

### Signature

```swift
enum LinkState: Equatable, Sendable
```

### Enumeration Constants

| Member         | Description                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `disconnected` | The device is not connected to the Wearables Device Access Toolkit.                                    |
| `connecting`   | The device is currently attempting to establish a connection with the Wearables Device Access Toolkit. |
| `connected`    | The device is successfully connected and ready for communication.                                      |

## Usage Example

```swift
import MWDATCore

// Observing link state changes
func handleLinkStateChange(_ linkState: LinkState) {
    switch linkState {
    case .disconnected:
        print("Device disconnected")
    case .connecting:
        print("Device connecting...")
    case .connected:
        print("Device connected and ready")
    }
}
```

## TypeScript

- Simple enum with three cases, no associated values
- Maps directly to a string literal union type
- Use for tracking device connection status in React Native apps

```ts
/**
 * Represents the connection state between a device and the Wearables Device Access Toolkit.
 */
export type LinkState =
  | "disconnected" // Device is not connected to the toolkit
  | "connecting" // Device is attempting to establish a connection
  | "connected"; // Device is successfully connected and ready for communication
```
