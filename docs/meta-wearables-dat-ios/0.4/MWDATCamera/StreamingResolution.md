# StreamingResolution Enum

**URL**: https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcamera_streamingresolution

**Module**: MWDATCamera

## Overview

Valid Live Streaming resolutions for camera streaming. The SDK uses a 9:16 aspect ratio for all resolutions.

## Swift API

### Type

```swift
enum StreamingResolution: CaseIterable
```

**Conforms to**: `CaseIterable`

### Enumeration Cases

| Case     | Resolution | Description                                   |
| -------- | ---------- | --------------------------------------------- |
| `high`   | 720×1280   | High resolution streaming at 720x1280 pixels  |
| `medium` | 504×896    | Medium resolution streaming at 504x896 pixels |
| `low`    | 360×640    | Low resolution streaming at 360x640 pixels    |

### Properties

#### `videoFrameSize`

```swift
var videoFrameSize: VideoFrameSize { get }
```

The video frame dimensions for this resolution. Returns a `VideoFrameSize` struct containing width and height values.

## Usage Example

```swift
import MWDATCamera

// Configure stream session with high resolution
let config = StreamSessionConfig(
    resolution: .high,
    codec: .h264
)

// Iterate through all available resolutions
for resolution in StreamingResolution.allCases {
    let frameSize = resolution.videoFrameSize
    print("Resolution: \(resolution), Size: \(frameSize)")
}
```

## TypeScript

### Conversion Notes

- Swift enum cases map to TypeScript string literal union
- The `CaseIterable` conformance allows iterating all cases; in TS we export an array constant
- The `videoFrameSize` computed property returns a `VideoFrameSize` struct (documented separately)
- All resolutions use 9:16 aspect ratio (portrait orientation)

```ts
/**
 * Valid live streaming resolutions for camera streaming.
 * All resolutions use a 9:16 aspect ratio (portrait).
 */
export type StreamingResolution = "high" | "medium" | "low";

/**
 * All available streaming resolution values.
 */
export const StreamingResolutionValues: readonly StreamingResolution[] = [
  "high",
  "medium",
  "low",
] as const;

/**
 * Resolution dimensions for each streaming quality level.
 */
export interface StreamingResolutionDimensions {
  high: { width: 720; height: 1280 };
  medium: { width: 504; height: 896 };
  low: { width: 360; height: 640 };
}

/**
 * Get the video frame dimensions for a given resolution.
 * Maps to Swift's `videoFrameSize` computed property.
 */
export function getVideoFrameSize(resolution: StreamingResolution): {
  width: number;
  height: number;
} {
  const dimensions: StreamingResolutionDimensions = {
    high: { width: 720, height: 1280 },
    medium: { width: 504, height: 896 },
    low: { width: 360, height: 640 },
  };
  return dimensions[resolution];
}
```
