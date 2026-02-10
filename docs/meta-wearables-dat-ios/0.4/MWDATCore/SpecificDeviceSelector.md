# SpecificDeviceSelector Class

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_specificdeviceselector

**Module:** MWDATCore

**Extends:** [DeviceSelector](https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_deviceselector)

**Modifiers:** `final`

## Overview

A device selector that always selects a specific, predetermined device. Use this when you want to target operations to a particular device by its identifier.

## Swift API

### Signature

```swift
class SpecificDeviceSelector: DeviceSelector
```

### Initializers

#### `init(device:)`

Creates a device selector that targets a specific device.

```swift
public init(device: DeviceIdentifier)
```

**Parameters:**

- `device`: `DeviceIdentifier` — The identifier of the device to always select.

### Properties

#### `activeDevice` [Get]

The currently active device identifier.

**Type:** `DeviceIdentifier?` (inferred from return type of stream)

### Methods

#### `activeDeviceStream()`

Creates a stream that immediately yields the specific device and then completes.

```swift
public func activeDeviceStream() -> AnyAsyncSequence<DeviceIdentifier?>
```

**Returns:**

- `AnyAsyncSequence<DeviceIdentifier?>` — An async sequence that yields the specific device identifier once, then completes.

## Usage Example

```swift
import MWDATCore

// Create a selector for a specific device
let deviceId: DeviceIdentifier = "device-12345"
let selector = SpecificDeviceSelector(device: deviceId)

// Access the active device
let activeDevice = selector.activeDevice

// Stream device changes (yields once, then completes)
for await device in selector.activeDeviceStream() {
    print("Selected device: \(device ?? "none")")
}
```

## TypeScript

### Mapping Notes

- Swift `DeviceIdentifier` maps to `string` (see type alias documentation)
- Swift `AnyAsyncSequence<T>` maps to `AsyncIterable<T>` in TypeScript
- The `activeDevice` property is read-only (marked `[Get]` in Swift)
- The stream pattern maps to an async iterable that yields once then completes

### TypeScript Types

```ts
/**
 * A device selector that always selects a specific, predetermined device.
 * Use this when you want to target operations to a particular device by its identifier.
 */
export interface SpecificDeviceSelector extends DeviceSelector {
  /**
   * The currently active device identifier.
   */
  readonly activeDevice: string | null;

  /**
   * Creates a stream that immediately yields the specific device and then completes.
   * @returns An async iterable that yields the specific device identifier once, then completes.
   */
  activeDeviceStream(): AsyncIterable<string | null>;
}

/**
 * Creates a device selector that targets a specific device.
 * @param device The identifier of the device to always select.
 * @returns A SpecificDeviceSelector instance.
 */
export function createSpecificDeviceSelector(device: string): SpecificDeviceSelector;
```
