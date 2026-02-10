# PhotoCaptureFormat Enum

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcamera_photocaptureformat

## Overview

Supported formats for capturing photos from Meta Wearables devices.

## Swift API

### Type

**Enum** conforming to `Sendable`

### Signature

```swift
enum PhotoCaptureFormat: Sendable
```

### Enumeration Cases

| Case   | Description                                                                            |
| ------ | -------------------------------------------------------------------------------------- |
| `heic` | High Efficiency Image Container format (HEIC) - provides better compression than JPEG. |
| `jpeg` | Joint Photographic Experts Group format (JPEG) - widely supported image format.        |

### Usage Example

```swift
import MWDATCamera

// Configure photo capture with HEIC format for better compression
let format: PhotoCaptureFormat = .heic

// Or use JPEG for wider compatibility
let compatibleFormat: PhotoCaptureFormat = .jpeg
```

## TypeScript

- Swift enum cases map to TypeScript string literal union
- Simple value enum (no associated values)
- Use as configuration option when setting up photo capture

```ts
/**
 * Supported formats for capturing photos from Meta Wearables devices.
 */
export type PhotoCaptureFormat = "heic" | "jpeg";

/**
 * High Efficiency Image Container format (HEIC) - provides better compression than JPEG.
 */
export const PhotoCaptureFormat_HEIC = "heic" as const;

/**
 * Joint Photographic Experts Group format (JPEG) - widely supported image format.
 */
export const PhotoCaptureFormat_JPEG = "jpeg" as const;
```
