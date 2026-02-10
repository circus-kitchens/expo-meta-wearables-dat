# Mutex Struct

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_mutex

**Module:** MWDATCore

**Conformance:** `~Copyable`

## Overview

`Mutex<Value>` is a generic struct providing thread-safe mutually exclusive access to a wrapped value. It conforms to `~Copyable`, indicating it is a non-copyable type (move-only semantics in Swift 6+). This ensures strict ownership and prevents accidental shared mutable state.

## Swift API

### Signature

```swift
struct Mutex<Value>: ~Copyable
```

### Constructors

| Constructor                           | Description                                                                                                                       |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `init(_ initialValue: sending Value)` | Creates a new mutex wrapping the provided initial value. The `sending` keyword indicates the value is transferred into the mutex. |

**Signature:**

```swift
public init(_ initialValue: sending Value)
```

**Parameters:**

- `initialValue: sending Value` — The initial value to be protected by the mutex.

### Functions

| Function            | Description                                                                                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `withLock(_ body:)` | Executes a closure with exclusive access to the wrapped value. The closure receives a mutable reference to the value and can throw errors. Returns the result of the closure. |

**Signature:**

```swift
public func withLock<Result, E>(
    _ body: (inout sending Value) throws(E) -> sending Result
) -> sending Result
```

**Parameters:**

- `body: (inout sending Value) throws(E) -> sending Result` — A closure that receives mutable access to the protected value. The closure can throw errors of type `E` and returns a result of type `Result`.

**Returns:**

- `sending Result` — The value returned by the closure.

**Notes:**

- The `sending` keyword on parameters and return types indicates values are being transferred (moved) rather than shared.
- Generic error handling with `throws(E)` allows the closure to propagate typed errors.
- The `inout` parameter gives the closure exclusive mutable access to the protected value during the lock's scope.

## Usage Example

```swift
import MWDATCore

// Create a mutex protecting an integer counter
let counter = Mutex(0)

// Safely increment the counter
counter.withLock { value in
    value += 1
}

// Read and return the current value
let currentCount = counter.withLock { value in
    return value
}
print("Count: \(currentCount)")

// Example with error handling
enum CounterError: Error {
    case overflow
}

let result = counter.withLock { value -> Int in
    if value >= 100 {
        throw CounterError.overflow
    }
    value += 10
    return value
}
```

## TypeScript

**Mapping notes:**

- Swift generic `Mutex<Value>` → TypeScript generic class `Mutex<T>`
- `sending` keyword (move semantics) has no TS equivalent; document ownership transfer in comments
- `withLock` closure with `inout` → synchronous callback receiving mutable reference (modeled as callback with value parameter that returns updated value, or as Promise if async operations are expected in the bridge)
- Swift typed throws `throws(E)` → TypeScript callback can throw any error (use `unknown` or specific error union types)
- Non-copyable (`~Copyable`) → no direct TS equivalent; document that Mutex instances should not be cloned

```ts
/**
 * Mutex provides thread-safe mutually exclusive access to a wrapped value.
 *
 * This is a move-only type in Swift (non-copyable). In TypeScript/React Native,
 * treat Mutex instances as opaque handles that should not be duplicated.
 */
export class Mutex<T> {
  /**
   * Creates a new mutex wrapping the provided initial value.
   *
   * @param initialValue - The initial value to be protected by the mutex.
   *                       Ownership is transferred to the mutex.
   */
  constructor(initialValue: T);

  /**
   * Executes a function with exclusive access to the wrapped value.
   *
   * The provided callback receives the current value and returns an updated value.
   * The lock is held for the duration of the callback execution.
   *
   * @param body - A synchronous callback that receives the current value and returns
   *               the updated value (or the same value if no mutation is needed).
   *               Can throw errors.
   * @returns The result returned by the callback.
   * @throws Any error thrown by the callback.
   */
  withLock<Result>(body: (value: T) => Result): Result;
}
```
