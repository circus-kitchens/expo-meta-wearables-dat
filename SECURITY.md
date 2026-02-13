# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **GitHub Issues**: Open an issue at [github.com/circus-kitchens/expo-meta-wearables-dat/issues](https://github.com/circus-kitchens/expo-meta-wearables-dat/issues) with the label `security`.
2. **Email**: Contact [fabricio_ext@circuskitchens.com](mailto:fabricio_ext@circuskitchens.com) directly for sensitive reports.

We will acknowledge reports within 48 hours and aim to release patches promptly.

## Data Handling

This library acts as a bridge between your React Native app and the Meta Wearables DAT iOS SDK. Important notes:

- **No PII storage**: The library does not store, persist, or log personally identifiable information.
- **No network calls**: The library makes no network requests beyond what the Meta Wearables DAT SDK itself performs.
- **Debug logging**: Disabled by default (`logLevel: "info"`). Set to `"debug"` only during development. Logs are local to the device console and are never transmitted.
- **Photo capture**: Photos are saved to a local file path. The library does not upload, share, or transmit captured photos.
- **Video streaming**: Video frames are rendered on-device via the native view. Frame data is not transmitted or stored by the library.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.x     | Yes       |
