# VideoFrameSize Struct

**URL**: https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcamera_videoframesize

## Overview

`VideoFrameSize` is a simple value type that represents the width and height of a video frame in pixels. This struct is part of the MWDATCamera module and is used to specify or describe video frame dimensions.

## Swift API

### Type

```swift
struct VideoFrameSize
```

### Initializer

```swift
public init(width: UInt, height: UInt)
```

Creates a new video frame size with the specified dimensions.

**Parameters**:

- `width: UInt` — The width of the video frame in pixels.
- `height: UInt` — The height of the video frame in pixels.

### Properties

| Property | Description                              |
| -------- | ---------------------------------------- |
| `width`  | The width of the video frame in pixels.  |
| `height` | The height of the video frame in pixels. |

### Usage Example

```swift
// Create a frame size for a 1920x1080 video
let frameSize = VideoFrameSize(width: 1920, height: 1080)

print("Video frame dimensions: \(frameSize.width)x\(frameSize.height)")
```

## TypeScript

**Mapping notes**:

- Swift `UInt` → TypeScript `number`
- This is a simple data structure; constructor becomes a plain object literal or factory function
- All fields are non-optional in Swift, so they're required in TypeScript

```ts
/**
 * Represents the width and height of a video frame in pixels.
 */
export interface VideoFrameSize {
  /** The width of the video frame in pixels. */
  width: number;

  /** The height of the video frame in pixels. */
  height: number;
}
```
