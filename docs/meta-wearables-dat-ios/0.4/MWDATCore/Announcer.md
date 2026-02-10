# Announcer Protocol

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_announcer

## Overview

A protocol for objects that can announce events to registered listeners.

The `Announcer` protocol provides a generic event broadcasting mechanism. Objects conforming to this protocol can notify multiple listeners when events occur. This is a foundational pattern used throughout the Meta Wearables DAT SDK for observing state changes and receiving updates.

## Swift API

### Protocol Declaration

```swift
protocol Announcer
```

### Functions

#### `listen(_:)`

Registers a listener for events of type `T`.

**Signature:**

```swift
public func listen(_ listener: @Sendable @escaping (T) -> Void) -> AnyListenerToken
```

**Parameters:**

- `listener: @Sendable @escaping (T) -> Void` — The callback to execute when an event occurs.

**Returns:**

- `AnyListenerToken` — A token that can be used to cancel the listener.

**Notes:**

- The listener closure is marked as `@Sendable` and `@escaping`, making it safe to use across concurrency boundaries.
- Keep the returned `AnyListenerToken` to cancel the subscription when no longer needed.
- Listeners are invoked on the same thread/queue where the event is announced (check specific conforming types for threading guarantees).

## Usage Example

```swift
import MWDATCore

// Example conforming type (hypothetical)
class DeviceEventAnnouncer: Announcer {
    typealias T = DeviceEvent

    func listen(_ listener: @Sendable @escaping (DeviceEvent) -> Void) -> AnyListenerToken {
        // Implementation details...
    }
}

let announcer = DeviceEventAnnouncer()

// Register a listener
let token = announcer.listen { event in
    print("Received event: \(event)")
}

// Later, cancel the listener
token.cancel()
```

## TypeScript

**Mapping Notes:**

- Swift generic protocol with associated type `T` → TypeScript generic interface with type parameter `<T>`
- `@Sendable @escaping (T) -> Void` closure → TypeScript callback `(event: T) => void`
- `AnyListenerToken` return type → TypeScript interface with `cancel()` method
- Pattern maps to standard event emitter/listener pattern in JavaScript/TypeScript

````ts
/**
 * Token returned when registering a listener.
 * Call `cancel()` to unregister the listener.
 */
export interface AnyListenerToken {
  /**
   * Cancels the listener registration.
   * After calling this, the listener will no longer receive events.
   */
  cancel(): void;
}

/**
 * A protocol for objects that can announce events to registered listeners.
 *
 * @template T The type of event being announced
 */
export interface Announcer<T> {
  /**
   * Registers a listener for events of type T.
   *
   * @param listener The callback to execute when an event occurs
   * @returns A token that can be used to cancel the listener
   *
   * @example
   * ```ts
   * const token = announcer.listen((event) => {
   *   console.log('Received event:', event);
   * });
   *
   * // Later, to stop listening:
   * token.cancel();
   * ```
   */
  listen(listener: (event: T) => void): AnyListenerToken;
}
````
