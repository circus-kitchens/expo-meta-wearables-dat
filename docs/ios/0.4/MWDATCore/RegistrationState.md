# RegistrationState Enum

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_registrationstate

**Module:** MWDATCore

**Extends:** `Int`

## Overview

Represents the current state of user registration with the Meta Wearables platform. This enum tracks the registration lifecycle from unavailability through to successful registration.

## Signature

```swift
enum RegistrationState: Int
```

## Enumeration Constants

| Member        | Description                                                         |
| ------------- | ------------------------------------------------------------------- |
| `unavailable` | Registration is not available, typically due to system constraints. |
| `available`   | Registration is available and can be initiated.                     |
| `registering` | Registration process is in progress.                                |
| `registered`  | User is successfully registered with the platform.                  |

## Properties

| Property            | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| `description` [Get] | Provides a human-readable description of the registration state. |

## Swift Usage Example

```swift
import MWDATCore

// Observing registration state changes
func handleRegistrationStateChange(_ state: RegistrationState) {
    switch state {
    case .unavailable:
        print("Registration unavailable: \(state.description)")
        // Handle unavailable state (e.g., show error message)

    case .available:
        print("Registration available: \(state.description)")
        // Enable registration UI

    case .registering:
        print("Registering: \(state.description)")
        // Show loading indicator

    case .registered:
        print("Registered: \(state.description)")
        // Proceed to next step
    }
}
```

## TypeScript

**Mapping Notes:**

- Swift enum with raw `Int` value → TypeScript string literal union (more idiomatic for JS/TS)
- `description` property → can be implemented as a helper function or included in discriminated union if needed
- Enum cases map directly to lowercase string literals

**TypeScript Definition:**

```ts
/**
 * Represents the current state of user registration with the Meta Wearables platform.
 * Tracks the registration lifecycle from unavailability through to successful registration.
 */
export type RegistrationState =
  | "unavailable" // Registration is not available, typically due to system constraints
  | "available" // Registration is available and can be initiated
  | "registering" // Registration process is in progress
  | "registered"; // User is successfully registered with the platform

/**
 * Provides a human-readable description of the registration state.
 *
 * @param state - The registration state
 * @returns A descriptive string for the given state
 */
export function getRegistrationStateDescription(state: RegistrationState): string {
  switch (state) {
    case "unavailable":
      return "Registration is not available";
    case "available":
      return "Registration is available";
    case "registering":
      return "Registration in progress";
    case "registered":
      return "Successfully registered";
  }
}

/**
 * Type guard to validate a value is a valid RegistrationState.
 *
 * @param value - The value to check
 * @returns True if value is a valid RegistrationState
 */
export function isRegistrationState(value: unknown): value is RegistrationState {
  return (
    typeof value === "string" &&
    ["unavailable", "available", "registering", "registered"].includes(value)
  );
}
```
