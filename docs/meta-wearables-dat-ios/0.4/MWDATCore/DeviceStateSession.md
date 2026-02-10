# DeviceStateSession Class

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_devicestatesession

**Modifiers:** `final`
**Conformance:** `Sendable`

## Overview

`DeviceStateSession` manages a session for monitoring device state changes. It provides a lifecycle-managed interface for tracking state updates from a selected wearable device.

## Signature

```swift
class DeviceStateSession: Sendable
```

## Initializer

### `init(deviceSelector:)`

Creates a new device state session for monitoring the specified device.

**Signature:**

```swift
public init(deviceSelector: DeviceSelector)
```

**Parameters:**

- `deviceSelector`: A `DeviceSelector` that determines which device to monitor. This can be an `AutoDeviceSelector` or `SpecificDeviceSelector`.

## Properties

### `state` (read-only)

The current state of the device session.

**Type:** `DeviceState`
**Access:** Get-only (computed property)

**Description:**
Provides access to the current state of the monitored device. Subscribe to state changes via this property or use listener patterns for reactive updates.

## Methods

### `start()`

Starts the device state session and begins monitoring the selected device for state changes.

**Signature:**

```swift
public func start()
```

**Description:**
Call this method to initiate monitoring of device state. The session will track changes such as connection status, battery level, hinge state, and other device-specific properties as they occur.

### `stop()`

Stops the device state session, releases resources, and stops monitoring device state changes.

**Signature:**

```swift
public func stop()
```

**Description:**
Call this method to gracefully terminate the session. After calling `stop()`, no further state updates will be received. Resources allocated for monitoring are released.

## Usage Example

```swift
import MWDATCore

// Create a device selector (auto-select the first available device)
let selector = AutoDeviceSelector()

// Initialize the session
let stateSession = DeviceStateSession(deviceSelector: selector)

// Start monitoring
stateSession.start()

// Access current state
let currentState = stateSession.state
print("Device link state: \(currentState.linkState)")

// Later, when done monitoring
stateSession.stop()
```

## Lifecycle & Threading

- **Sendable conformance:** This class is safe to pass across concurrency boundaries.
- **Resource management:** Always call `stop()` when done to free resources.
- **State transitions:** `start()` → monitoring active → `stop()` → monitoring inactive.

## Related Types

- [`DeviceSelector`](https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_deviceselector) – Protocol for selecting which device to monitor
- [`AutoDeviceSelector`](https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_autodeviceselector) – Auto-selects the first available device
- [`SpecificDeviceSelector`](https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_specificdeviceselector) – Selects a specific device by identifier
- `DeviceState` – The state object containing device properties

---

## TypeScript

**Conversion notes:**

- Swift class → TS interface with factory function for instantiation
- `start()` and `stop()` are synchronous but may trigger async state changes internally
- The `state` property should expose a reactive pattern (event emitter or observable)
- `DeviceSelector` becomes a discriminated union of selector types
- `Sendable` conformance noted in docs but has no runtime TS equivalent

```ts
/**
 * Manages a session for monitoring device state changes.
 *
 * This class provides a lifecycle-managed interface for tracking state updates
 * from a selected wearable device.
 */
export interface DeviceStateSession {
  /**
   * The current state of the device session (read-only).
   */
  readonly state: DeviceState;

  /**
   * Starts the device state session.
   * Begins monitoring the selected device for state changes.
   */
  start(): void;

  /**
   * Stops the device state session.
   * Releases resources and stops monitoring device state changes.
   */
  stop(): void;
}

/**
 * Configuration for creating a DeviceStateSession.
 */
export interface DeviceStateSessionConfig {
  /**
   * A device selector that determines which device to monitor.
   */
  deviceSelector: DeviceSelector;
}

/**
 * Factory function to create a DeviceStateSession instance.
 *
 * @param config - Configuration object containing the device selector
 * @returns A new DeviceStateSession instance
 */
export function createDeviceStateSession(config: DeviceStateSessionConfig): DeviceStateSession;
```
