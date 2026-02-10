# RegistrationError Enum

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_registrationerror

**Module:** MWDATCore

**Conformance:** `Int`, `Error`

## Overview

Error conditions that can occur during the registration process.

## Signature

```swift
enum RegistrationError: Int, Error
```

## Enumeration Constants

| Member                 | Description                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `alreadyRegistered`    | User is already registered when attempting to register again.                           |
| `configurationInvalid` | The Wearables Device Access Toolkit configuration is invalid or incomplete.             |
| `metaAINotInstalled`   | The Meta AI app is not installed on the device, which is required for registration.     |
| `networkUnavailable`   | Network connection is unavailable. Please check your internet connection and try again. |
| `unknown`              | An unknown error occurred during the registration process.                              |

## Properties

| Property            | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| `description` [Get] | Provides a human-readable description of the registration error. |

## Swift Usage Example

```swift
import MWDATCore

// During registration, handle potential errors
do {
    try await wearables.register()
} catch let error as RegistrationError {
    switch error {
    case .alreadyRegistered:
        print("Already registered: \(error.description)")
    case .configurationInvalid:
        print("Configuration error: \(error.description)")
    case .metaAINotInstalled:
        print("Please install Meta AI app")
    case .networkUnavailable:
        print("Check network connection")
    case .unknown:
        print("Unknown error: \(error.description)")
    }
}
```

## TypeScript

### Conversion Notes

- Swift enum conforming to `Error` → TypeScript discriminated union with `type` field
- The `description` property from Swift Error protocol → computed `message` property in TS
- Swift `Int` raw values → not exposed in TS (use string literals for type safety)
- Swift `throw` → TypeScript `Promise` rejection or error return type

### TypeScript Types

```ts
/**
 * Error conditions that can occur during the registration process.
 */
export type RegistrationError =
  | { type: "alreadyRegistered"; message: string }
  | { type: "configurationInvalid"; message: string }
  | { type: "metaAINotInstalled"; message: string }
  | { type: "networkUnavailable"; message: string }
  | { type: "unknown"; message: string };

/**
 * Type guard to check if an error is a RegistrationError
 */
export function isRegistrationError(error: unknown): error is RegistrationError {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    typeof (error as any).type === "string" &&
    [
      "alreadyRegistered",
      "configurationInvalid",
      "metaAINotInstalled",
      "networkUnavailable",
      "unknown",
    ].includes((error as any).type)
  );
}

/**
 * Get a human-readable description for a registration error
 */
export function getRegistrationErrorDescription(error: RegistrationError): string {
  switch (error.type) {
    case "alreadyRegistered":
      return "User is already registered when attempting to register again.";
    case "configurationInvalid":
      return "The Wearables Device Access Toolkit configuration is invalid or incomplete.";
    case "metaAINotInstalled":
      return "The Meta AI app is not installed on the device, which is required for registration.";
    case "networkUnavailable":
      return "Network connection is unavailable. Please check your internet connection and try again.";
    case "unknown":
      return "An unknown error occurred during the registration process.";
  }
}
```
