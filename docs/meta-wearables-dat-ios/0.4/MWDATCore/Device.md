# Device Class

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_device

**Module:** MWDATCore

**Modifiers:** final

**Extends:** Sendable

## Overview

AI glasses accessible through the Wearables Device Access Toolkit. The `Device` class represents a connected Meta wearable device and provides methods to query device state, monitor connection status, and check compatibility.

## Signature

```swift
class Device: Sendable
```

## Properties

| Property     | Type                   | Description                                                     |
| ------------ | ---------------------- | --------------------------------------------------------------- |
| `identifier` | `DeviceIdentifier`     | The unique identifier for this device.                          |
| `linkState`  | `LinkState` (get-only) | The current connection state of the device.                     |
| `name`       | `String` (get-only)    | The human-readable device name, or empty string if unavailable. |

## Functions

### `addCompatibilityListener(_:)`

Adds a listener to receive notifications when the device's compatibility changes.

**Signature:**

```swift
public func addCompatibilityListener(
    _ listener: @escaping @Sendable (Compatibility) -> Void
) -> AnyListenerToken
```

**Parameters:**

- `listener`: `@escaping @Sendable (Compatibility) -> Void` - The callback to execute when the compatibility changes.

**Returns:**

- `AnyListenerToken` - A token that can be used to cancel the listener.

---

### `addLinkStateListener(_:)`

Adds a listener to receive notifications when the device's link state changes.

**Signature:**

```swift
public func addLinkStateListener(
    _ listener: @escaping @Sendable (LinkState) -> Void
) -> AnyListenerToken
```

**Parameters:**

- `listener`: `@escaping @Sendable (LinkState) -> Void` - The callback to execute when the link state changes.

**Returns:**

- `AnyListenerToken` - A token that can be used to cancel the listener.

---

### `compatibility()`

Returns true if the version of this device is compatible with the Wearables Device Access Toolkit.

**Signature:**

```swift
public func compatibility() -> Compatibility
```

**Returns:**

- `Compatibility` - The compatibility status of the device.

---

### `deviceType()`

Returns the type of this device (e.g., Ray-Ban Meta).

**Signature:**

```swift
public func deviceType() -> DeviceType
```

**Returns:**

- `DeviceType` - The device type identifier.

---

### `nameOrId()`

Returns the device name if available, otherwise returns the device identifier. This provides a fallback for display purposes when the device name is not set.

**Signature:**

```swift
public func nameOrId() -> String
```

**Returns:**

- `String` - The device name or identifier as a fallback.

## Usage Example

```swift
import MWDATCore

// Assuming you have a device instance from Wearables
let device: Device = // ... obtained from DeviceStateSession

// Check device type
let type = device.deviceType()
print("Device type: \(type)")

// Get device name or fallback to ID
let displayName = device.nameOrId()
print("Device: \(displayName)")

// Check compatibility
let compat = device.compatibility()
if compat == .compatible {
    print("Device is compatible")
}

// Monitor link state changes
let linkToken = device.addLinkStateListener { newState in
    print("Link state changed to: \(newState)")
}

// Monitor compatibility changes
let compatToken = device.addCompatibilityListener { newCompat in
    print("Compatibility changed to: \(newCompat)")
}

// Later: cancel listeners when done
// linkToken and compatToken conform to AnyListenerToken protocol
```

## Related Types

- [`DeviceIdentifier`](./DeviceIdentifier.md) - Type alias for device unique identifier
- [`LinkState`](./LinkState.md) - Enum representing connection states
- [`DeviceType`](./DeviceType.md) - Enum representing device model types
- [`AnyListenerToken`](./AnyListenerToken.md) - Protocol for listener cancellation tokens
- `Compatibility` - Enum representing device compatibility status

## TypeScript

### Mapping Notes

- The `Device` class becomes an opaque reference in TypeScript (native module handle)
- Swift listener callbacks (`addCompatibilityListener`, `addLinkStateListener`) map to React Native event emitter patterns
- `DeviceIdentifier` maps to `string`
- `LinkState`, `DeviceType`, and `Compatibility` are enums that map to TypeScript string literal unions
- `AnyListenerToken` maps to an event subscription object with a `remove()` method

### TypeScript Definition

```ts
/**
 * AI glasses accessible through the Wearables Device Access Toolkit.
 *
 * The Device class represents a connected Meta wearable device and provides
 * methods to query device state, monitor connection status, and check compatibility.
 */
export interface Device {
  /** The unique identifier for this device. */
  readonly identifier: string;

  /** The current connection state of the device. */
  readonly linkState: LinkState;

  /** The human-readable device name, or empty string if unavailable. */
  readonly name: string;

  /**
   * Returns true if the version of this device is compatible with the
   * Wearables Device Access Toolkit.
   */
  compatibility(): Compatibility;

  /**
   * Returns the type of this device (e.g., Ray-Ban Meta).
   */
  deviceType(): DeviceType;

  /**
   * Returns the device name if available, otherwise returns the device identifier.
   * This provides a fallback for display purposes when the device name is not set.
   */
  nameOrId(): string;

  /**
   * Adds a listener to receive notifications when the device's compatibility changes.
   *
   * @param listener - The callback to execute when the compatibility changes.
   * @returns A subscription object that can be used to remove the listener.
   */
  addCompatibilityListener(listener: (compatibility: Compatibility) => void): EventSubscription;

  /**
   * Adds a listener to receive notifications when the device's link state changes.
   *
   * @param listener - The callback to execute when the link state changes.
   * @returns A subscription object that can be used to remove the listener.
   */
  addLinkStateListener(listener: (linkState: LinkState) => void): EventSubscription;
}

/** Event subscription returned by listener registration methods. */
export interface EventSubscription {
  /** Removes the event listener. */
  remove(): void;
}

/** Device compatibility status. */
export type Compatibility = "compatible" | "incompatible";

/** Device connection state. */
export type LinkState = "connected" | "disconnected" | "connecting";

/** Device model type identifier. */
export type DeviceType = "rayBanMeta" | "unknown";
```
