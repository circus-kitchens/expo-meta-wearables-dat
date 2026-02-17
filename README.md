# expo-meta-wearables-dat

[![npm version](https://img.shields.io/npm/v/expo-meta-wearables-dat)](https://www.npmjs.com/package/expo-meta-wearables-dat)
[![CI](https://github.com/circus-kitchens/expo-meta-wearables-dat/actions/workflows/ci.yml/badge.svg)](https://github.com/circus-kitchens/expo-meta-wearables-dat/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/expo-meta-wearables-dat)](./LICENSE)
![platform: iOS](https://img.shields.io/badge/platform-iOS-blue)

Expo native module for integrating **Meta Wearables DAT** (Ray-Ban Meta smart glasses) into React Native apps. Provides device registration, permissions, camera streaming, photo capture, and a React hook — all bridged from the official Meta Wearables DAT iOS SDK.

> **Official SDK docs:** [Meta Wearables DAT — Developer Documentation](https://wearables.developer.meta.com/docs/develop)
>
> You must register your app in the [Meta Wearables Developer Center](https://wearables.developer.meta.com/) to obtain your App ID and Client Token.

> **Disclaimer:** This project is **not affiliated with, endorsed by, or sponsored by Meta Platforms, Inc.** It is an independent, community-maintained wrapper around the publicly available Meta Wearables DAT iOS SDK.

## Non-goals

- **Android** — not supported yet (stubs throw clear errors)
- **Background streaming** — the SDK doesn't support it
- **Expo Go** — requires a [development build](https://docs.expo.dev/develop/development-builds/introduction/) (native code)

## Features

- Device registration / unregistration via Meta AI app
- Permission management (camera)
- Device discovery and link state monitoring
- Live camera video streaming with native view
- Photo capture (JPEG / HEIC)
- `useMetaWearables` React hook with full state management
- Mock device simulation for testing (debug builds)
- Expo config plugin (auto-configures Info.plist, URL schemes, deployment target)

## Compatibility

| Requirement      | Version  |
| ---------------- | -------- |
| React Native     | 0.76+    |
| Expo SDK         | 52+      |
| iOS              | 16.0+    |
| Xcode            | 16+      |
| Swift            | 5.9+     |
| New Architecture | Untested |

## Supported Devices

- Ray-Ban Meta (verified)
- Meta Ray-Ban Display (untested)
- Oakley Meta HSTN / Vanguard (untested)

## Installation

```bash
npx expo install expo-meta-wearables-dat
```

Or manually:

```bash
# pnpm
pnpm add expo-meta-wearables-dat

# yarn
yarn add expo-meta-wearables-dat

# npm
npm install expo-meta-wearables-dat
```

## iOS Setup

### 1. Config plugin

Add the plugin to your `app.json` / `app.config.js`:

```json
{
  "plugins": [
    [
      "expo-meta-wearables-dat",
      {
        "urlScheme": "myapp",
        "metaAppId": "YOUR_META_APP_ID",
        "clientToken": "YOUR_CLIENT_TOKEN",
        "bluetoothUsageDescription": "This app uses Bluetooth to connect to Meta Wearables."
      }
    ]
  ]
}
```

| Prop                        | Required | Description                                                                                                   |
| --------------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `urlScheme`                 | Yes      | URL scheme for Meta AI app callback (e.g. `"myapp"`)                                                          |
| `metaAppId`                 | No       | Meta App ID from [Wearables Developer Center](https://wearables.developer.meta.com/). Omit for Developer Mode |
| `clientToken`               | No       | Client Token from Wearables Developer Center                                                                  |
| `bluetoothUsageDescription` | No       | Custom Bluetooth usage description                                                                            |

The plugin automatically sets:

- `CFBundleURLTypes` (URL scheme)
- `LSApplicationQueriesSchemes` (`fb-viewapp`)
- `UISupportedExternalAccessoryProtocols` (`com.meta.ar.wearable`)
- `UIBackgroundModes` (`bluetooth-peripheral`, `external-accessory`)
- `NSBluetoothAlwaysUsageDescription`
- `MWDAT` configuration dictionary
- iOS deployment target to 16.0
- Embeds MWDATCamera & MWDATCore dynamic frameworks

### 2. Prebuild

After adding the plugin, generate the native project:

```bash
npx expo prebuild
```

### 3. Prerequisites

- The user must have the **Meta AI** app installed and paired with their glasses
- A physical iOS device is required (no simulator support)

## Quick Start

```tsx
import { View, Button, Text } from "react-native";
import { useMetaWearables, EMWDATStreamView } from "expo-meta-wearables-dat";

export default function App() {
  const {
    isConfigured,
    registrationState,
    devices,
    streamState,
    startRegistration,
    startStream,
    stopStream,
    capturePhoto,
  } = useMetaWearables({
    onPhotoCaptured: (photo) => console.log("Photo saved:", photo.filePath),
  });

  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 60, gap: 10 }}>
      <Text>Configured: {String(isConfigured)}</Text>
      <Text>Registration: {registrationState}</Text>
      <Text>Devices: {devices.length}</Text>
      <Text>Stream: {streamState}</Text>

      <Button title="Register" onPress={() => startRegistration()} />
      <Button title="Start Stream" onPress={() => startStream()} />
      <Button title="Stop Stream" onPress={() => stopStream()} />
      <Button title="Capture Photo" onPress={() => capturePhoto("jpeg")} />

      {streamState === "streaming" && (
        <EMWDATStreamView isActive resizeMode="contain" style={{ flex: 1 }} />
      )}
    </View>
  );
}
```

## API Reference

### `useMetaWearables(options?)`

React hook that manages the full lifecycle of Meta Wearables integration.

**Options** (`UseMetaWearablesOptions`):

| Option                       | Type                                | Default  | Description                      |
| ---------------------------- | ----------------------------------- | -------- | -------------------------------- |
| `autoConfig`                 | `boolean`                           | `true`   | Auto-call `configure()` on mount |
| `logLevel`                   | `LogLevel`                          | `"info"` | Initial log level                |
| `onRegistrationStateChange`  | `(state) => void`                   | —        | Registration state changed       |
| `onDevicesChange`            | `(devices) => void`                 | —        | Device list updated              |
| `onLinkStateChange`          | `(deviceId, linkState) => void`     | —        | Device connection changed        |
| `onStreamStateChange`        | `(state) => void`                   | —        | Stream state changed             |
| `onVideoFrame`               | `(metadata) => void`                | —        | Video frame received             |
| `onPhotoCaptured`            | `(photo) => void`                   | —        | Photo captured                   |
| `onStreamError`              | `(error) => void`                   | —        | Stream error occurred            |
| `onPermissionStatusChange`   | `(permission, status) => void`      | —        | Permission status changed        |
| `onCompatibilityChange`      | `(deviceId, compatibility) => void` | —        | Device compatibility changed     |
| `onDeviceSessionStateChange` | `(deviceId, sessionState) => void`  | —        | Device session state changed     |

**Returned state:**

| Field                 | Type                           | Description                                                                                        |
| --------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `isConfigured`        | `boolean`                      | SDK configured                                                                                     |
| `isConfiguring`       | `boolean`                      | `true` while `configure()` is in progress                                                          |
| `configError`         | `Error \| null`                | Error from the last `configure()` call, or `null` if successful                                    |
| `registrationState`   | `RegistrationState`            | `"unavailable"` \| `"available"` \| `"registering"` \| `"registered"`                              |
| `permissionStatus`    | `PermissionStatus`             | `"granted"` \| `"denied"`                                                                          |
| `devices`             | `Device[]`                     | Connected devices                                                                                  |
| `streamState`         | `StreamSessionState`           | `"stopped"` \| `"waitingForDevice"` \| `"starting"` \| `"streaming"` \| `"paused"` \| `"stopping"` |
| `lastError`           | `StreamSessionError \| null`   | Last stream error                                                                                  |
| `deviceSessionStates` | `Record<string, SessionState>` | Per-device session states                                                                          |

**Returned actions:**

| Action                  | Signature                                   | Description                                                   |
| ----------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| `configure`             | `() => Promise<void>`                       | Initialize SDK (called automatically if `autoConfig` is true) |
| `setLogLevel`           | `(level: LogLevel) => void`                 | Change log level                                              |
| `startRegistration`     | `() => Promise<void>`                       | Open Meta AI app for registration                             |
| `startUnregistration`   | `() => Promise<void>`                       | Unregister from Meta AI                                       |
| `checkPermissionStatus` | `(permission) => Promise<PermissionStatus>` | Check permission                                              |
| `requestPermission`     | `(permission) => Promise<PermissionStatus>` | Request permission                                            |
| `getDevice`             | `(id) => Promise<Device \| null>`           | Get device by identifier                                      |
| `refreshDevices`        | `() => Promise<Device[]>`                   | Refresh device list                                           |
| `startStream`           | `(config?) => Promise<void>`                | Start camera stream                                           |
| `stopStream`            | `() => Promise<void>`                       | Stop camera stream                                            |
| `capturePhoto`          | `(format?) => Promise<void>`                | Capture photo (`"jpeg"` \| `"heic"`)                          |

### Module Functions

These can be imported directly for lower-level control:

```ts
import {
  EMWDATModule,
  configure,
  setLogLevel,
  startRegistration,
  startUnregistration,
  handleUrl,
  checkPermissionStatus,
  requestPermission,
  getDevices,
  getDevice,
  getRegistrationState,
  getRegistrationStateAsync,
  getStreamState,
  startStream,
  stopStream,
  capturePhoto,
  addListener,
} from "expo-meta-wearables-dat";
```

| Function                    | Signature                                                  |
| --------------------------- | ---------------------------------------------------------- |
| `EMWDATModule`              | Raw native module instance (for advanced use)              |
| `configure`                 | `() => Promise<void>`                                      |
| `setLogLevel`               | `(level: LogLevel) => void`                                |
| `getRegistrationState`      | `() => RegistrationState` (sync)                           |
| `getRegistrationStateAsync` | `() => Promise<RegistrationState>`                         |
| `startRegistration`         | `() => Promise<void>`                                      |
| `startUnregistration`       | `() => Promise<void>`                                      |
| `handleUrl`                 | `(url: string) => Promise<boolean>`                        |
| `checkPermissionStatus`     | `(permission: Permission) => Promise<PermissionStatus>`    |
| `requestPermission`         | `(permission: Permission) => Promise<PermissionStatus>`    |
| `getDevices`                | `() => Promise<Device[]>`                                  |
| `getDevice`                 | `(identifier: string) => Promise<Device \| null>`          |
| `getStreamState`            | `() => Promise<StreamSessionState>`                        |
| `startStream`               | `(config?: Partial<StreamSessionConfig>) => Promise<void>` |
| `stopStream`                | `() => Promise<void>`                                      |
| `capturePhoto`              | `(format?: PhotoCaptureFormat) => Promise<void>`           |
| `addListener`               | `(event, listener) => { remove() } \| null`                |

### Events

Subscribe via `addListener` or hook callbacks:

| Event                        | Payload                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| `onRegistrationStateChange`  | `{ state: RegistrationState }`                              |
| `onDevicesChange`            | `{ devices: Device[] }`                                     |
| `onLinkStateChange`          | `{ deviceId: string, linkState: LinkState }`                |
| `onStreamStateChange`        | `{ state: StreamSessionState }`                             |
| `onVideoFrame`               | `{ timestamp, width, height }`                              |
| `onPhotoCaptured`            | `{ filePath, format, timestamp, width?, height?, base64? }` |
| `onStreamError`              | `StreamSessionError` (discriminated union)                  |
| `onPermissionStatusChange`   | `{ permission: Permission, status: PermissionStatus }`      |
| `onCompatibilityChange`      | `{ deviceId: string, compatibility: Compatibility }`        |
| `onDeviceSessionStateChange` | `{ deviceId: string, sessionState: SessionState }`          |

### `EMWDATStreamView`

Native view component for rendering the camera stream.

| Prop         | Type                                    | Default     | Description                 |
| ------------ | --------------------------------------- | ----------- | --------------------------- |
| `isActive`   | `boolean`                               | `false`     | Whether to render frames    |
| `resizeMode` | `"contain"` \| `"cover"` \| `"stretch"` | `"contain"` | How frames fit the view     |
| `style`      | `ViewStyle`                             | —           | Standard React Native style |

### Types

Key types exported from the package:

- `LogLevel` — `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"none"`
- `RegistrationState` — `"unavailable"` \| `"available"` \| `"registering"` \| `"registered"`
- `Permission` — `"camera"`
- `PermissionStatus` — `"granted"` \| `"denied"`
- `Device` — `{ identifier, name, linkState, deviceType, compatibility }`
- `StreamSessionConfig` — `{ videoCodec, resolution, frameRate, deviceId? }`
- `StreamSessionState` — `"stopped"` \| `"waitingForDevice"` \| `"starting"` \| `"streaming"` \| `"paused"` \| `"stopping"`
- `StreamSessionError` — Discriminated union: `internalError` \| `deviceNotFound` \| `deviceNotConnected` \| `timeout` \| `videoStreamingError` \| `audioStreamingError` \| `permissionDenied` \| `hingesClosed`
- `PhotoData` — `{ filePath, format, timestamp, width?, height?, base64? }`
- `PhotoCaptureFormat` — `"jpeg"` \| `"heic"`
- `LinkState` — `"connected"` \| `"disconnected"` \| `"connecting"`
- `Compatibility` — `"compatible"` \| `"undefined"` \| `"deviceUpdateRequired"` \| `"sdkUpdateRequired"`
- `DeviceType` — `"rayBanMeta"` \| `"oakleyMetaHSTN"` \| `"oakleyMetaVanguard"` \| `"metaRayBanDisplay"` \| `"unknown"`
- `SessionState` — `"stopped"` \| `"waitingForDevice"` \| `"running"` \| `"paused"` \| `"unknown"`
- `StreamingResolution` — `"high"` \| `"medium"` \| `"low"`
- `VideoCodec` — `"raw"`
- `VideoFrameMetadata` — `{ timestamp, width, height }`
- `StreamViewResizeMode` — `"contain"` \| `"cover"` \| `"stretch"`
- `EMWDATPluginProps` — Config plugin options
- Error code types: `WearablesErrorCode`, `RegistrationErrorCode`, `UnregistrationErrorCode`, `PermissionErrorCode`, `DecoderError`

See [`src/EMWDAT.types.ts`](./src/EMWDAT.types.ts) for the full list.

### Mock Device API (Testing)

Functions for simulating Meta Wearables devices during development using the SDK's `MWDATMockDevice` framework. Only available in debug builds on iOS.

```ts
import {
  createMockDevice,
  removeMockDevice,
  getMockDevices,
  mockDevicePowerOn,
  mockDevicePowerOff,
  mockDeviceDon,
  mockDeviceDoff,
  mockDeviceFold,
  mockDeviceUnfold,
  mockDeviceSetCameraFeed,
  mockDeviceSetCapturedImage,
} from "expo-meta-wearables-dat";
```

| Function                     | Signature                                        | Description                            |
| ---------------------------- | ------------------------------------------------ | -------------------------------------- |
| `createMockDevice`           | `() => Promise<string>`                          | Create a mock Ray-Ban Meta, returns ID |
| `removeMockDevice`           | `(id: string) => Promise<void>`                  | Remove a mock device                   |
| `getMockDevices`             | `() => Promise<string[]>`                        | List active mock device IDs            |
| `mockDevicePowerOn`          | `(id: string) => Promise<void>`                  | Power on                               |
| `mockDevicePowerOff`         | `(id: string) => Promise<void>`                  | Power off                              |
| `mockDeviceDon`              | `(id: string) => Promise<void>`                  | Simulate putting glasses on            |
| `mockDeviceDoff`             | `(id: string) => Promise<void>`                  | Simulate taking glasses off            |
| `mockDeviceFold`             | `(id: string) => Promise<void>`                  | Fold hinges                            |
| `mockDeviceUnfold`           | `(id: string) => Promise<void>`                  | Unfold hinges                          |
| `mockDeviceSetCameraFeed`    | `(id: string, fileUrl: string) => Promise<void>` | Set camera feed video from local file  |
| `mockDeviceSetCapturedImage` | `(id: string, fileUrl: string) => Promise<void>` | Set captured image from local file     |

## Example App

The `example/` directory contains a full demo app:

1. Copy the example credentials and fill in your values:

   ```bash
   cd example
   ```

   Edit `app.json` and replace the placeholders:
   - `YOUR_APPLE_TEAM_ID` — your Apple Developer Team ID
   - `YOUR_META_APP_ID` — from the [Meta Wearables Developer Center](https://wearables.developer.meta.com/)
   - `YOUR_CLIENT_TOKEN` — from the same Developer Center page

2. Build and run:
   ```bash
   npx expo prebuild --clean
   npx expo run:ios --device
   ```

> Requires a physical iOS device with a paired Meta Wearables device.

## Troubleshooting

### Pod install fails / autolinking skips EMWDAT

Ensure iOS deployment target is 16.0. The config plugin sets this automatically, but if you ran `expo prebuild --clean`, check that `ios/Podfile.properties.json` contains:

```json
{ "ios.deploymentTarget": "16.0" }
```

### `MWDATCamera` / `MWDATCore` framework not found at runtime

The config plugin adds a build phase to embed these dynamic frameworks. Run `npx expo prebuild --clean` to regenerate the Xcode project.

### Registration opens Meta AI app but callback doesn't return

Verify your `urlScheme` matches the one registered in the Meta Wearables Developer Center, and that `CFBundleURLTypes` in Info.plist contains it. The config plugin handles this, but double-check after prebuild.

### Stream starts but no video frames

Ensure the glasses hinges are open and the device is connected (`linkState: "connected"`). Check `onStreamError` for `hingesClosed` or `deviceNotConnected` errors.

### `expo prebuild --clean` breaks the build

This wipes `Podfile.properties.json`. Re-run prebuild (the config plugin will re-inject the deployment target) and then `pod install`.

## Privacy & Data

- The library **does not store, persist, or log** personally identifiable information
- **No network requests** are made beyond what the Meta Wearables DAT SDK itself performs
- **Debug logging** is disabled by default (`logLevel: "info"`) — logs stay on the device console
- **Photos** are saved to a local file path and never uploaded by the library
- **Video frames** are rendered on-device and not transmitted or stored

See [SECURITY.md](./SECURITY.md) for the vulnerability reporting process.

## Roadmap

- Android support
- Background streaming (pending SDK support)
- New Architecture validation
- Device state (battery, hinge) publishers (pending SDK support)

## License

[MIT](./LICENSE)
