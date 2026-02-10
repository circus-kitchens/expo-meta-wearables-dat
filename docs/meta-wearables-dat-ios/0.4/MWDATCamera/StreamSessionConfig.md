# StreamSessionConfig Struct

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcamera_streamsessionconfig

## Overview

Configuration for a media streaming session with a Meta Wearables device. Defines video codec, resolution, frame delivery strategy, and target frame rate.

The `StreamSessionConfig` struct is a value type used to configure camera streaming sessions. It provides both a parameterized initializer for custom configurations and a default initializer with sensible defaults.

## Type

**Struct** (value type)

## Signature

```swift
struct StreamSessionConfig
```

## Initializers

### init(videoCodec:resolution:frameRate:)

Creates a new stream session configuration with specified parameters.

```swift
public init(
    videoCodec: VideoCodec,
    resolution: StreamingResolution,
    frameRate: UInt
)
```

**Parameters:**

- `videoCodec`: [`VideoCodec`](https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcamera_videocodec) - The video codec to use for streaming
- `resolution`: [`StreamingResolution`](https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcamera_streamingresolution) - The resolution for video streaming
- `frameRate`: `UInt` - The target frame rate for streaming

### init()

Creates a new stream session configuration with default settings.

```swift
public init()
```

**Default values:**

- Video codec: `raw`
- Resolution: `medium`
- Frame delivery strategy: deliver-all
- Frame rate: 30 FPS

## Properties

### videoCodec

The video codec to use for streaming.

**Type:** [`VideoCodec`](https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcamera_videocodec)

### resolution

The resolution at which to stream video content.

**Type:** [`StreamingResolution`](https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcamera_streamingresolution)

### frameRate

The target frame rate for the streaming session.

**Type:** `UInt`

## Swift Usage Example

```swift
import MWDATCamera

// Use default configuration (raw codec, medium resolution, 30 FPS)
let defaultConfig = StreamSessionConfig()

// Create custom configuration
let customConfig = StreamSessionConfig(
    videoCodec: .raw,
    resolution: .high,
    frameRate: 60
)

// Use configuration to start a stream session
let session = StreamSession(
    device: myDevice,
    selector: mySelector,
    config: customConfig
)
```

## TypeScript

### Conversion Notes

- Swift `UInt` → TypeScript `number`
- Swift `VideoCodec` and `StreamingResolution` enums → TypeScript string literal unions (see respective type definitions)
- Struct with public properties → TypeScript interface
- Default initializer pattern → factory function or default values in interface

### TypeScript Definition

```ts
/**
 * Configuration for a media streaming session with a Meta Wearables device.
 * Defines video codec, resolution, frame delivery strategy, and target frame rate.
 */
export interface StreamSessionConfig {
  /**
   * The video codec to use for streaming.
   */
  videoCodec: VideoCodec;

  /**
   * The resolution at which to stream video content.
   */
  resolution: StreamingResolution;

  /**
   * The target frame rate for the streaming session.
   */
  frameRate: number;
}

/**
 * Creates a StreamSessionConfig with default values.
 * Default: raw codec, medium resolution, 30 FPS
 */
export function createDefaultStreamSessionConfig(): StreamSessionConfig {
  return {
    videoCodec: "raw",
    resolution: "medium",
    frameRate: 30,
  };
}

/**
 * Video codec options for streaming.
 * Note: Currently only 'raw' codec is supported.
 */
export type VideoCodec = "raw";

/**
 * Resolution options for video streaming.
 */
export type StreamingResolution = "low" | "medium" | "high";
```
