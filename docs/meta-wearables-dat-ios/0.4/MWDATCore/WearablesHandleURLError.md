# WearablesHandleURLError Enum

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_wearableshandleurlerror

**Module:** MWDATCore

**Extends:** Int, Error

## Overview

Errors that can occur during URL handling in the Meta Wearables DAT SDK. This enum represents errors that may arise when processing registration and unregistration URLs.

## Swift API

### Signature

```swift
enum WearablesHandleURLError: Int, Error
```

### Enumeration Constants

| Member                | Description                                                               |
| --------------------- | ------------------------------------------------------------------------- |
| `registrationError`   | An unexpected internal error occurred during registration URL handling.   |
| `unregistrationError` | An unexpected internal error occurred during unregistration URL handling. |

### Properties

| Property      | Access | Description                                         |
| ------------- | ------ | --------------------------------------------------- |
| `description` | Get    | Provides a human-readable description of the error. |

## Usage

```swift
import MWDATCore

// Handle URL processing errors
do {
    try Wearables.shared.handleURL(url)
} catch let error as WearablesHandleURLError {
    switch error {
    case .registrationError:
        print("Registration URL handling failed: \(error.description)")
    case .unregistrationError:
        print("Unregistration URL handling failed: \(error.description)")
    }
} catch {
    print("Other error: \(error)")
}
```

## TypeScript

- Swift `Int`-based error enum → TypeScript discriminated union with `type` field + Error subclass
- Both cases have no associated values, so they map to simple string literals
- Include type guard function for runtime validation
- Provide Error subclass for throw/catch compatibility
- Include description helper for error messages

```ts
/**
 * Errors that can occur during URL handling.
 */
export type WearablesHandleURLError =
  | { type: "registrationError" }
  | { type: "unregistrationError" };

/**
 * Error class for WearablesHandleURLError, compatible with throw/catch.
 */
export class WearablesHandleURLErrorClass extends Error {
  constructor(public readonly errorType: WearablesHandleURLError) {
    super(getWearablesHandleURLErrorDescription(errorType));
    this.name = "WearablesHandleURLError";
  }
}

/**
 * Type guard to check if a value is a WearablesHandleURLError.
 */
export function isWearablesHandleURLError(value: unknown): value is WearablesHandleURLError {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value.type === "registrationError" || value.type === "unregistrationError")
  );
}

/**
 * Get a human-readable description for a WearablesHandleURLError.
 */
export function getWearablesHandleURLErrorDescription(error: WearablesHandleURLError): string {
  switch (error.type) {
    case "registrationError":
      return "An unexpected internal error occurred during registration URL handling.";
    case "unregistrationError":
      return "An unexpected internal error occurred during unregistration URL handling.";
  }
}
```
