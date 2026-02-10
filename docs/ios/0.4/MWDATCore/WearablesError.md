# WearablesError Enum

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_wearableserror

**Module:** MWDATCore

**Extends:** Int, Error

## Overview

Errors that can occur during Device Access Toolkit configuration.

## Signature

```swift
enum WearablesError: Int, Error
```

## Enumeration Constants

| Member               | Description                                                 |
| -------------------- | ----------------------------------------------------------- |
| `internalError`      | An unexpected internal error occurred during configuration. |
| `alreadyConfigured`  | The Device Access Toolkit has already been configured.      |
| `configurationError` | The configuration provided is invalid or incomplete.        |

## Properties

| Property            | Description                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `description` [Get] | A human-readable description of the error. Computed property inherited from Error protocol conformance. |

## Usage Example

```swift
import MWDATCore

do {
    try Wearables.configure()
} catch let error as WearablesError {
    switch error {
    case .internalError:
        print("Internal error: \(error.description)")
    case .alreadyConfigured:
        print("Already configured: \(error.description)")
    case .configurationError:
        print("Configuration error: \(error.description)")
    }
} catch {
    print("Unknown error: \(error)")
}
```

## TypeScript

**Mapping notes:**

- Swift enum with Int raw value and Error conformance → TS discriminated union with `type` field
- Each case becomes a distinct type in the union for exhaustive pattern matching
- `description` property maps to a helper function for error messages
- Conforms to standard JavaScript `Error` for throw/catch compatibility

```ts
/**
 * Errors that can occur during Device Access Toolkit configuration.
 */
export type WearablesError =
  | { type: "internalError"; message: string }
  | { type: "alreadyConfigured"; message: string }
  | { type: "configurationError"; message: string };

/**
 * Type guard to check if an error is a WearablesError.
 */
export function isWearablesError(error: unknown): error is WearablesError {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    typeof (error as any).type === "string" &&
    ["internalError", "alreadyConfigured", "configurationError"].includes((error as any).type) &&
    "message" in error &&
    typeof (error as any).message === "string"
  );
}

/**
 * Get a human-readable description for a WearablesError.
 */
export function getWearablesErrorDescription(error: WearablesError): string {
  switch (error.type) {
    case "internalError":
      return "An unexpected internal error occurred during configuration.";
    case "alreadyConfigured":
      return "The Device Access Toolkit has already been configured.";
    case "configurationError":
      return "The configuration provided is invalid or incomplete.";
  }
}

/**
 * WearablesError as a JavaScript Error subclass for throw/catch usage.
 */
export class WearablesErrorClass extends Error {
  constructor(public readonly errorType: WearablesError) {
    super(errorType.message || getWearablesErrorDescription(errorType));
    this.name = "WearablesError";
  }
}
```
