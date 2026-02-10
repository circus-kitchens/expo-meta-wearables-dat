# PermissionStatus Enum

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_permissionstatus

**Module:** MWDATCore

**Extends:** Sendable

## Overview

Represents the status of a permission request. This enum provides two possible states for permission handling: granted or denied.

## Swift API

### Signature

```swift
enum PermissionStatus: Sendable
```

### Enumeration Constants

| Member    | Description                                  |
| --------- | -------------------------------------------- |
| `granted` | The permission has been granted by the user. |
| `denied`  | The permission has been denied by the user.  |

### Conformances

- **Sendable**: This enum can be safely passed across concurrency boundaries.

## Usage Example

```swift
import MWDATCore

// Check permission status
let status: PermissionStatus = .granted

switch status {
case .granted:
    print("Permission has been granted")
    // Proceed with the action
case .denied:
    print("Permission has been denied")
    // Handle denial (e.g., show explanation UI)
}
```

## TypeScript

### Conversion Notes

- Swift enum with no associated values maps to TypeScript string literal union
- Both cases are simple string values
- The `Sendable` conformance has no direct TypeScript equivalent (concurrency safety is not enforced at the type level in TS)

### TypeScript Definition

```ts
/**
 * Represents the status of a permission request.
 */
export type PermissionStatus = "granted" | "denied";

/**
 * Type guard to check if a value is a valid PermissionStatus
 */
export function isPermissionStatus(value: unknown): value is PermissionStatus {
  return value === "granted" || value === "denied";
}
```
