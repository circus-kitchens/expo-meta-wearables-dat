# DecoderError Enum

**URL:** https://wearables.developer.meta.com/docs/reference/ios_swift/dat/0.4/mwdatcamera_decodererror

**Module:** MWDATCamera

**Extends:** `Error`

## Overview

Errors that can occur during media decoding operations in the MWDATCamera module.

## Signature

```swift
enum DecoderError: Error
```

## Enumeration Constants

| Case                           | Description                                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `unexpected`                   | Internal unexpected error.                                                                                                 |
| `cancelled`                    | Operation was cancelled.                                                                                                   |
| `invalidFormat`                | Sample buffer has an invalid format description.                                                                           |
| `configurationError(OSStatus)` | Error creating decompression session. Contains an associated `OSStatus` value indicating the specific configuration error. |
| `decodingFailed(OSStatus)`     | Couldn't decode a frame. Contains an associated `OSStatus` value indicating the specific decoding failure.                 |

## Usage Notes

- Two cases (`configurationError` and `decodingFailed`) include associated `OSStatus` values, which are Apple's Core Foundation status codes that provide detailed error information.
- The `cancelled` case indicates graceful cancellation rather than a failure condition.
- The `invalidFormat` case typically occurs when attempting to decode a sample buffer with corrupted or unsupported format metadata.

## Swift Usage Example

```swift
import MWDATCamera

func handleDecodingError(_ error: DecoderError) {
    switch error {
    case .unexpected:
        print("Unexpected internal error occurred")
    case .cancelled:
        print("Decoding operation was cancelled")
    case .invalidFormat:
        print("Invalid sample buffer format")
    case .configurationError(let status):
        print("Configuration error with status: \(status)")
    case .decodingFailed(let status):
        print("Decoding failed with status: \(status)")
    }
}
```

## TypeScript

### Conversion Notes

- Swift enum with associated values maps to a discriminated union in TypeScript
- `OSStatus` (a signed 32-bit integer) maps to `number`
- Each case becomes an object type with a `type` discriminator field
- Associated values become additional properties on the error object

### TypeScript Definition

```ts
/**
 * Errors that can occur during media decoding operations.
 */
export type DecoderError =
  | { type: "unexpected" }
  | { type: "cancelled" }
  | { type: "invalidFormat" }
  | { type: "configurationError"; status: number }
  | { type: "decodingFailed"; status: number };

/**
 * Type guard to check if an error is a DecoderError
 */
export function isDecoderError(error: unknown): error is DecoderError {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    typeof (error as any).type === "string" &&
    ["unexpected", "cancelled", "invalidFormat", "configurationError", "decodingFailed"].includes(
      (error as any).type
    )
  );
}

/**
 * Helper to create a human-readable error message from a DecoderError
 */
export function formatDecoderError(error: DecoderError): string {
  switch (error.type) {
    case "unexpected":
      return "Unexpected internal error occurred";
    case "cancelled":
      return "Decoding operation was cancelled";
    case "invalidFormat":
      return "Invalid sample buffer format";
    case "configurationError":
      return `Configuration error with status: ${error.status}`;
    case "decodingFailed":
      return `Decoding failed with status: ${error.status}`;
  }
}
```
