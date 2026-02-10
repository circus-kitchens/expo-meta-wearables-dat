# DeviceIdentifier

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_deviceidentifier

## Overview

`DeviceIdentifier` is a type alias representing a unique identifier for a Meta Wearables device.

## Swift API

### Type Alias Definition

```swift
public typealias DeviceIdentifier = String
```

### Description

- **Type:** String-based identifier
- **Purpose:** Uniquely identifies a Meta Wearables device within the system
- **Module:** MWDATCore
- **Visibility:** Public

### Usage Context

The `DeviceIdentifier` type is used throughout the MWDATCore module to reference specific wearable devices. It's commonly used in:

- Device selection (see `SpecificDeviceSelector`)
- Device state tracking
- Session management
- Registration and pairing operations

### Example Usage

```swift
// Using DeviceIdentifier with SpecificDeviceSelector
let deviceId: DeviceIdentifier = "device-uuid-12345"
let selector = SpecificDeviceSelector(deviceId: deviceId)

// Comparing device identifiers
func isTargetDevice(_ device: Device) -> Bool {
    return device.identifier == deviceId
}
```

## TypeScript

- Swift `String` → TypeScript `string`
- Type alias maps directly to a nominal type in TypeScript for type safety
- Consider using branded types or UUIDs depending on the actual format of device identifiers

```ts
/**
 * A unique identifier for a Meta Wearables device.
 *
 * This is a string-based identifier used throughout the SDK to reference
 * specific wearable devices during selection, pairing, and session management.
 */
export type DeviceIdentifier = string;

/**
 * Type guard to validate a string as a DeviceIdentifier.
 *
 * Note: This is a simple runtime check. In production, you may want to
 * validate the format (e.g., UUID pattern) based on actual device ID structure.
 */
export function isDeviceIdentifier(value: unknown): value is DeviceIdentifier {
  return typeof value === "string" && value.length > 0;
}
```
