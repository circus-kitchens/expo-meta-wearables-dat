# MockDisplaylessGlasses Protocol

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatmockdevice_mockdisplaylessglasses

**Extends:** [MockDevice](./MockDevice.md)

## Overview

Protocol for simulating displayless smart glasses behavior in testing and development. Provides functionality for simulating folding/unfolding actions and camera capabilities.

This protocol extends `MockDevice` and adds specific functionality for testing glasses that have a foldable form factor and camera capabilities but no display (like Ray-Ban Meta glasses).

## Swift API

### Protocol Declaration

```swift
protocol MockDisplaylessGlasses: MockDevice
```

### Functions

#### `fold()`

Simulates folding the glasses into a closed position.

**Signature:**

```swift
public func fold()
```

**Description:** This method simulates the physical action of folding smart glasses. When called, it should trigger the appropriate hinge state changes and any associated device state updates.

---

#### `unfold()`

Simulates unfolding the glasses into an open position.

**Signature:**

```swift
public func unfold()
```

**Description:** This method simulates the physical action of unfolding smart glasses. When called, it should trigger the appropriate hinge state changes and any associated device state updates to reflect an open/active state.

---

#### `getCameraKit()`

Gets the suite for mocking camera functionality.

**Signature:**

```swift
public func getCameraKit() -> MockCameraKit
```

**Returns:**

- **MockCameraKit** — A `MockCameraKit` instance for controlling camera features.

**Description:** Returns a `MockCameraKit` instance that allows you to simulate camera-related functionality such as photo capture, video streaming, and camera configuration for testing purposes.

## Swift Usage Example

```swift
// Assuming you have a MockDisplaylessGlasses instance
let mockGlasses: MockDisplaylessGlasses = // ... obtain from MockDeviceKit

// Simulate unfolding the glasses
mockGlasses.unfold()

// Get the camera kit to control camera features
let cameraKit = mockGlasses.getCameraKit()

// Simulate folding the glasses
mockGlasses.fold()
```

## TypeScript

### Conversion Notes

- All methods are synchronous in Swift but should be wrapped as `Promise<void>` in TypeScript for React Native bridge compatibility
- `MockCameraKit` return type maps to a separate TypeScript interface
- The protocol inheritance (`MockDevice`) means implementers must also satisfy `MockDevice` interface requirements
- These are testing/mocking interfaces, not runtime device APIs

### TypeScript Definition

```ts
/**
 * Protocol for simulating displayless smart glasses behavior in testing and development.
 * Provides functionality for simulating folding/unfolding actions and camera capabilities.
 *
 * Extends MockDevice.
 */
export interface MockDisplaylessGlasses extends MockDevice {
  /**
   * Simulates folding the glasses into a closed position.
   * Triggers appropriate hinge state changes and device state updates.
   */
  fold(): Promise<void>;

  /**
   * Simulates unfolding the glasses into an open position.
   * Triggers appropriate hinge state changes and device state updates.
   */
  unfold(): Promise<void>;

  /**
   * Gets the suite for mocking camera functionality.
   *
   * @returns A MockCameraKit instance for controlling camera features.
   */
  getCameraKit(): Promise<MockCameraKit>;
}

/**
 * Reference to MockCameraKit interface.
 * This should be imported from the MockCameraKit module.
 */
export type { MockCameraKit } from "./MockCameraKit";

/**
 * Reference to MockDevice interface.
 * This should be imported from the MockDevice module.
 */
export type { MockDevice } from "./MockDevice";
```
