# MockDeviceKitError Enum

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatmockdevice_mockdevicekiterror

**Module:** MWDATMockDevice

**Conformance:** Error

## Overview

Errors that can occur when using MockDeviceKit.

This is a simple error enum with a single case representing unknown/generic errors that may occur during mock device operations.

## Swift API

### Signature

```swift
enum MockDeviceKitError: Error
```

### Enumeration Constants

| Member    | Description                       |
| --------- | --------------------------------- |
| `unknown` | A generic unknown error occurred. |

### Usage

This error type is thrown by MockDeviceKit operations when an unexpected or unspecified error condition occurs. Since it currently has only a single case, all MockDeviceKit errors will be of type `unknown`.

**Example:**

```swift
do {
    // MockDeviceKit operation that may throw
    try mockDevice.performOperation()
} catch let error as MockDeviceKitError {
    switch error {
    case .unknown:
        print("An unknown MockDeviceKit error occurred")
    }
} catch {
    print("A different error occurred: \(error)")
}
```

## TypeScript

- Swift enum conforming to `Error` → TS discriminated union + Error subclass for throw/catch
- Single case `unknown` maps to object with `type: "unknown"`
- Include both a type definition for exhaustive matching and an Error class for compatibility with JS error handling

```ts
/**
 * Errors that can occur when using MockDeviceKit.
 */
export type MockDeviceKitError = {
  type: "unknown";
};

/**
 * Error class for MockDeviceKit errors.
 * Thrown by MockDeviceKit operations when unexpected errors occur.
 */
export class MockDeviceKitErrorClass extends Error {
  constructor(public readonly error: MockDeviceKitError) {
    super(`MockDeviceKit error: ${error.type}`);
    this.name = "MockDeviceKitError";
  }
}

/**
 * Type guard to check if a value is a MockDeviceKitError.
 */
export function isMockDeviceKitError(value: unknown): value is MockDeviceKitError {
  return typeof value === "object" && value !== null && "type" in value && value.type === "unknown";
}
```
