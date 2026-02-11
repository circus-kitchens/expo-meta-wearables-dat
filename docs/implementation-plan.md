# Plan: EMWDAT v0.4 — Expo Module for Meta Wearables DAT

## Context

Rewrite placeholder Expo module to bridge MWDAT iOS 0.4 SDK. Expose `useMetaWearables` hook (state + actions + callbacks), native camera preview view, and config plugin. Android = `PLATFORM_NOT_SUPPORTED`. Based on working v0.3 in `old_package/` + updated 0.4 SDK docs.

---

## Implementation order

| #   | Step             | Files                                                                        | Status |
| --- | ---------------- | ---------------------------------------------------------------------------- | ------ |
| 1   | Types            | `src/EMWDAT.types.ts`                                                        | ✅     |
| 2   | Module interface | `src/EMWDATModule.ts` + `.web.ts`                                            | ✅     |
| 3   | iOS managers     | `WearablesManager.swift`, `StreamSessionManager.swift`, `EMWDATLogger.swift` | ✅     |
| 4   | iOS module       | `EMWDATModule.swift`                                                         | ✅     |
| 5   | iOS URL handler  | `EMWDATAppDelegateSubscriber.swift`                                          | ✅     |
| 6   | iOS view         | `EMWDATStreamView.swift`                                                     | ✅     |
| 7   | Config           | `expo-module.config.json`, `EMWDAT.podspec`                                  | ❌     |
| 8   | Android stubs    | `EMWDATModule.kt`, `EMWDATView.kt`                                           | ❌     |
| 9   | Hook             | `src/useMetaWearables.ts`                                                    | ❌     |
| 10  | View component   | `src/EMWDATStreamView.tsx`                                                   | ❌     |
| 11  | Exports          | `src/index.ts`                                                               | ❌     |
| 12  | Config plugin    | `plugin/src/index.ts`                                                        | ❌     |
| 13  | Example app      | `example/App.tsx`, `example/app.json`                                        | ❌     |
| 14  | README           | `README.md`                                                                  | ❌     |
| 15  | Cleanup          | Delete `src/EMWDATView.tsx`, `src/EMWDATView.web.tsx`                        | ❌     |

---

## Key changes from v0.3

- **Separated Swift managers** → keep `WearablesManager` + `StreamSessionManager` pattern (proven architecture)
- **Logger** → keep `EMWDATLogger` with JS-configurable log level
- **AppDelegateSubscriber** for URL handling (replaces v0.3 NotificationCenter approach, more Expo-native)
- **View props**: `isActive` + `resizeMode` ("contain"/"cover"/"stretch")
- **Podspec SPM dep**: update version constraint to `>= 0.4.0, < 0.5.0`
- **New 0.4 SDK types**: `oakleyMetaHSTN`, `oakleyMetaVanguard`, `metaRayBanDisplay`, `connecting` link state, more error types
- **Hook**: add `lastError` state, `onPermissionStatusChange` callback, permission auto-sync on registration change
- **Validation guards**: replicate v0.3 guards in hook (must be configured, registered, have permission, etc.)

---

## Files to modify/create

### 1. Types — `src/EMWDAT.types.ts` (rewrite)

String unions: `RegistrationState`, `PermissionStatus`, `StreamSessionState`, `LinkState`, `DeviceType`, `PhotoCaptureFormat`, `StreamingResolution`, `VideoCodec`, `LogLevel`

Interfaces: `Device` (identifier, name, linkState, deviceType, compatibility), `StreamSessionConfig`, `PhotoData` (filePath, format, timestamp, width?, height?, base64?), `VideoFrameMetadata` (timestamp, width, height), `StreamSessionError` (discriminated union with all 0.4 error types)

Error code types: `WearablesErrorCode`, `RegistrationErrorCode`, `PermissionErrorCode`, `StreamSessionErrorCode`

Event map `EMWDATModuleEvents`: `onRegistrationStateChange`, `onDevicesChange`, `onLinkStateChange`, `onStreamStateChange`, `onVideoFrame`, `onPhotoCaptured`, `onStreamError`, `onPermissionStatusChange`

Hook types: `UseMetaWearablesOptions` (extends callbacks + `autoConfig?` + `logLevel?`), `UseMetaWearablesReturn`

Plugin type: `EMWDATPluginProps` (urlScheme, metaAppId?, bluetoothUsageDescription?)

### 2. Module declaration — `src/EMWDATModule.ts` (rewrite)

`requireNativeModule<EMWDATModuleInterface>("EMWDAT")` with wrapped functions:

- `addListener(eventName, listener)` — platform-guarded
- `setLogLevel(level)`, `configure()`
- `getRegistrationState()` (sync), `getRegistrationStateAsync()` (async)
- `startRegistration()`, `startUnregistration()`, `handleUrl(url)`
- `checkPermissionStatus(permission)`, `requestPermission(permission)`
- `getDevices()`, `getDevice(identifier)`
- `getStreamState()`, `startStream(config)`, `stopStream()`
- `capturePhoto(format)`

### 3. Web fallback — `src/EMWDATModule.web.ts` (rewrite)

All functions throw "EMWDAT is not supported on web".

### 4. iOS — `ios/EMWDATModule.swift` (rewrite)

Thin module definition layer (~100 lines). Delegates to managers.

- Name: `"EMWDAT"`
- 8 events declared
- `OnCreate` → set event emitter on `WearablesManager.shared`
- All functions delegate to `WearablesManager` or `StreamSessionManager`
- View definition: `EMWDATStreamView` with `isActive` + `resizeMode` props

### 5. iOS — `ios/WearablesManager.swift` (new)

`@MainActor` singleton managing SDK lifecycle (~200 lines). Port from v0.3 with 0.4 API updates:

- `configure()` → `Wearables.configure()`, set up registration + devices listeners
- Listener token management (registration, devices, per-device link state)
- URL callback handling via notification center (backup for AppDelegateSubscriber)
- Device serialization helper
- Permission check/request
- Event emission via callback closure (decoupled from ExpoModulesCore)

### 6. iOS — `ios/StreamSessionManager.swift` (new)

`@MainActor` singleton for stream lifecycle (~200 lines). Port from v0.3:

- `startStream(config)` → create `AutoDeviceSelector`, `StreamSession`, subscribe to 4 Combine publishers
- `stopStream()` → tear down session + cancel subscriptions
- `capturePhoto(format)` → save to temp file, emit event
- Frame callback setter for native view
- State/error mapping helpers

### 7. iOS — `ios/EMWDATStreamView.swift` (rewrite from EMWDATView.swift)

ExpoView with `UIImageView`. Props: `isActive` (Bool), `resizeMode` (String).

- When `isActive=true`, registers frame callback on `StreamSessionManager`
- Frame callback updates `imageView.image` on main thread
- `resizeMode` maps to UIView.ContentMode

### 8. iOS — `ios/EMWDATLogger.swift` (new)

Logging utility with OS.log. Configurable level from JS. Format: `[EMWDAT] [LEVEL] [Component] Message`.

### 9. iOS — `ios/EMWDATAppDelegateSubscriber.swift` (new)

`ExpoAppDelegateSubscriber` that intercepts `application(_:open:options:)` → calls `Wearables.shared.handleUrl(url)`. Cleaner than v0.3 NotificationCenter approach.

### 10. Config — `expo-module.config.json` (edit)

```json
{
  "platforms": ["apple", "android", "web"],
  "apple": {
    "modules": ["EMWDATModule"],
    "appDelegateSubscribers": ["EMWDATAppDelegateSubscriber"]
  },
  "android": { "modules": ["expo.modules.emwdat.EMWDATModule"] }
}
```

### 11. iOS — `ios/EMWDAT.podspec` (edit)

Add SPM dependency: `meta-wearables-dat-ios` `>= 0.4.0, < 0.5.0`, products: `MWDATCore`, `MWDATCamera`. Min iOS: 16.0.

### 12. Android — `android/.../EMWDATModule.kt` (rewrite)

All functions throw `CodedException("PLATFORM_NOT_SUPPORTED", ...)`. Same events registered.

### 13. Android — `android/.../EMWDATView.kt` (rewrite)

Placeholder, renders "Not supported on Android" text.

### 14. Hook — `src/useMetaWearables.ts` (new)

Following v0.3 proven patterns (`useState` + `addListener` for everything, no `useEvent`):

- **Options**: `autoConfig` (default true), `logLevel` (default "info"), + all callbacks
- **State** (all `useState`): `isConfigured`, `registrationState`, `permissionStatus`, `devices`, `streamState`, `lastError`
- **Auto-configure**: `useEffect` on mount calls `configure()` + `setLogLevel()` if `autoConfig=true`
- **Event subscriptions**: `useRef` for callbacks + single `useEffect` with `addListener` for all 8 events; each listener updates state AND fires user callback
- **Permission sync**: on registration→"registered", auto-query permission status; on un-register, reset to "denied"
- **Error handling**: on stream error, auto-stop stream, set `lastError`
- **Validation guards**: each action checks prerequisites (configured, registered, permission, stream state)
- **Actions**: `configure`, `setLogLevel`, `startRegistration`, `startUnregistration`, `checkPermissionStatus`, `requestPermission`, `getDevice`, `refreshDevices`, `startStream`, `stopStream`, `capturePhoto`

### 15. View component — `src/EMWDATStreamView.tsx` (new, replaces EMWDATView.tsx)

```tsx
requireNativeView("EMWDATStreamView");
```

Props: `isActive?` (boolean), `resizeMode?` ("contain"|"cover"|"stretch"), `style?`

### 16. Exports — `src/index.ts` (rewrite)

Export: `useMetaWearables`, `EMWDATStreamView`, module (named), all types.

### 17. Config plugin — `plugin/src/index.ts` (new)

`withInfoPlist` adding: `CFBundleURLSchemes`, `LSApplicationQueriesSchemes` ("fb-viewapp"), `UISupportedExternalAccessoryProtocols` ("com.meta.ar.wearable"), `UIBackgroundModes` ("bluetooth-peripheral", "external-accessory"), `NSBluetoothAlwaysUsageDescription`, `MWDAT` dict.

Register in `package.json`: `"expo": { "configPlugin": "./plugin/build/index.js" }`

### 18. Example — `example/App.tsx` + `example/app.json` (rewrite)

Demo: hook usage, camera preview, all lifecycle steps.

### 19. README.md (rewrite)

Install, config plugin, permissions list, SPM dependency instructions, dev build required, iOS only, not affiliated with Meta.

### 20. Delete — `src/EMWDATView.tsx`, `src/EMWDATView.web.tsx`

Remove old WebView-based placeholder files.

---

## Verification

- `pnpm build` — TS compiles
- `pnpm lint` — passes
- Example iOS build (requires MWDAT SDK SPM in Xcode)
- `npx expo prebuild --clean` on example → verify Info.plist keys
- Hook types check in example app

---

## Decisions (resolved)

- **Auto-configure**: hook calls `configure()` on mount (idempotent guard on native)
- **VideoFrame**: metadata only over bridge; native view renders pixels; `capturePhoto()` for image data
- **Device selection**: `AutoDeviceSelector` only for v1
- **DeviceStateSession / MockDeviceKit**: skip for v1
- **Logger**: include with JS-configurable level (proven useful in v0.3)
- **View**: keep `resizeMode` prop from v0.3
- **URL handling**: AppDelegateSubscriber (improvement over v0.3 NotificationCenter)
- **Managers**: separate `WearablesManager` + `StreamSessionManager` singletons (v0.3 architecture)
- **Event pattern**: `useState` + `addListener` for all events (no `useEvent`); full control for state + callback + side effects
