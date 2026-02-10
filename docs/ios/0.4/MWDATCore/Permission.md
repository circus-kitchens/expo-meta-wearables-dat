# Permission

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_permission

## Overview

The `Permission` enum represents the types of permissions that can be requested from AI glasses. It conforms to the `Sendable` protocol, making it safe to pass across concurrency boundaries.

## Swift API

### Type

```swift
enum Permission: Sendable
```

### Enumeration Cases

| Case     | Description                                                                 |
| -------- | --------------------------------------------------------------------------- |
| `camera` | Permission to access camera functionality on the connected wearable device. |

### Conformances

- `Sendable`

## Usage Example

```swift
import MWDATCore

// Request camera permission
let permission = Permission.camera

// Use with Wearables interface to request permissions
// (Typically used with methods like requestPermissions(_:) on Wearables)
```

## TypeScript

### Conversion Notes

- Simple enum with a single case maps to a string literal type in TypeScript
- Can be represented as a union type for extensibility
- The `Sendable` conformance has no direct TypeScript equivalent but indicates thread-safety in Swift

### TypeScript Definition

```ts
/**
 * Represents the types of permissions that can be requested from AI glasses.
 */
export type Permission = "camera";

/**
 * Type guard to check if a string is a valid Permission.
 */
export function isPermission(value: string): value is Permission {
  return value === "camera";
}
```
