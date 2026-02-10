# MockCameraKit Protocol

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatmockdevice_mockcamerakit

## Overview

A suite for mocking camera functionality. This protocol provides methods to configure mock camera feeds and captured images for testing purposes.

## Swift API

### Type

**Protocol:** `MockCameraKit`

### Signature

```swift
protocol MockCameraKit
```

### Functions

#### setCameraFeed(fileURL:)

Sets the camera feed from a video file.

**Supported codecs:** h.265

```swift
public func setCameraFeed(fileURL: URL)
```

**Parameters:**

- `fileURL: URL` – URL of the file containing the video stream.

#### setCapturedImage(fileURL:)

Sets the captured image from an image file.

```swift
public func setCapturedImage(fileURL: URL)
```

**Parameters:**

- `fileURL: URL` – URL of the file containing the image.

## Usage Example

```swift
import MWDATMockDevice

// Assuming you have a type conforming to MockCameraKit
let mockCamera: MockCameraKit = // ... obtain mock camera instance

// Set a mock video feed
let videoURL = Bundle.main.url(forResource: "sample_video", withExtension: "hevc")!
mockCamera.setCameraFeed(fileURL: videoURL)

// Set a mock captured image
let imageURL = Bundle.main.url(forResource: "sample_photo", withExtension: "jpg")!
mockCamera.setCapturedImage(fileURL: imageURL)
```

## TypeScript

**Mapping notes:**

- Swift `URL` → TypeScript `string` (file path or URI)
- Methods are synchronous in Swift; keep them synchronous in TS or wrap in Promise if needed for React Native bridge
- Protocol → TypeScript `interface`

```ts
/**
 * A suite for mocking camera functionality.
 * Provides methods to configure mock camera feeds and captured images for testing purposes.
 */
export interface MockCameraKit {
  /**
   * Sets the camera feed from a video file.
   * Supported codecs: h.265
   *
   * @param fileURL - URL of the file containing the video stream.
   */
  setCameraFeed(fileURL: string): void;

  /**
   * Sets the captured image from an image file.
   *
   * @param fileURL - URL of the file containing the image.
   */
  setCapturedImage(fileURL: string): void;
}
```
