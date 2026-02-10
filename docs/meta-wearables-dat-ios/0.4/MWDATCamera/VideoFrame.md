# VideoFrame Struct

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcamera_videoframe

**Extends:** Sendable

## Overview

Represents a single frame of video data from a Meta Wearables device. Contains the raw video sample buffer and provides utilities for converting to UIImage.

## Swift API

### Type

```swift
struct VideoFrame: Sendable
```

### Properties

#### `sampleBuffer` [Get]

Provides access to the underlying video sample buffer.

```swift
public var sampleBuffer: CMSampleBuffer { get }
```

**Important**: While this property exposes the raw `CoreMedia/CMSampleBuffer` for advanced use cases, callers must treat it as read-only. Mutating the sample buffer's attachments, timing information, or underlying pixel buffer may lead to undefined behavior, crashes, or data corruption since the buffer is shared across multiple contexts without synchronization.

For safe image conversion, use `makeUIImage()` instead.

### Functions

#### `makeUIImage()`

Converts the video frame to a UIImage for display or processing. This method handles the conversion from the underlying CoreMedia sample buffer to a UIImage.

```swift
public func makeUIImage() -> sending UIImage?
```

**Returns:** `sending UIImage?` - A UIImage representation of the video frame, or nil if conversion fails.

## Usage Example

```swift
import MWDATCamera

// Assuming you have a StreamSession that emits VideoFrame objects
session.$videoFrame.sink { frame in
    guard let frame = frame else { return }

    // Convert to UIImage for display
    if let image = frame.makeUIImage() {
        // Display or process the image
        imageView.image = image
    }

    // Advanced: access raw sample buffer (read-only)
    let sampleBuffer = frame.sampleBuffer
    // Perform read-only operations on sampleBuffer
}
```

## TypeScript

- Swift `CMSampleBuffer` maps to an opaque native reference in TS (exposed as `number` or object handle)
- `makeUIImage()` returns optional UIImage → TS returns `Promise<string | null>` where string is base64-encoded image or file URI
- `sampleBuffer` property is read-only; avoid exposing directly in TS unless absolutely necessary
- Consider providing only `makeUIImage()` in the TS API for safety and simplicity

````ts
/**
 * Represents a single frame of video data from a Meta Wearables device.
 * Contains the raw video sample buffer and provides utilities for image conversion.
 */
export interface VideoFrame {
  /**
   * Provides access to the underlying video sample buffer.
   *
   * **Important**: This is a read-only native reference. Do not attempt to mutate.
   * For safe image conversion, use `makeUIImage()` instead.
   *
   * @platform iOS
   */
  readonly sampleBuffer: number; // Opaque CMSampleBuffer reference

  /**
   * Converts the video frame to an image for display or processing.
   *
   * @returns Promise resolving to base64-encoded image data URI, or null if conversion fails
   * @example
   * ```ts
   * const imageUri = await videoFrame.makeUIImage();
   * if (imageUri) {
   *   // Display in Image component
   *   setImageSource({ uri: imageUri });
   * }
   * ```
   */
  makeUIImage(): Promise<string | null>;
}
````
