# Android Implementation Plan

## Context

Module wraps Meta Wearables DAT SDK for Expo/RN. iOS fully implemented; Android has stubs throwing "not supported". Goal: real Android implementation matching iOS API surface using SDK v0.4.0.

## Useful Links

- [Android SDK Documentation (DeepWiki)](https://deepwiki.com/facebook/meta-wearables-dat-android)
- [Android SDK GitHub Repo](https://github.com/facebook/meta-wearables-dat-android)
- [Sample App (CameraAccess)](https://github.com/facebook/meta-wearables-dat-android/tree/main/samples/CameraAccess)
- [GitHub Discussions](https://github.com/facebook/meta-wearables-dat-android/discussions)
- [GitHub Issues](https://github.com/facebook/meta-wearables-dat-android/issues)
- [Official Docs](https://wearables.developer.meta.com/docs/build-integration-android/)
- [API Reference v0.4](https://wearables.developer.meta.com/docs/reference/android/dat/0.4)
- [CHANGELOG](https://github.com/facebook/meta-wearables-dat-android/blob/main/CHANGELOG.md)

## Guidelines (from android.md)

- Same names as iOS
- Stick to documentation
- Work smoothly with current iOS implementation
- Keep code simple and efficient
- Address all Android paths next to where iOS is handled
- Implement SDK in the example app

## Example App Config

```xml
<meta-data android:name="com.meta.wearable.mwdat.APPLICATION_ID" android:value="879777611505837" />
<meta-data android:name="com.meta.wearable.mwdat.CLIENT_TOKEN" android:value="AR|879777611505837|9b6ee93c3e702e47516fb8462fe48e83" />
```

---

## Verified Android SDK API

### Packages

```
com.meta.wearable.dat.core.Wearables
com.meta.wearable.dat.core.types.{DeviceIdentifier, DeviceCompatibility, Permission, PermissionStatus, RegistrationState}
com.meta.wearable.dat.core.selectors.{AutoDeviceSelector, DeviceSelector}
com.meta.wearable.dat.camera.{StreamSession, startStreamSession}
com.meta.wearable.dat.camera.types.{StreamConfiguration, StreamSessionState, VideoFrame, VideoQuality, PhotoData}
com.meta.wearable.dat.mockdevice.MockDeviceKit
com.meta.wearable.dat.mockdevice.api.MockRaybanMeta
```

### Key API (from sample app source)

- `Wearables.initialize(context)` — init SDK
- `Wearables.registrationState: Flow<RegistrationState>` — `Unavailable()`, `Registered`, `Registering`
- `Wearables.devices: Flow<Set<DeviceIdentifier>>` — device list
- `Wearables.devicesMetadata[deviceId]?.collect { metadata -> }` — per-device metadata
- `Wearables.startRegistration(activity)` / `startUnregistration(activity)` — void
- `Wearables.checkPermissionStatus(Permission.CAMERA): DatResult<PermissionStatus, PermissionError>`
- `Wearables.RequestPermissionContract()` — ActivityResultContract
- `Wearables.startStreamSession(context, deviceSelector, config)` — returns StreamSession
- `StreamSession.videoStream: Flow<VideoFrame>` — I420 ByteBuffer (not Bitmap!)
- `StreamSession.state: Flow<StreamSessionState>` — `STOPPED`, `STREAMING`, etc.
- `StreamSession.capturePhoto()?.onSuccess { }?.onFailure { }` — PhotoData sealed: `.Bitmap` or `.HEIC`
- `StreamSession.close()` — cleanup
- `StreamConfiguration(videoQuality = VideoQuality.MEDIUM, frameRate)` — quality + fps
- **No `handleUrl()` on Android** — deep links via intent filters only

### MockDeviceKit (fold/unfold confirmed)

- `MockDeviceKit.getInstance(context).pairRaybanMeta(): MockRaybanMeta`
- `.unpairDevice(device)`, `.pairedDevices`
- `MockRaybanMeta`: `.powerOn/Off()`, `.don/doff()`, `.fold/unfold()`
- `.getCameraKit().setCameraFeed(uri: Uri)` / `.setCapturedImage(uri: Uri)` — takes Android Uri

### DatResult pattern

```kotlin
result.onSuccess { value -> ... }
result.onFailure { error, _ -> ... }
result.getOrNull()
result.getOrDefault(default)
```

---

## iOS vs Android Differences

| iOS                                  | Android                                               |
| ------------------------------------ | ----------------------------------------------------- |
| `Wearables.configure()`              | `Wearables.initialize(context)`                       |
| Swift publishers `.listen {}`        | Kotlin `Flow.collect {}`                              |
| `throws`                             | `DatResult<S,E>`                                      |
| `handleUrl(url)` → bool              | No equivalent (intent-filter)                         |
| `UIImage` frames                     | Raw I420 `ByteBuffer` → conversion needed             |
| `StreamSession(config)` + `.start()` | `Wearables.startStreamSession(ctx, selector, config)` |
| `session.stop()` keeps session       | `session.close()` destroys                            |
| `#if DEBUG`                          | `BuildConfig.DEBUG` runtime                           |
| SPM                                  | Maven GitHub Packages (PAT required)                  |
| `PhotoCaptureFormat` param           | `PhotoData` sealed (Bitmap/HEIC)                      |

---

## Files to Create/Modify

### New files (`android/src/main/java/expo/modules/emwdat/`)

1. **`WearablesManager.kt`** — Singleton: SDK init, registration, permissions, device Flow collection, event emission
2. **`StreamSessionManager.kt`** — Singleton: stream lifecycle, I420→Bitmap conversion, photo capture, session management
3. **`MockDeviceManager.kt`** — Singleton, DEBUG-gated: mock device lifecycle
4. **`EMWDATLogger.kt`** — Logging via `android.util.Log`, port of iOS logger

### Modified files

5. **`EMWDATModule.kt`** — Replace all stubs, add coroutine scope, wire managers, add mock functions
6. **`EMWDATView.kt`** — Replace TextView with ImageView rendering Bitmaps
7. **`android/build.gradle`** — minSdk 31, GitHub Packages repo, SDK dependencies
8. **`android/src/main/AndroidManifest.xml`** — Bluetooth + Internet permissions
9. **`plugin/src/index.ts`** — Android: manifest meta-data + intent-filter + gradle repo
10. **`src/EMWDATModule.ts`** (line 66) — Fix addListener guard for Android

---

## Implementation Phases

### Phase 1: Build config + foundation — `[ ] TO DO`

- `android/build.gradle` — bump minSdk 24→31, add GitHub Packages maven repo (GITHUB_TOKEN env var), add deps:
  - `implementation "com.meta.wearable:mwdat-core:0.4.0"`
  - `implementation "com.meta.wearable:mwdat-camera:0.4.0"`
  - `debugImplementation "com.meta.wearable:mwdat-mockdevice:0.4.0"`
  - `implementation "androidx.exifinterface:exifinterface:1.3.7"` (for HEIC photo EXIF)
- `android/AndroidManifest.xml` — add BLUETOOTH, BLUETOOTH_CONNECT, INTERNET permissions
- Create `EMWDATLogger.kt` — `android.util.Log` wrapper with level filtering
- Verify: SDK imports compile

### Phase 2: Core (WearablesManager + registration) — `[ ] TO DO`

- Create `WearablesManager.kt`:
  - `configure(context)` → `Wearables.initialize(context)` + start Flow collectors
  - Collect `registrationState` → emit `onRegistrationStateChange`
  - Collect `devices` → emit `onDevicesChange`
  - `startRegistration(activity)` / `startUnregistration(activity)`
  - `cleanup()` — cancel coroutine scope
- Update `EMWDATModule.kt`:
  - Add `CoroutineScope(SupervisorJob() + Dispatchers.Main)`, cancel in OnDestroy
  - OnCreate: set event emitters on managers
  - Wire: `configure`, `getRegistrationState`, `getRegistrationStateAsync`, `startRegistration`, `startUnregistration`
  - `handleUrl` → resolve `false` (no-op on Android)
- Verify: SDK init + registration flow

### Phase 3: Permissions + devices — `[ ] TO DO`

- `WearablesManager.kt`:
  - `checkPermissionStatus(Permission.CAMERA)` → unwrap DatResult
  - `requestPermission` → use `RequestPermissionContract` via Activity
  - Device monitoring: combine `devices` + `devicesMetadata` Flows
  - Per-device: collect compatibility via `devicesMetadata[id]`
  - Serialize devices to match iOS shape: `{ identifier, name, linkState, deviceType, compatibility }`
  - Emit: `onLinkStateChange`, `onCompatibilityChange`, `onDeviceSessionStateChange`
- `EMWDATModule.kt`: wire `checkPermissionStatus`, `requestPermission`, `getDevices`, `getDevice`
- Verify: permission flow, device listing

### Phase 4: Streaming — `[ ] TO DO`

- Create `StreamSessionManager.kt`:
  - `startStream(context, config, deviceId?)` → `Wearables.startStreamSession(ctx, selector, StreamConfiguration(...))`
  - Use `AutoDeviceSelector()` (or specific selector if deviceId provided)
  - Collect `videoStream` → I420→NV21→JPEG→Bitmap conversion (from sample app)
  - Forward Bitmap to view via `frameCallback`
  - Collect `state` → emit `onStreamStateChange`
  - Emit `onVideoFrame` with metadata (timestamp, width, height)
  - `capturePhoto()` → handle PhotoData (Bitmap/HEIC sealed class) → save to temp file → emit `onPhotoCaptured`
  - `stopStream()` → `session.close()`, cancel collection jobs
  - `destroy()` — full cleanup
- Update `EMWDATView.kt`:
  - ImageView in ExpoView, black background
  - `setActive(true/false)` → register/unregister frameCallback
  - `setResizeMode("cover"/"stretch"/"contain")` → CENTER_CROP/FIT_XY/FIT_CENTER
- `EMWDATModule.kt`: wire `getStreamState`, `startStream`, `stopStream`, `capturePhoto`, View props
- Verify: stream start/stop, video frames, photo capture

### Phase 5: Mock devices — `[ ] TO DO`

- Create `MockDeviceManager.kt`:
  - `BuildConfig.DEBUG` runtime guard
  - Store `Map<String, MockRaybanMeta>`
  - `createMockDevice()` → `MockDeviceKit.getInstance(ctx).pairRaybanMeta()`, return ID
  - `removeMockDevice(id)` → `mockDeviceKit.unpairDevice(device)`
  - `powerOn/Off(id)`, `don/doff(id)`, `fold/unfold(id)`
  - `setCameraFeed(id, fileUrl)` → parse to `Uri` → `device.getCameraKit().setCameraFeed(uri)`
  - `setCapturedImage(id, fileUrl)` → parse to `Uri` → `device.getCameraKit().setCapturedImage(uri)`
  - `getMockDevices()` → list of IDs
- `EMWDATModule.kt`: add all 10 mock device AsyncFunctions
- Verify: mock device lifecycle

### Phase 6: Config plugin + TypeScript — `[ ] TO DO`

- `plugin/src/index.ts`:
  - `withAndroidManifest`: add `<meta-data>` for APPLICATION_ID and CLIENT_TOKEN inside `<application>`
  - `withAndroidManifest`: add deep link `<intent-filter>` with urlScheme on main activity
  - `withProjectBuildGradle`: inject GitHub Packages maven repo into `allprojects.repositories`
- `src/EMWDATModule.ts` line 66: change `Platform.OS !== "ios"` → `Platform.OS === "web"`
- Build plugin: `cd plugin && pnpm build`
- Build TS: `pnpm build`
- Verify: `cd example && npx expo prebuild --platform android` generates correct config

### Phase 7: Example app + end-to-end testing — `[ ] TO DO`

- Prebuild example app for Android
- Verify `./gradlew assembleDebug` compiles
- Test on physical Android device:
  - Mock device flow (create, power on, don, set camera feed, stream, capture photo)
  - Real device flow (register, connect, stream, capture photo)

---

## Known Risks

1. **Permission request via ActivityResultContract** — Expo modules don't control Activity lifecycle. `registerForActivityResult()` must be called before `STARTED` state. May need workaround or iteration.
2. **VideoFrame I420 conversion performance** — Per-frame byte conversion at 30fps could be expensive. Monitor for frame drops.
3. **GitHub Packages auth for consumers** — Env var `GITHUB_TOKEN` required. Config plugin injects maven repo with env var reference. Clear docs needed.
4. **`startStreamSession` takes DeviceSelector, not DeviceIdentifier** — iOS API takes optional `deviceId` string. Need to create appropriate selector based on input.
5. **Session reuse** — iOS reuses StreamSession across stop/start. Android `close()` destroys it. Each `startStream` creates new session on Android.

---

## Troubleshooting & Insights

_Updated during development. Add findings, constraints, and workarounds here._

<!--
Example entries:
- **[Phase 2]** `Wearables.initialize()` must be called on main thread or it crashes
- **[Phase 3]** `DeviceMetadata.name` returns empty string for some devices — use deviceId as fallback
- **[Phase 4]** I420→Bitmap conversion at 30fps causes ~15% CPU usage — acceptable
-->
