# UnregistrationError

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_unregistrationerror

**Module:** MWDATCore

## Overview

Error conditions that can occur during the unregistration process. This enum conforms to `Error` protocol and is backed by `Int`, providing human-readable descriptions for each failure case.

## Swift API

### Type

```swift
enum UnregistrationError: Int, Error
```

**Extends:** `Int`, `Error`

### Enumeration Cases

| Case                   | Description                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `alreadyUnregistered`  | User is already unregistered when attempting to unregister again.                     |
| `configurationInvalid` | The Wearables Device Access Toolkit configuration is invalid or incomplete.           |
| `metaAINotInstalled`   | The Meta AI app is not installed on the device, which is required for unregistration. |
| `unknown`              | An unknown error occurred during the unregistration process.                          |

### Properties

| Property      | Type     | Access | Description                                                        |
| ------------- | -------- | ------ | ------------------------------------------------------------------ |
| `description` | `String` | Get    | Provides a human-readable description of the unregistration error. |

## Usage

The `UnregistrationError` enum is typically thrown or returned during the device unregistration flow. Each case represents a specific failure scenario:

```swift
import MWDATCore

// Example: Handling unregistration errors
do {
    try await wearables.unregister()
} catch let error as UnregistrationError {
    switch error {
    case .alreadyUnregistered:
        print("Already unregistered: \(error.description)")
    case .configurationInvalid:
        print("Configuration issue: \(error.description)")
    case .metaAINotInstalled:
        print("Meta AI app required: \(error.description)")
    case .unknown:
        print("Unknown error: \(error.description)")
    }
}
```

## TypeScript

### Mapping Notes

- Swift `enum` with `Int` raw value and `Error` conformance → TypeScript discriminated union with `type` field
- Each enum case becomes a distinct object type with `type` property matching the case name
- The `description` property is computed in Swift; expose as a helper function in TypeScript
- Error handling: These can be thrown as JS `Error` objects with the appropriate `type` property

### TypeScript Definitions

```ts
/**
 * Error conditions that can occur during the unregistration process.
 *
 * Each error case represents a specific failure scenario:
 * - `alreadyUnregistered`: User is already unregistered when attempting to unregister again
 * - `configurationInvalid`: The Wearables Device Access Toolkit configuration is invalid or incomplete
 * - `metaAINotInstalled`: The Meta AI app is not installed on the device, which is required for unregistration
 * - `unknown`: An unknown error occurred during the unregistration process
 */
export type UnregistrationError =
  | { type: "alreadyUnregistered" }
  | { type: "configurationInvalid" }
  | { type: "metaAINotInstalled" }
  | { type: "unknown" };

/**
 * Type guard to check if a value is an UnregistrationError.
 */
export function isUnregistrationError(value: unknown): value is UnregistrationError {
  if (typeof value !== "object" || value === null) return false;
  const error = value as { type?: unknown };
  return (
    error.type === "alreadyUnregistered" ||
    error.type === "configurationInvalid" ||
    error.type === "metaAINotInstalled" ||
    error.type === "unknown"
  );
}

/**
 * Returns a human-readable description of the unregistration error.
 */
export function getUnregistrationErrorDescription(error: UnregistrationError): string {
  switch (error.type) {
    case "alreadyUnregistered":
      return "User is already unregistered when attempting to unregister again.";
    case "configurationInvalid":
      return "The Wearables Device Access Toolkit configuration is invalid or incomplete.";
    case "metaAINotInstalled":
      return "The Meta AI app is not installed on the device, which is required for unregistration.";
    case "unknown":
      return "An unknown error occurred during the unregistration process.";
  }
}

/**
 * Creates a JavaScript Error with the UnregistrationError type embedded.
 * Useful for throwing typed errors in async operations.
 */
export class UnregistrationErrorException extends Error {
  constructor(public readonly unregistrationError: UnregistrationError) {
    super(getUnregistrationErrorDescription(unregistrationError));
    this.name = "UnregistrationErrorException";
  }
}
```
