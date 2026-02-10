# AnyListenerToken Protocol

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_anylistenertoken

**Module:** MWDATCore

**Extends:** Sendable

## Overview

A token that can be used to cancel a listener subscription. When the token is no longer referenced, the listener is automatically canceled.

This protocol provides a mechanism for managing listener lifecycles in the Meta Wearables DAT SDK. Listeners registered via various `add*Listener` methods return an instance of `AnyListenerToken`, which can be used to explicitly cancel the subscription or allow automatic cleanup when the token is deallocated.

## Protocol Definition

### Signature

```swift
protocol AnyListenerToken: Sendable
```

### Conformance

- **Sendable**: Can be safely passed across concurrency boundaries

## Methods

### `cancel()`

Cancels the listener subscription asynchronously.

**Signature:**

```swift
public func cancel()
```

**Description:**

Explicitly cancels the listener subscription. After calling this method, the associated listener will no longer receive updates.

**Parameters:** None

**Returns:** None

## Lifecycle Notes

- **Automatic cleanup:** When the token is no longer referenced (goes out of scope or is deallocated), the listener is automatically canceled
- **Explicit cleanup:** Call `cancel()` to immediately stop receiving listener callbacks
- **Thread safety:** The protocol extends `Sendable`, making it safe to use across different threads/actors

## Usage Example

```swift
import MWDATCore

class MyViewController {
    private var listenerToken: AnyListenerToken?

    func startListening(device: Device) {
        // Register a listener and store the token
        listenerToken = device.addStateListener { state in
            print("Device state changed: \(state)")
        }
    }

    func stopListening() {
        // Explicitly cancel the listener
        listenerToken?.cancel()
        listenerToken = nil
    }

    deinit {
        // Token is automatically canceled when deallocated
        // But explicit cleanup is good practice
        listenerToken?.cancel()
    }
}
```

## TypeScript

**Mapping notes:**

- The `AnyListenerToken` protocol maps to a TypeScript interface with a `cancel()` method
- The `Sendable` conformance has no direct TypeScript equivalent but indicates thread-safety
- Listener registration methods that return `AnyListenerToken` in Swift should return this interface in TypeScript
- TypeScript consumers should call `cancel()` in cleanup logic (e.g., `useEffect` cleanup, component unmount)

```ts
/**
 * A token that can be used to cancel a listener subscription.
 * When the token is no longer referenced, the listener is automatically canceled.
 */
export interface AnyListenerToken {
  /**
   * Cancels the listener subscription asynchronously.
   * After calling this method, the associated listener will no longer receive updates.
   */
  cancel(): void;
}
```
