# MockDevice Protocol

**URL**: https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatmockdevice_mockdevice

## Overview

The `MockDevice` protocol defines the interface for mock devices used in testing and development scenarios. It provides methods to simulate device lifecycle events such as power on/off and don/doff (putting on/taking off the device).

## Swift API

### Signature

```swift
protocol MockDevice
```

### Properties

| Property                 | Description                                                                      |
| ------------------------ | -------------------------------------------------------------------------------- |
| `deviceIdentifier` [Get] | The unique device identifier for this mock device. Returns a `DeviceIdentifier`. |

### Functions

#### `don()`

Simulates putting on (donning) the device.

```swift
public func don()
```

**Description**: Call this method to simulate the user putting on the wearable device. This triggers the device state to reflect that it is being worn.

---

#### `doff()`

Simulates taking off (doffing) the device.

```swift
public func doff()
```

**Description**: Call this method to simulate the user taking off the wearable device. This triggers the device state to reflect that it is no longer being worn.

---

#### `powerOn()`

Powers on the mock device.

```swift
public func powerOn()
```

**Description**: Simulates powering on the device. This transitions the device into an active state.

---

#### `powerOff()`

Powers off the mock device.

```swift
public func powerOff()
```

**Description**: Simulates powering off the device. This transitions the device into an inactive state.

---

## Swift Usage Example

```swift
import MWDATMockDevice

// Assuming you have a mock device instance conforming to MockDevice
let mockDevice: MockDevice = // ... obtained from MockDeviceKit

// Power on the device
mockDevice.powerOn()

// Simulate putting on the device
mockDevice.don()

// ... perform tests with device in "worn" state

// Simulate taking off the device
mockDevice.doff()

// Power off the device
mockDevice.powerOff()
```

## TypeScript

**Mapping Notes**:

- Swift protocol → TypeScript `interface`
- `DeviceIdentifier` (Swift type alias for `String`) → `string`
- All methods are synchronous in Swift; keep synchronous in TS or wrap in Promises based on React Native bridge requirements
- Methods have no return values (void)

```ts
/**
 * Interface for mock devices used in testing and development.
 * Provides methods to simulate device lifecycle events.
 */
export interface MockDevice {
  /**
   * The unique device identifier for this mock device.
   */
  readonly deviceIdentifier: string;

  /**
   * Simulates putting on (donning) the device.
   * Triggers device state to reflect that it is being worn.
   */
  don(): void;

  /**
   * Simulates taking off (doffing) the device.
   * Triggers device state to reflect that it is no longer being worn.
   */
  doff(): void;

  /**
   * Powers on the mock device.
   * Transitions the device into an active state.
   */
  powerOn(): void;

  /**
   * Powers off the mock device.
   * Transitions the device into an inactive state.
   */
  powerOff(): void;
}
```
