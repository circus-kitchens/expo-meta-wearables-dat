## [0.0.4](https://github.com/circus-kitchens/expo-meta-wearables-dat/compare/v0.0.3...v0.0.4) (2026-02-12)

### Bug Fixes

- embed MWDATCamera and MWDATCore dynamic frameworks via build-phase shell script ([f1f0f6c](https://github.com/circus-kitchens/expo-meta-wearables-dat/commit/f1f0f6ce8cc958e22021838b24221552ac140727))

## [0.0.3](https://github.com/circus-kitchens/expo-meta-wearables-dat/compare/v0.0.2...v0.0.3) (2026-02-12)

### Bug Fixes

- update config plugin to correctly set iOS deployment target and Xcode build settings ([ea2cb96](https://github.com/circus-kitchens/expo-meta-wearables-dat/commit/ea2cb962ea5a254a51d8becf79a574bf5bb7a74d))

## [0.0.2](https://github.com/circus-kitchens/expo-meta-wearables-dat/compare/v0.0.1...v0.0.2) (2026-02-12)

### Bug Fixes

- include all required files in npm package ([0395fae](https://github.com/circus-kitchens/expo-meta-wearables-dat/commit/0395faea6dff84d334751cef6d382b0cd8660a54))

## [0.0.1](https://github.com/circus-kitchens/expo-meta-wearables-dat/compare/v0.0.0...v0.0.1) (2026-02-12)

### Bug Fixes

- configure semantic-release with @semantic-release/npm ([77d6adf](https://github.com/circus-kitchens/expo-meta-wearables-dat/commit/77d6adf86a1a1bd35b5b8336a6e4f202197b8b2d))
- skip npm lifecycle scripts during CI publish ([4772b15](https://github.com/circus-kitchens/expo-meta-wearables-dat/commit/4772b157a6298144e52b47c115c17ac676d4a89b))

## 0.0.0 (2026-02-12)

Initial release — full Expo native module for Meta Wearables DAT iOS SDK 0.4.

### Features

- **iOS native module** — Swift implementation wrapping Meta Wearables DAT SDK 0.4 (MWDATCore + MWDATCamera)
- **`useMetaWearables` hook** — complete state management for registration, permissions, streaming, and photo capture
- **`EMWDATStreamView`** — native view component for rendering live camera frames from Meta glasses
- **Config plugin** — auto-configures Info.plist (URL scheme, Bluetooth, external accessory), Xcode project settings, and Podfile for SPM integration
- **Device management** — list registered devices, monitor link state, compatibility, and session state
- **Camera streaming** — start/stop video streams with configurable resolution and codec
- **Photo capture** — capture photos in JPEG or HEIC format during an active stream
- **Permission handling** — check and request camera permission through the SDK
- **Deep-link registration flow** — URL callback handling via AppDelegate subscriber
- **Event system** — 10 native events (registration state, devices, link, compatibility, stream state, stream errors, decoder errors, frames, photos, session state)
- **Typed API** — full TypeScript types with discriminated union error types
- **Android stubs** — all methods throw "platform not supported" for consistent cross-platform API
- **Web stubs** — all methods throw "not supported" for safe web bundling
- **Example app** — full-featured demo with device listing, stream preview, photo capture, and event logging
