# WearablesInterface Protocol

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_wearablesinterface

## Overview

The primary interface for Wearables Device Access Toolkit. This protocol defines the core API surface for managing device registration, permissions, session state, and device discovery for Meta AI glasses.

The `WearablesInterface` protocol conforms to `Sendable`, making it safe to use across concurrency boundaries.

## Swift API Surface

### Type

```swift
protocol WearablesInterface: Sendable
```

### Properties

| Property            | Type                            | Description                                                                                |
| ------------------- | ------------------------------- | ------------------------------------------------------------------------------------------ |
| `devices`           | `[DeviceIdentifier]` (get-only) | The current list of devices available.                                                     |
| `registrationState` | `RegistrationState` (get-only)  | The current registration state of the user's devices. See `RegistrationState` for options. |

### Functions

#### Device Management

##### `deviceForIdentifier(_:)`

Fetch the underlying `Device` object for a given `DeviceIdentifier`.

```swift
public func deviceForIdentifier(_ identifier: DeviceIdentifier) -> Device?
```

**Parameters:**

- `identifier`: `DeviceIdentifier` — The device identifier to fetch.

**Returns:** `Device?` — The `Device` object for the given device identifier, or `nil` if not found.

---

#### Listeners (Callback-based)

##### `addDevicesListener(_:)`

Adds a listener to receive callbacks when the device list changes. The listener is immediately called with the current devices.

```swift
public func addDevicesListener(
  _ listener: @Sendable @escaping ([DeviceIdentifier]) -> Void
) -> AnyListenerToken
```

**Parameters:**

- `listener`: `@Sendable @escaping ([DeviceIdentifier]) -> Void` — The callback to execute when the device list changes.

**Returns:** `AnyListenerToken` — A token that can be used to cancel the listener. When the token deinits, the listener is also canceled.

---

##### `addRegistrationStateListener(_:)`

Adds a listener to receive callbacks when the registration state changes. The listener is immediately called with the current state.

```swift
public func addRegistrationStateListener(
  _ listener: @Sendable @escaping (RegistrationState) -> Void
) -> AnyListenerToken
```

**Parameters:**

- `listener`: `@Sendable @escaping (RegistrationState) -> Void` — The callback to execute when the registration state changes.

**Returns:** `AnyListenerToken` — A token that can be used to cancel the listener. When the token deinits, the listener is also canceled.

---

##### `addDeviceSessionStateListener(forDeviceId:listener:)`

Adds a listener to receive callbacks when the session state changes for a specific device. The listener is immediately called with the current session state.

```swift
public func addDeviceSessionStateListener(
  forDeviceId: DeviceIdentifier,
  listener: @Sendable @escaping (SessionState) -> Void
) -> AnyListenerToken
```

**Parameters:**

- `forDeviceId`: `DeviceIdentifier` — The identifier of the device to listen for session state changes.
- `listener`: `@Sendable @escaping (SessionState) -> Void` — The callback to execute when the session state changes.

**Returns:** `AnyListenerToken` — A token that can be used to cancel the listener. When the token deinits, the listener is also canceled.

---

#### AsyncStream (Async/Await)

##### `devicesStream()`

Creates an `AsyncStream` for observing device list changes.

```swift
public func devicesStream() -> AsyncStream<[DeviceIdentifier]>
```

**Returns:** `AsyncStream<[DeviceIdentifier]>` — A stream of device identifier arrays.

---

##### `registrationStateStream()`

Creates an `AsyncStream` for observing registration state changes.

```swift
public func registrationStateStream() -> AsyncStream<RegistrationState>
```

**Returns:** `AsyncStream<RegistrationState>` — A stream of registration states.

---

#### Registration Flow

##### `startRegistration()`

Initiates the registration process with AI glasses. This method opens the Meta AI app where the user completes the registration flow. After the user completes the flow in the Meta AI app, your app will receive a callback URL that must be passed to `handleUrl(_:)` to complete the registration. The `registrationState` property will be updated throughout the registration process.

```swift
public func startRegistration() throws
```

**Throws:** `RegistrationError` or `WearablesError` if the registration cannot be initiated.

---

##### `startUnregistration()`

Initiates the unregistration process with AI glasses. This method opens the Meta AI app where the user completes the unregistration flow. After the user completes the flow in the Meta AI app, your app will receive a callback URL that must be passed to `handleUrl(_:)` to complete the unregistration. The `registrationState` property will be updated throughout the unregistration process.

```swift
public func startUnregistration() throws
```

**Throws:** `UnregistrationError` or `WearablesError` if the unregistration cannot be initiated.

---

##### `handleUrl(_:)`

Handles callback URLs from the Meta AI app during registration and permission flows.

This method must be called when your app receives a URL callback after the user completes an action in the Meta AI app. This includes callbacks from `startRegistration()`, `startUnregistration()`, and permission requests.

The SDK will determine if the URL is relevant to the Wearables Device Access Toolkit. If not relevant, the method returns `false` without throwing an error.

**Platform Flow (iOS):**

On iOS, the Meta AI app returns to your app via a URL scheme callback. You must:

1. Configure your app's URL schemes in Info.plist
2. Implement URL handling in your app delegate or scene delegate
3. Call this method with the received URL

```swift
public func handleUrl(_ url: URL) -> Bool
```

**Parameters:**

- `url`: `URL` — The incoming URL to handle.

**Returns:** `Bool` — `true` if the URL was handled by the Wearables Device Access Toolkit, `false` if it's not relevant to the Wearables Device Access Toolkit.

**Throws:** `WearablesHandleUrlError` if the URL is relevant but cannot be processed.

---

#### Permissions

##### `checkPermissionStatus(_:)`

Checks if a specific permission is granted for the current application.

```swift
public func checkPermissionStatus(_ permission: Permission) -> PermissionStatus
```

**Parameters:**

- `permission`: `Permission` — The type of permission to check.

**Returns:** `PermissionStatus` — The status of the permission.

**Throws:** `PermissionError` if the permission status cannot be determined.

---

##### `requestPermission(_:)`

Requests a specific permission on AI glasses. This method opens the Meta AI app where the user completes the permission request flow. After the user responds in the Meta AI app, your app will receive a callback URL that must be passed to `handleUrl(_:)` to complete the permission request.

```swift
public func requestPermission(_ permission: Permission) -> PermissionStatus
```

**Parameters:**

- `permission`: `Permission` — The type of permission to request.

**Returns:** `PermissionStatus` — The `PermissionStatus` after the user responds.

**Throws:** `PermissionError` if the permission request fails.

---

## Usage Example

```swift
import MWDATCore

class WearablesManager {
  private let wearables: WearablesInterface
  private var deviceListenerToken: AnyListenerToken?

  init(wearables: WearablesInterface) {
    self.wearables = wearables
  }

  func setup() {
    // Listen for device changes
    deviceListenerToken = wearables.addDevicesListener { [weak self] devices in
      print("Devices changed: \(devices)")
      self?.handleDeviceListUpdate(devices)
    }

    // Check registration state
    switch wearables.registrationState {
    case .registered:
      print("Already registered")
    case .available:
      // Can start registration
      break
    default:
      print("Registration not available")
    }
  }

  func registerGlasses() throws {
    try wearables.startRegistration()
    // Meta AI app will open; user completes flow there
  }

  func handleUrlCallback(_ url: URL) throws {
    let handled = wearables.handleUrl(url)
    if handled {
      print("URL handled by Wearables SDK")
    }
  }

  func requestCameraPermission() throws {
    let status = try wearables.requestPermission(.camera)
    print("Camera permission status: \(status)")
  }

  private func handleDeviceListUpdate(_ devices: [DeviceIdentifier]) {
    for deviceId in devices {
      if let device = wearables.deviceForIdentifier(deviceId) {
        print("Device available: \(device)")
      }
    }
  }

  deinit {
    // Listener token will auto-cancel on deinit
  }
}
```

## TypeScript

- Swift `@Sendable @escaping` closures → TypeScript callbacks `(param: T) => void`
- `AnyListenerToken` → interface with `cancel(): void` method
- `AsyncStream<T>` → `AsyncIterable<T>` using async generators or RxJS observables
- Swift optional return `Device?` → `Device | null`
- All listener methods fire immediately with current value, then on changes
- URL handling integrates with React Native Linking API

```ts
/**
 * The primary interface for Wearables Device Access Toolkit.
 * Manages device registration, permissions, session state, and device discovery.
 */
export interface WearablesInterface {
  /**
   * The current list of devices available.
   */
  readonly devices: string[]; // DeviceIdentifier = string

  /**
   * The current registration state of the user's devices.
   */
  readonly registrationState: RegistrationState;

  /**
   * Fetch the underlying Device object for a given DeviceIdentifier.
   * @param identifier - The device identifier to fetch.
   * @returns The Device object, or null if not found.
   */
  deviceForIdentifier(identifier: string): Device | null;

  /**
   * Adds a listener to receive callbacks when the device list changes.
   * The listener is immediately called with the current devices.
   * @param listener - The callback to execute when the device list changes.
   * @returns A token that can be used to cancel the listener.
   */
  addDevicesListener(listener: (devices: string[]) => void): AnyListenerToken;

  /**
   * Adds a listener to receive callbacks when the registration state changes.
   * The listener is immediately called with the current state.
   * @param listener - The callback to execute when the registration state changes.
   * @returns A token that can be used to cancel the listener.
   */
  addRegistrationStateListener(listener: (state: RegistrationState) => void): AnyListenerToken;

  /**
   * Adds a listener to receive callbacks when the session state changes for a specific device.
   * The listener is immediately called with the current session state.
   * @param deviceId - The identifier of the device to listen for session state changes.
   * @param listener - The callback to execute when the session state changes.
   * @returns A token that can be used to cancel the listener.
   */
  addDeviceSessionStateListener(
    deviceId: string,
    listener: (state: SessionState) => void
  ): AnyListenerToken;

  /**
   * Creates an async iterable for observing device list changes.
   * @returns An async iterable of device identifier arrays.
   */
  devicesStream(): AsyncIterable<string[]>;

  /**
   * Creates an async iterable for observing registration state changes.
   * @returns An async iterable of registration states.
   */
  registrationStateStream(): AsyncIterable<RegistrationState>;

  /**
   * Initiates the registration process with AI glasses.
   * Opens the Meta AI app where the user completes the registration flow.
   * After completion, your app receives a callback URL that must be passed to handleUrl().
   * @throws {RegistrationError | WearablesError}
   */
  startRegistration(): Promise<void>;

  /**
   * Initiates the unregistration process with AI glasses.
   * Opens the Meta AI app where the user completes the unregistration flow.
   * After completion, your app receives a callback URL that must be passed to handleUrl().
   * @throws {UnregistrationError | WearablesError}
   */
  startUnregistration(): Promise<void>;

  /**
   * Handles callback URLs from the Meta AI app during registration and permission flows.
   * Must be called when your app receives a URL callback after the user completes an action.
   * @param url - The incoming URL to handle.
   * @returns true if the URL was handled by the SDK, false if not relevant.
   * @throws {WearablesHandleUrlError}
   */
  handleUrl(url: string): Promise<boolean>;

  /**
   * Checks if a specific permission is granted for the current application.
   * @param permission - The type of permission to check.
   * @returns The status of the permission.
   * @throws {PermissionError}
   */
  checkPermissionStatus(permission: Permission): Promise<PermissionStatus>;

  /**
   * Requests a specific permission on AI glasses.
   * Opens the Meta AI app where the user completes the permission request flow.
   * After completion, your app receives a callback URL that must be passed to handleUrl().
   * @param permission - The type of permission to request.
   * @returns The permission status after the user responds.
   * @throws {PermissionError}
   */
  requestPermission(permission: Permission): Promise<PermissionStatus>;
}

/**
 * Token for cancelling listener subscriptions.
 */
export interface AnyListenerToken {
  /**
   * Cancels the listener subscription.
   */
  cancel(): void;
}
```
