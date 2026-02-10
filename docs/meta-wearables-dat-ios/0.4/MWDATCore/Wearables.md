# Wearables Enum

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_wearables

## Overview

The entry point for configuring and accessing the Wearables Device Access Toolkit. Provides registration, device management, permissions, and session state functionality for interacting with AI glasses.

This is a namespace enum (contains no cases) that serves as the main API surface for the Meta Wearables DAT SDK.

## Swift API

### Type

```swift
enum Wearables
```

**Kind:** Enumeration (namespace pattern — no cases)

### Properties

| Property | Access | Type                 | Description                                |
| -------- | ------ | -------------------- | ------------------------------------------ |
| `shared` | Get    | `WearablesInterface` | The shared Device Access Toolkit instance. |

### Functions

#### `configure()`

Configures the Wearables Device Access Toolkit with settings from the app bundle.

**Signature:**

```swift
public static func configure() throws
```

**Description:**

- Must be called once before accessing `shared` or using any other Wearables Device Access Toolkit functionality
- Subsequent calls will throw `WearablesError.alreadyConfigured`

**Throws:**

- `WearablesError` if configuration fails or has already been called

## Usage Example

```swift
import MWDATCore

// Configure the toolkit (call once at app launch)
do {
    try Wearables.configure()
} catch {
    print("Failed to configure Wearables: \(error)")
}

// Access the shared instance
let wearables = Wearables.shared

// Use wearables APIs
// (see WearablesInterface protocol for available methods)
```

## Notes

- The `Wearables` enum uses the Swift namespace pattern (an enum with static members but no cases)
- Configuration is required before accessing any functionality
- The `shared` property returns a `WearablesInterface` protocol conforming instance
- Configuration settings are loaded from the app bundle

## TypeScript

### Conversion Notes

- Swift namespace enum → TypeScript namespace with static methods
- `configure()` throws → returns `Promise<void>` that may reject
- `shared` property → singleton access pattern via `getInstance()`
- `WearablesInterface` protocol → TypeScript interface (see WearablesInterface.md)

### TypeScript Definition

````ts
/**
 * The entry point for configuring and accessing the Wearables Device Access Toolkit.
 *
 * Provides registration, device management, permissions, and session state functionality
 * for interacting with AI glasses.
 */
export namespace Wearables {
  /**
   * Configures the Wearables Device Access Toolkit with settings from the app bundle.
   *
   * This method must be called once before accessing `getInstance()` or using any other
   * Wearables Device Access Toolkit functionality. Subsequent calls will reject with
   * `WearablesError.alreadyConfigured`.
   *
   * @throws {WearablesError} If configuration fails or has already been called
   * @returns A promise that resolves when configuration is complete
   */
  export function configure(): Promise<void>;

  /**
   * Returns the shared Device Access Toolkit instance.
   *
   * @throws {WearablesError} If `configure()` has not been called first
   * @returns The shared WearablesInterface instance
   */
  export function getInstance(): WearablesInterface;
}

/**
 * Example usage:
 *
 * ```ts
 * import { Wearables } from 'expo-meta-wearables-dat';
 *
 * // Configure at app launch
 * await Wearables.configure();
 *
 * // Get the shared instance
 * const wearables = Wearables.getInstance();
 * ```
 */
````
