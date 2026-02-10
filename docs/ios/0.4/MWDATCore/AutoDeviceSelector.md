# AutoDeviceSelector Class

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_autodeviceselector

**Module:** MWDATCore

**Extends:** DeviceSelector

**Modifiers:** final

## Overview

A device selector that automatically selects the best available device. Selects the first connected device from the devices list, falling back to the first device if none are connected.

## Swift API

### Signature

```swift
class AutoDeviceSelector: DeviceSelector
```

### Constructors

#### `init(wearables:)`

Creates an auto device selector that monitors the given wearables interface for device changes.

**Signature:**

```swift
public init(wearables: WearablesInterface)
```

**Parameters:**

- `wearables: WearablesInterface` — The wearables interface to monitor for available devices.

### Properties

#### `activeDevice`

**Access:** [Get][Set]

The currently active device identifier.

**Type:** `DeviceIdentifier?`

### Functions

#### `activeDeviceStream()`

Creates a stream of active device changes that updates whenever the device list changes.

**Signature:**

```swift
public func activeDeviceStream() -> AnyAsyncSequence<DeviceIdentifier?>
```

**Returns:**

- `AnyAsyncSequence<DeviceIdentifier?>` — An async sequence that emits the active device identifier whenever it changes.

## Usage Example

```swift
import MWDATCore

// Create auto device selector
let selector = AutoDeviceSelector(wearables: wearablesInstance)

// Access current device
if let deviceId = selector.activeDevice {
    print("Active device: \(deviceId)")
}

// Stream device changes
Task {
    for await deviceId in selector.activeDeviceStream() {
        if let id = deviceId {
            print("Device changed to: \(id)")
        } else {
            print("No device selected")
        }
    }
}
```

## TypeScript

### Conversion Notes

- The `AutoDeviceSelector` class becomes a TypeScript interface/class that wraps a native module
- Swift's `activeDevice` property (get/set) maps to property accessors in TS
- Swift's `AnyAsyncSequence` becomes an event emitter pattern in React Native context
- Use `addListener` / `removeListener` for the device stream subscription
- `DeviceIdentifier` is a string type alias (defined in MWDATCore)

### TypeScript Definition

```ts
/**
 * Device identifier type (UUID string)
 */
export type DeviceIdentifier = string;

/**
 * A device selector that automatically selects the best available device.
 * Selects the first connected device from the devices list, falling back
 * to the first device if none are connected.
 */
export interface AutoDeviceSelector {
  /**
   * The currently active device identifier.
   * Can be null if no device is selected.
   */
  activeDevice: DeviceIdentifier | null;

  /**
   * Creates a stream of active device changes that updates whenever
   * the device list changes.
   *
   * In React Native, this is implemented as an event emitter pattern.
   *
   * @returns A subscription object with a remove() method
   */
  addActiveDeviceListener(listener: (deviceId: DeviceIdentifier | null) => void): {
    remove: () => void;
  };
}

/**
 * Factory function to create an AutoDeviceSelector instance.
 *
 * @param wearables - The wearables interface to monitor for available devices
 * @returns A new AutoDeviceSelector instance
 */
export function createAutoDeviceSelector(wearables: WearablesInterface): AutoDeviceSelector;
```
