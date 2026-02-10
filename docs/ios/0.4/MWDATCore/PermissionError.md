# PermissionError

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_permissionerror

## Overview

`PermissionError` is an enum representing errors that can occur during permission requests when working with Meta Wearables devices. It conforms to `Int`, `Error`, and `Sendable` protocols.

## Swift API

### Type

```swift
enum PermissionError: Int, Error, Sendable
```

### Enumeration Cases

| Case                     | Description                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| `noDevice`               | No wearable devices have been discovered or registered.          |
| `noDeviceWithConnection` | All discovered devices are powered off or disconnected.          |
| `connectionError`        | A connection error occurred while communicating with the device. |
| `metaAINotInstalled`     | The Meta AI companion app is not installed on the device.        |
| `requestInProgress`      | A permission request is already in progress.                     |
| `requestTimeout`         | The permission request exceeded the allowed time limit.          |
| `internalError`          | An unexpected internal error occurred.                           |

### Properties

- **`description`** (read-only): A human-readable description of the error.

### Protocol Conformances

- **`Int`**: Raw value representation
- **`Error`**: Swift error protocol conformance, allowing this enum to be thrown
- **`Sendable`**: Safe to pass across concurrency boundaries

## Usage Example

```swift
import MWDATCore

func requestPermission() async throws {
    do {
        // Attempt to request permission from wearables
        try await wearables.requestPermission(.camera)
    } catch let error as PermissionError {
        switch error {
        case .noDevice:
            print("No devices found. Please pair a Meta wearable device.")
        case .noDeviceWithConnection:
            print("Device is offline. Please turn on your glasses.")
        case .connectionError:
            print("Connection error: \(error.description)")
        case .metaAINotInstalled:
            print("Please install the Meta AI companion app.")
        case .requestInProgress:
            print("A permission request is already in progress.")
        case .requestTimeout:
            print("Permission request timed out. Please try again.")
        case .internalError:
            print("An internal error occurred: \(error.description)")
        }
    }
}
```

## TypeScript

- Swift enum cases map to TypeScript string literal union for type safety
- Since Swift `Error` protocol conformance, TS side uses discriminated union with `type` field
- All cases are simple (no associated values), so TS can use string literals
- Read-only `description` property becomes optional in TS (depends on native bridge implementation)

```ts
/**
 * Errors that can occur during permission requests with Meta Wearables devices.
 */
export type PermissionError =
  | { type: "noDevice"; description?: string }
  | { type: "noDeviceWithConnection"; description?: string }
  | { type: "connectionError"; description?: string }
  | { type: "metaAINotInstalled"; description?: string }
  | { type: "requestInProgress"; description?: string }
  | { type: "requestTimeout"; description?: string }
  | { type: "internalError"; description?: string };

/**
 * Type guard to check if an error is a PermissionError
 */
export function isPermissionError(error: unknown): error is PermissionError {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    typeof (error as { type: unknown }).type === "string" &&
    [
      "noDevice",
      "noDeviceWithConnection",
      "connectionError",
      "metaAINotInstalled",
      "requestInProgress",
      "requestTimeout",
      "internalError",
    ].includes((error as { type: string }).type)
  );
}
```
