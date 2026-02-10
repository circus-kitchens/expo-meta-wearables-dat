# MockDeviceKitInterface Protocol

**URL**: https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatmockdevice_mockdevicekitinterface

## Overview

Interface for managing mock Meta Wearables devices for testing and development. This protocol provides methods for pairing and unpairing simulated devices, enabling developers to test their applications without requiring physical hardware.

## Swift API

### Signature

```swift
protocol MockDeviceKitInterface
```

### Properties

| Property              | Description                                    |
| --------------------- | ---------------------------------------------- |
| `pairedDevices` [Get] | The list of all currently paired mock devices. |

#### Property Details

**`pairedDevices`**

Returns the list of all currently paired mock devices.

```swift
var pairedDevices: [MockDevice] { get }
```

**Returns**: Array of `MockDevice` instances representing all currently paired mock devices.

### Functions

#### `pairRaybanMeta()`

Pairs a simulated Ray-Ban Meta device.

```swift
public func pairRaybanMeta() -> MockRaybanMeta
```

**Returns**: `MockRaybanMeta` - A mock Ray-Ban Meta device instance.

**Usage**: Call this method to create and pair a simulated Ray-Ban Meta device for testing purposes.

---

#### `unpairDevice(_:)`

Unpairs a simulated device.

```swift
public func unpairDevice(_ device: MockDevice)
```

**Parameters**:

- `device`: `MockDevice` - The mock device to unpair.

**Usage**: Call this method to remove a previously paired mock device from the list of paired devices.

## Usage Example

```swift
// Get access to the mock device kit interface
let mockKit: MockDeviceKitInterface = // ... obtain instance

// Pair a simulated Ray-Ban Meta device
let mockRayban = mockKit.pairRaybanMeta()

// Check paired devices
let devices = mockKit.pairedDevices
print("Currently paired devices: \(devices.count)")

// Unpair the device when done
mockKit.unpairDevice(mockRayban)
```

## Notes

- This protocol is part of the **MWDATMockDevice** module
- Mock devices are useful for development and testing without physical hardware
- The protocol currently supports pairing Ray-Ban Meta devices via `pairRaybanMeta()`
- Additional device types may be added in future versions
- Mock devices can be managed through the `pairedDevices` property

## TypeScript

### Mapping Notes

- Swift protocol → TypeScript `interface`
- `pairedDevices` is a computed property (get-only) → readonly array in TS
- `pairRaybanMeta()` is synchronous in Swift but may need to be async in React Native bridge → returns `Promise<MockRaybanMeta>`
- `unpairDevice` takes a `MockDevice` reference → TS should accept the same type
- Array types `[MockDevice]` → `MockDevice[]`

### TypeScript Definitions

```ts
/**
 * Interface for managing mock Meta Wearables devices for testing and development.
 *
 * Provides methods for pairing and unpairing simulated devices, enabling
 * developers to test applications without requiring physical hardware.
 */
export interface MockDeviceKitInterface {
  /**
   * The list of all currently paired mock devices.
   */
  readonly pairedDevices: MockDevice[];

  /**
   * Pairs a simulated Ray-Ban Meta device.
   *
   * @returns A promise that resolves to a mock Ray-Ban Meta device instance
   */
  pairRaybanMeta(): Promise<MockRaybanMeta>;

  /**
   * Unpairs a simulated device.
   *
   * @param device - The mock device to unpair
   * @returns A promise that resolves when the device is unpaired
   */
  unpairDevice(device: MockDevice): Promise<void>;
}
```
