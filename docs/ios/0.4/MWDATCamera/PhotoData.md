# PhotoData

**URL**: https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcamera_photodata

## Overview

A photo captured from a Meta Wearables device.

`PhotoData` is a simple value type that encapsulates the raw photo data along with its capture format. This struct conforms to `Sendable`, making it safe to pass across concurrency boundaries.

## Swift API

### Type

```swift
struct PhotoData: Sendable
```

### Initializer

```swift
public init(
    data: Data,
    format: PhotoCaptureFormat
)
```

Creates a new `PhotoData` instance with the provided photo data and format.

**Parameters:**

- `data`: The raw photo data bytes
- `format`: The [`PhotoCaptureFormat`](https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcamera_photocaptureformat) describing how the photo was captured

### Properties

| Property | Type                                                                                                                         | Description                             |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `data`   | `Data`                                                                                                                       | The photo data in the specified format. |
| `format` | [`PhotoCaptureFormat`](https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcamera_photocaptureformat) | The format of the captured photo data.  |

## Usage Example

```swift
import MWDATCamera

// Example: Handling a captured photo
func handleCapturedPhoto(_ photoData: PhotoData) {
    switch photoData.format {
    case .jpeg:
        // Save JPEG data to disk
        try? photoData.data.write(to: destinationURL)
    case .heif:
        // Process HEIF data
        processHEIF(photoData.data)
    }
}
```

## TypeScript

When mapping `PhotoData` to TypeScript for React Native:

- Swift `Data` → `Uint8Array` (raw byte buffer)
- Swift `PhotoCaptureFormat` enum → string literal union type
- All properties are required (not optional)
- Struct becomes a plain interface (no methods)

```ts
/**
 * A photo captured from a Meta Wearables device.
 */
export interface PhotoData {
  /**
   * The photo data in the specified format.
   */
  data: Uint8Array;

  /**
   * The format of the captured photo data.
   */
  format: PhotoCaptureFormat;
}

/**
 * The format in which a photo was captured.
 */
export type PhotoCaptureFormat = "jpeg" | "heif";
```
