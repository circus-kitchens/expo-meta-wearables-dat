# MockRaybanMeta Protocol

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatmockdevice_mockraybanmeta

**Extends:** `MockDisplaylessGlasses`

## Overview

Protocol for simulating Ray-Ban Meta smart glasses behavior in testing and development. Inherits all functionality from `MockDisplaylessGlasses` while providing a specific type for Ray-Ban Meta device simulation.

This is a marker protocol with no additional members beyond those inherited from `MockDisplaylessGlasses`.

## Swift API

### Type

**Protocol** (marker protocol)

### Signature

```swift
protocol MockRaybanMeta: MockDisplaylessGlasses
```

### Inheritance

- Inherits all methods and properties from `MockDisplaylessGlasses`
- See [`MockDisplaylessGlasses`](mwdatmockdevice_mockdisplaylessglasses) for available methods:
  - `fold()` - Simulate folding the device
  - `unfold()` - Simulate unfolding the device
  - `getCameraKit()` - Access mock camera capabilities

## Usage

This protocol is used to type-specifically represent Ray-Ban Meta smart glasses in mock/testing scenarios. Since it's a marker protocol, all functionality comes from the parent `MockDisplaylessGlasses` protocol.

```swift
// Obtain a MockRaybanMeta instance from MockDeviceKit
let mockGlasses: MockRaybanMeta = MockDeviceKit.shared.pairRaybanMeta()

// Use inherited MockDisplaylessGlasses methods
await mockGlasses.unfold()
let cameraKit = await mockGlasses.getCameraKit()
```

## Notes

- This is a **marker protocol** — it declares conformance to `MockDisplaylessGlasses` but adds no new requirements
- Primarily used for type safety when working with Ray-Ban Meta specific mock devices
- All simulation behavior is inherited from `MockDisplaylessGlasses`

## TypeScript

**Mapping notes:**

- Swift marker protocol → TypeScript type alias extending parent interface
- All methods from `MockDisplaylessGlasses` are Promise-based in TS (async Swift methods bridge as Promises)
- No additional members beyond parent interface

```ts
/**
 * Protocol for simulating Ray-Ban Meta smart glasses behavior in testing and development.
 *
 * Inherits all functionality from MockDisplaylessGlasses while providing a specific type
 * for Ray-Ban Meta device simulation.
 */
export type MockRaybanMeta = MockDisplaylessGlasses;

/**
 * Type guard to check if a mock device is a MockRaybanMeta instance.
 *
 * Note: At runtime, MockRaybanMeta is identical to MockDisplaylessGlasses.
 * This guard is provided for semantic clarity in testing code.
 */
export function isMockRaybanMeta(device: MockDevice): device is MockRaybanMeta {
  return "fold" in device && "unfold" in device && "getCameraKit" in device;
}
```
