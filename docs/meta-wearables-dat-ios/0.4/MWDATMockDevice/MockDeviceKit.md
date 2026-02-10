# MockDeviceKit Enum

**URL**: https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatmockdevice_mockdevicekit

## Overview

The entry-point to the MockDeviceKit for managing simulated Meta Wearables devices. Use this in testing and development scenarios to simulate real hardware behavior.

`MockDeviceKit` is a namespace enum (Swift pattern using enum with no cases, only static members). It provides a singleton interface for managing mock devices during development and testing.

## Swift API

### Type

```swift
enum MockDeviceKit
```

**Pattern**: Namespace enum (no enumeration cases; static-only API surface)

### Properties

| Property | Description                                                          |
| -------- | -------------------------------------------------------------------- |
| `shared` | The shared instance of MockDeviceKit for managing simulated devices. |

**Property Details**:

#### `shared`

```swift
static var shared: MockDeviceKitInterface
```

Returns the shared singleton instance of MockDeviceKit for managing simulated Meta Wearables devices.

- **Type**: `MockDeviceKitInterface` (protocol)
- **Access**: Static, read-only
- **Purpose**: Provides access to mock device management functionality

## Usage

### Swift Example

```swift
import MWDATMockDevice

// Access the shared mock device kit instance
let mockKit = MockDeviceKit.shared

// Use the mock kit to create or manage simulated devices
// (Additional methods available through MockDeviceKitInterface protocol)
```

## Notes

- This is a namespace enum, meaning it cannot be instantiated
- All functionality is accessed through the static `shared` property
- The actual API surface is defined by the `MockDeviceKitInterface` protocol
- Used exclusively for development and testing scenarios
- Simulates real Meta Wearables hardware behavior

## TypeScript

### Conversion Notes

- Namespace enum with static-only API → TypeScript namespace or plain object
- `shared` property returns `MockDeviceKitInterface` → singleton pattern
- Map to a plain exported object with typed interface reference
- Swift static property → TypeScript const with readonly interface

### TypeScript Definition

```ts
/**
 * The entry-point to the MockDeviceKit for managing simulated Meta Wearables devices.
 * Use this in testing and development scenarios to simulate real hardware behavior.
 */
export interface MockDeviceKitInterface {
  // Methods defined in MockDeviceKitInterface protocol
  // (See separate MockDeviceKitInterface documentation)
}

/**
 * MockDeviceKit namespace providing access to mock device management.
 *
 * This is a singleton interface for managing simulated Meta Wearables devices
 * during development and testing.
 */
export namespace MockDeviceKit {
  /**
   * The shared instance of MockDeviceKit for managing simulated devices.
   */
  export const shared: MockDeviceKitInterface;
}

// Alternative: export as const object for more idiomatic TypeScript
export const MockDeviceKit: {
  readonly shared: MockDeviceKitInterface;
};
```
