# VideoCodec

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcamera_videocodec

## Overview

Specifies the video codec to use for streaming.

## Swift API

### Type

`enum VideoCodec`

### Enumeration Constants

| Member | Description                    |
| ------ | ------------------------------ |
| `raw`  | Raw decompressed video frames. |

### Notes

- This enum currently defines only one codec option: raw decompressed video frames
- The enum is part of the MWDATCamera module
- Used in conjunction with `StreamSessionConfig` to configure video streaming behavior

### Usage Example

```swift
import MWDATCamera

// Configure stream session with raw video codec
let config = StreamSessionConfig(
    // ... other config properties
    videoCodec: .raw
)
```

## TypeScript

Conversion notes:

- Swift enum with simple cases maps to TS string literal union
- Single case enum still represented as union type for consistency and future extensibility
- Naming follows Swift case conventions (lowercase)

```ts
/**
 * Specifies the video codec to use for streaming.
 */
export type VideoCodec = "raw";

/**
 * Raw decompressed video frames.
 */
export const VideoCodec = {
  RAW: "raw" as const,
} as const;
```
