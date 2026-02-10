# StreamSessionError

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcamera_streamsessionerror

## Overview

Errors that can occur during streaming sessions. This enum conforms to Swift's `Error` and `Equatable` protocols.

## Swift API

### Type

`enum StreamSessionError: Error, Equatable`

### Enumeration Cases

| Case                                   | Description                                                              |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `internalError`                        | An internal error occurred.                                              |
| `deviceNotFound(DeviceIdentifier)`     | The specified device could not be found. Contains the device identifier. |
| `deviceNotConnected(DeviceIdentifier)` | The specified device is not connected. Contains the device identifier.   |
| `timeout`                              | The operation timed out.                                                 |
| `videoStreamingError`                  | Video streaming encountered an error.                                    |
| `audioStreamingError`                  | Audio streaming encountered an error.                                    |
| `permissionDenied`                     | Camera permission was denied.                                            |
| `hingesClosed`                         | The device hinges were closed during streaming.                          |

### Associated Types

- **DeviceIdentifier**: A type alias used to identify specific devices (see `MWDATCore.DeviceIdentifier`)

### Usage Notes

- This enum represents all possible error states during a camera streaming session
- Two cases (`deviceNotFound` and `deviceNotConnected`) carry associated values containing the specific device identifier
- Errors can occur at different stages: permission checking, device connection, streaming operations, or hardware state changes
- The `hingesClosed` case is specific to foldable/glasses hardware where physical closure stops streaming

### Swift Example

```swift
import MWDATCamera

func handleStreamError(_ error: StreamSessionError) {
    switch error {
    case .internalError:
        print("Internal error occurred")
    case .deviceNotFound(let deviceId):
        print("Device not found: \(deviceId)")
    case .deviceNotConnected(let deviceId):
        print("Device not connected: \(deviceId)")
    case .timeout:
        print("Operation timed out")
    case .videoStreamingError:
        print("Video streaming error")
    case .audioStreamingError:
        print("Audio streaming error")
    case .permissionDenied:
        print("Camera permission denied")
    case .hingesClosed:
        print("Device hinges closed")
    }
}
```

## TypeScript

Mapping notes:

- Swift enums with associated values map to TypeScript discriminated unions with a `type` field
- `DeviceIdentifier` maps to `string` (UUID string representation)
- Cases without associated values become simple string literal types
- Cases with associated values become object types with a `type` discriminator and data payload

```ts
/**
 * Device identifier type (UUID string)
 */
export type DeviceIdentifier = string;

/**
 * Errors that can occur during streaming sessions.
 *
 * This is a discriminated union representing all possible error states
 * during a camera streaming session.
 */
export type StreamSessionError =
  | { type: "internalError" }
  | { type: "deviceNotFound"; deviceId: DeviceIdentifier }
  | { type: "deviceNotConnected"; deviceId: DeviceIdentifier }
  | { type: "timeout" }
  | { type: "videoStreamingError" }
  | { type: "audioStreamingError" }
  | { type: "permissionDenied" }
  | { type: "hingesClosed" };

/**
 * Type guard to check if an error is a StreamSessionError
 */
export function isStreamSessionError(error: unknown): error is StreamSessionError {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    typeof (error as any).type === "string"
  );
}
```
