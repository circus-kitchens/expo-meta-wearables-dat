# DeviceSelector Protocol

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_deviceselector

**Extends:** `Sendable`

## Overview

Protocol for selecting which device should be used for operations. Device selectors determine which available device should receive commands or stream data.

## Swift API Surface

### Type

**Protocol:** `DeviceSelector`

**Conformance:** `Sendable`

### Properties

| Property             | Description                                                                 |
| -------------------- | --------------------------------------------------------------------------- |
| `activeDevice` [Get] | The currently active device identifier, if any. Returns `DeviceIdentifier?` |

### Functions

#### `activeDeviceStream()`

Creates a stream of active device changes.

**Signature:**

```swift
public func activeDeviceStream() -> AnyAsyncSequence<DeviceIdentifier?>
```

**Returns:**

- `AnyAsyncSequence<DeviceIdentifier?>` - An async sequence that emits the currently active device identifier whenever it changes

## Usage Example

```swift
import MWDATCore

// Implement a custom device selector
class MyDeviceSelector: DeviceSelector {
    private var _activeDevice: DeviceIdentifier?

    var activeDevice: DeviceIdentifier? {
        return _activeDevice
    }

    func activeDeviceStream() -> AnyAsyncSequence<DeviceIdentifier?> {
        // Return an async sequence that emits device changes
        // Implementation would typically use AsyncStream or similar
    }

    func selectDevice(_ identifier: DeviceIdentifier) {
        _activeDevice = identifier
    }
}

// Use the device selector to monitor active device
let selector: DeviceSelector = AutoDeviceSelector()

// Monitor device changes
Task {
    for await device in selector.activeDeviceStream() {
        if let deviceId = device {
            print("Active device changed to: \(deviceId)")
        } else {
            print("No active device")
        }
    }
}

// Check current device
if let current = selector.activeDevice {
    print("Current device: \(current)")
}
```

## TypeScript

### Mapping Notes

- Swift `DeviceSelector` protocol → TypeScript `interface`
- Swift `AnyAsyncSequence<T>` → TypeScript `AsyncIterable<T>`
- Swift optional `DeviceIdentifier?` → TypeScript `string | null` (DeviceIdentifier is a type alias for String)
- Property `activeDevice` is read-only (get-only)
- The async sequence pattern can be implemented using async generators or event emitters in React Native context

### TypeScript Definition

```ts
/**
 * Protocol for selecting which device should be used for operations.
 * Device selectors determine which available device should receive commands or stream data.
 */
export interface DeviceSelector {
  /**
   * The currently active device identifier, if any.
   */
  readonly activeDevice: string | null;

  /**
   * Creates a stream of active device changes.
   * @returns An async iterable that emits the currently active device identifier whenever it changes.
   */
  activeDeviceStream(): AsyncIterable<string | null>;
}

/**
 * Type alias for device identifier (matches Swift DeviceIdentifier typealias)
 */
export type DeviceIdentifier = string;

/**
 * Helper: Check if a value is a valid DeviceSelector implementation
 */
export function isDeviceSelector(obj: unknown): obj is DeviceSelector {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "activeDevice" in obj &&
    "activeDeviceStream" in obj &&
    typeof (obj as DeviceSelector).activeDeviceStream === "function"
  );
}
```
