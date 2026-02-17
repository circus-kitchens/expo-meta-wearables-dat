## [0.0.8](https://github.com/circus-kitchens/expo-meta-wearables-dat/compare/v0.0.7...v0.0.8) (2026-02-17)

### Bug Fixes

- mock device support ([#3](https://github.com/circus-kitchens/expo-meta-wearables-dat/issues/3)) ([fb4ba58](https://github.com/circus-kitchens/expo-meta-wearables-dat/commit/fb4ba58847fab04983ccf02702801fd10a1d1f50))

## [0.0.7](https://github.com/circus-kitchens/expo-meta-wearables-dat/compare/v0.0.6...v0.0.7) (2026-02-13)

### Bug Fixes

- trigger release ([b6abcdb](https://github.com/circus-kitchens/expo-meta-wearables-dat/commit/b6abcdb900428defd88d883697348b9cccae277b))

## [0.0.6](https://github.com/circus-kitchens/expo-meta-wearables-dat/compare/v0.0.5...v0.0.6) (2026-02-13)

### Bug Fixes

- trigger release ([a369dda](https://github.com/circus-kitchens/expo-meta-wearables-dat/commit/a369ddab106e8259ce736aad0872885e038ca42c))

## [0.0.5](https://github.com/circus-kitchens/expo-meta-wearables-dat/compare/v0.0.4...v0.0.5) (2026-02-13)

### Bug Fixes

- add missing clientToken to EMWDATPluginProps type ([00ce0b1](https://github.com/circus-kitchens/expo-meta-wearables-dat/commit/00ce0b1d4e9a55eb6972988631b323e507c8da13))
- expose config error state, unify platform stubs, add CI badge ([70c0f9a](https://github.com/circus-kitchens/expo-meta-wearables-dat/commit/70c0f9ac412678f5740f0f4a43e682b11ed453b7))
- set minimum peerDependency versions for expo, react, and react-native ([c425d84](https://github.com/circus-kitchens/expo-meta-wearables-dat/commit/c425d8454d0fc91059e0364bb52cbbecc3eba4cf))
- use canonical git+https repository URL format ([5de7777](https://github.com/circus-kitchens/expo-meta-wearables-dat/commit/5de7777c5f85364b112217bb9abdbe3618eca951))

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
