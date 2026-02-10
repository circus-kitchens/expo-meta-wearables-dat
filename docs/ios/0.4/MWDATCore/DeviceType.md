# DeviceType

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcore_devicetype

## Overview

`DeviceType` is a Swift enumeration that represents the types of Meta Wearables devices supported by the Wearables Device Access Toolkit. Each device type corresponds to a specific Meta Wearables hardware variant with distinct capabilities and features.

## Swift API

### Enum Declaration

```swift
enum DeviceType: String, CaseIterable, Sendable
```

**Conforms to:**

- `String` — raw value is the device identifier string
- `CaseIterable` — all device types are enumerable
- `Sendable` — safe to pass across concurrency boundaries

### Enumeration Cases

| Case                 | Description                        |
| -------------------- | ---------------------------------- |
| `unknown`            | Unknown or invalid device type     |
| `rayBanMeta`         | Ray-Ban Meta smart glasses         |
| `oakleyMetaHSTN`     | Oakley Meta HSTN smart glasses     |
| `oakleyMetaVanguard` | Oakley Meta Vanguard smart glasses |
| `metaRayBanDisplay`  | Meta Ray-Ban Display smart glasses |

### Usage Example

```swift
import MWDATCore

// Check device type from a connected device
let device: Device = // ... obtained from Wearables
let deviceType = device.deviceType

switch deviceType {
case .rayBanMeta:
    print("Connected to Ray-Ban Meta")
case .oakleyMetaHSTN:
    print("Connected to Oakley Meta HSTN")
case .oakleyMetaVanguard:
    print("Connected to Oakley Meta Vanguard")
case .metaRayBanDisplay:
    print("Connected to Meta Ray-Ban Display")
case .unknown:
    print("Unknown device type")
}

// Enumerate all device types
for type in DeviceType.allCases {
    print("Supported device: \(type.rawValue)")
}
```

## TypeScript

Swift `DeviceType` enum maps to a TypeScript string literal union. Since this enum is `String`-based and `CaseIterable`, we expose both the type and a runtime array of all values.

```ts
/**
 * Represents the types of Meta Wearables devices supported by the SDK.
 * Each device type corresponds to a specific Meta Wearables hardware variant.
 */
export type DeviceType =
  | "unknown"
  | "rayBanMeta"
  | "oakleyMetaHSTN"
  | "oakleyMetaVanguard"
  | "metaRayBanDisplay";

/**
 * Array of all supported device types (for iteration/validation).
 */
export const ALL_DEVICE_TYPES: readonly DeviceType[] = [
  "unknown",
  "rayBanMeta",
  "oakleyMetaHSTN",
  "oakleyMetaVanguard",
  "metaRayBanDisplay",
] as const;
```
