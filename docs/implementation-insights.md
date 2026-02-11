# Implementation Insights

Reusable patterns, gotchas, and reference material for implementing EMWDAT v0.4. Read this before starting each step.

---

## Step 1 Decisions

- **EMWDATModuleEvents**: Must use function signatures `(payload: T) => void` (not plain objects) to satisfy Expo's `NativeModule<EventsMap>` constraint where `EventsMap = Record<string, (...args: any[]) => void>`
- **VideoCodec**: Only `"raw"` — matches actual SDK 0.4 surface (h264/h265 don't work)
- **All SDK types included**: DeviceState, HingeState, SessionState, DecoderError, UnregistrationError, WearablesHandleURLError added for completeness even though not all are used by the hook
- **Event naming**: `onLinkStateChange` (not `onDeviceLinkStateChange` from v0.3)
- **StreamSessionError**: Discriminated union with `type` field; cases with associated values carry extra fields (e.g. `deviceId`)
- **Build note**: After step 1, build fails on `EMWDATModule.web.ts` (emits old `"onChange"`), `EMWDATView.tsx`/`.web.tsx` (import removed `EMWDATViewProps`). These are resolved by steps 2 and 15 respectively.

## Step 2 Decisions

- **Named exports**: Module exports `EMWDATModule` (named) instead of `default` — cleaner when combined with wrapper function exports. `index.ts` import needs update in Step 11.
- **`handleUrl`**: Sync, returns `boolean` — matches native SDK's synchronous `Wearables.shared.handleUrl(url) -> Bool`.
- **Web module**: Uses `registerWebModule` with a class where all methods throw. Wrapper functions also exported (matching `.ts` API surface) for platform-specific file resolution.
- **Wrapper defaults**: `startStream` defaults to `{}` config, `capturePhoto` defaults to `"jpeg"` format.
- **`addListener` typing**: Generic over `EMWDATModuleEvents` keys — ensures event name + listener payload are type-linked.
- **Build note**: After step 2, remaining errors are `EMWDATView.tsx`/`.web.tsx` (Step 15) and `index.ts` no default export (Step 11).

## Step 3 Decisions

- **Logger**: Renamed `MetaWearablesLogger` → `EMWDATLogger`, `MetaWearablesLogLevel` → `EMWDATLogLevel`. OSLog subsystem: `expo.modules.emwdat`, category: `EMWDAT`. DispatchQueue label: `expo.modules.emwdat.logger`.
- **Permissions API**: `checkPermissionStatus` and `requestPermission` are **synchronous** in SDK 0.4 (no async/throws). WearablesManager methods are sync; module will wrap in AsyncFunction for JS Promise.
- **handleUrl**: **Synchronous** in SDK 0.4 — `Wearables.shared.handleUrl(url) -> Bool`. No more async/await/throws. WearablesManager method marked `@discardableResult`.
- **StreamSession.start()/stop()**: **Synchronous** in SDK 0.4 (no more `await`). StreamSessionManager's `startStream` is now sync `throws` (not `async throws`), and `stopStream` is sync (not `async`).
- **Publisher subscriptions**: Keep `.listen { }` pattern (SDK extension returning `AnyListenerToken`), not Combine `.sink`.
- **onVideoFrame metadata**: Now emitted over the bridge as `{ timestamp, width, height }` for every frame. Width/height from `UIImage.size` (scale=1 for camera frames).
- **onStreamError**: Changed from `{ code, message }` (v0.3) to discriminated union dict `{ type, deviceId? }` matching TS `StreamSessionError` type.
- **URL notification name**: Changed from `MetaWearablesURLCallback` to `EMWDATURLCallback` (NotificationCenter backup for AppDelegateSubscriber).
- **New mappings**: `LinkState.connecting`, `DeviceType.oakleyMetaHSTN/oakleyMetaVanguard/metaRayBanDisplay`, `StreamSessionError.hingesClosed`.
- **EventEmitter typealias**: Defined in `WearablesManager.swift`, shared by `StreamSessionManager.swift`. `FrameCallback` typealias defined in `StreamSessionManager.swift`.
- **Build note**: These files won't compile standalone — they depend on MWDATCore/MWDATCamera SPM packages (configured in step 7) and are consumed by EMWDATModule.swift (step 4).

## Step 4 Decisions

- **Event emitter setup**: Both `WearablesManager` and `StreamSessionManager` emitters set in `OnCreate` (v0.3 set stream emitter in `startStream` — OnCreate is cleaner, no missed events).
- **handleUrl threading**: Calls `Wearables.shared.handleUrl(url)` directly (bypassing @MainActor manager) since `Function` runs on JS thread. SDK's URL routing is expected to be thread-safe. If issues surface at runtime, switch to AsyncFunction.
- **getRegistrationState (sync)**: Returns hardcoded `"unavailable"` — @MainActor state can't be accessed synchronously from JS thread. Hook uses `getRegistrationStateAsync()` on mount + events for updates.
- **Mapping helpers**: Duplicated in module (private methods) rather than exposing manager mappings — keeps managers unchanged, follows v0.3 pattern. Only 3 mappers needed for async getters.
- **View definition**: Included now referencing `EMWDATStreamView` (step 6). Contract: `setActive(_ isActive: Bool)` and `setResizeMode(_ mode: String)` methods. Won't compile until step 6+7.
- **AsyncFunction pattern**: All @MainActor calls use explicit `Promise` + `Task { @MainActor in }` pattern (proven v0.3 approach). Expo's `.runOnQueue(.main)` doesn't satisfy Swift's @MainActor isolation.
- **Build note**: References `EMWDATStreamView` (step 6). Same SPM dependency requirement as step 3 (step 7).

## Step 5 Decisions

- **Direct SDK call**: `Wearables.shared.handleUrl(url)` called directly — no dependency on `WearablesManager` init order (subscriber runs before module `OnCreate`).
- **No logging**: Subscriber kept minimal; `WearablesManager.handleUrl()` already logs when URLs come through the JS `handleUrl()` path or notification backup.
- **Improvement over v0.3**: v0.3 had no `AppDelegateSubscriber` — relied solely on `NotificationCenter` (`MetaWearablesURLCallback`). The subscriber is the Expo-native way to intercept `application(_:open:options:)`.
- **Config registration**: `expo-module.config.json` update deferred to Step 7 (`apple.appDelegateSubscribers: ["EMWDATAppDelegateSubscriber"]`).
- **Build note**: Same SPM dependency requirement as steps 3-4 (step 7).

---

## Native SDK API (MWDAT 0.4)

### Imports

```swift
import MWDATCore   // Wearables, Device, Registration, Permissions
import MWDATCamera // StreamSession, VideoFrame, PhotoData
```

### Entry points

- `Wearables.configure()` — must call once at launch
- `Wearables.shared` — singleton for all SDK access

### Listener pattern

All listeners return `AnyListenerToken` (call `.cancel()` to unsubscribe):

```swift
let token = Wearables.shared.addRegistrationStateListener { state in ... }
let token = Wearables.shared.addDevicesListener { devices in ... }
let token = device.addLinkStateListener { linkState in ... }
```

### Stream publishers (Combine)

```swift
session.statePublisher      → AnyPublisher<StreamSessionState, Never>
session.videoFramePublisher  → AnyPublisher<VideoFrame, Never>
session.photoDataPublisher   → AnyPublisher<PhotoData, Never>
session.errorPublisher       → AnyPublisher<StreamSessionError, Never>
```

### SDK types vs v0.3

| Type                 | v0.3 values             | v0.4 additions                                                                                                          |
| -------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `DeviceType`         | rayBanMeta, unknown     | oakleyMetaHSTN, oakleyMetaVanguard, metaRayBanDisplay                                                                   |
| `LinkState`          | connected, disconnected | connecting                                                                                                              |
| `StreamSessionError` | internalError, timeout  | deviceNotFound(id), deviceNotConnected(id), videoStreamingError, audioStreamingError, permissionDenied, hingesClosed    |
| `RegistrationError`  | —                       | alreadyRegistered, configurationInvalid, metaAINotInstalled, networkUnavailable, unknown                                |
| `PermissionError`    | —                       | noDevice, noDeviceWithConnection, connectionError, metaAINotInstalled, requestInProgress, requestTimeout, internalError |

### VideoFrame

- `sampleBuffer: CMSampleBuffer` — raw, can't bridge to JS
- `makeUIImage() -> UIImage?` — safe conversion for rendering
- Only send metadata (timestamp, width, height) over the bridge

### PhotoData

- `data: Data` — raw bytes
- `format: PhotoCaptureFormat` — jpeg or heic
- Save to `NSTemporaryDirectory()` with unique filename, send file path to JS

### SDK quirks

- `VideoCodec` has `.raw`, `.h264`, `.h265` but only `.raw` actually works — force `.raw` in config parsing
- `Device.name` can be empty string
- `startRegistration()` / `startUnregistration()` open the Meta AI app (user leaves your app)
- `handleUrl(URL) -> Bool` must be called when user returns from Meta AI app
- `checkPermissionStatus()` and `requestPermission()` are synchronous in SDK 0.4 (no async/throws)
- `requestPermission()` may open Meta AI app
- `StreamSession.start()` and `stop()` are synchronous in SDK 0.4

---

## v0.3 Patterns to Reuse

### Event emitter bridge (decoupled from ExpoModulesCore)

```swift
// In WearablesManager:
private var emitEvent: ((String, [String: Any]) -> Void)?

func setEventEmitter(_ emitter: @escaping (String, [String: Any]) -> Void) {
    self.emitEvent = emitter
}

// In EMWDATModule OnCreate:
WearablesManager.shared.setEventEmitter { [weak self] name, body in
    self?.sendEvent(name, body)
}
```

### Device serialization helper

```swift
func serializeDevice(_ device: Device) -> [String: Any] {
    return [
        "identifier": device.identifier,
        "name": device.name,
        "linkState": device.linkState == .connected ? "connected" :
                     device.linkState == .connecting ? "connecting" : "disconnected",
        "deviceType": mapDeviceType(device.deviceType()),
        "compatibility": device.compatibility() == .compatible ? "compatible" : "incompatible"
    ]
}
```

### Photo saving pattern

```swift
let timestamp = Int(Date().timeIntervalSince1970 * 1000)
let ext = format == .jpeg ? "jpg" : "heic"
let fileName = "emwdat_photo_\(timestamp).\(ext)"
let filePath = (NSTemporaryDirectory() as NSString).appendingPathComponent(fileName)
try photoData.data.write(to: URL(fileURLWithPath: filePath))
```

### Hook validation guard pattern

```typescript
const startStream = useCallback(async (config?: Partial<StreamSessionConfig>) => {
  if (!isConfiguredRef.current) throw new Error("Not configured");
  if (registrationStateRef.current !== "registered") throw new Error("Not registered");
  if (permissionStatusRef.current !== "granted") throw new Error("Camera permission not granted");
  if (streamStateRef.current === "streaming" || streamStateRef.current === "starting") {
    throw new Error("Stream already active");
  }
  // ... actual call
}, []);
```

Note: use refs (not state) for guards to avoid stale closure issues.

### Hook callback ref pattern

```typescript
const callbacksRef = useRef(callbacks);
callbacksRef.current = callbacks; // Update every render

useEffect(() => {
  const subs = [
    module.addListener("onRegistrationStateChange", (e) => {
      setRegistrationState(e.state);
      callbacksRef.current.onRegistrationStateChange?.(e.state);
    }),
    // ... other listeners
  ];
  return () => subs.forEach((s) => s.remove());
}, []); // Empty deps — refs keep callbacks fresh
```

### Permission auto-sync on registration change

```typescript
// Inside onRegistrationStateChange listener:
if (state === "registered") {
  module.checkPermissionStatus("camera").then((status) => {
    setPermissionStatus(status);
  });
} else {
  setPermissionStatus("denied");
}
```

---

## Expo Module API Reference

### Module definition (Swift)

```swift
public class EMWDATModule: Module {
    public func definition() -> ModuleDefinition {
        Name("EMWDAT")
        Events("event1", "event2")
        OnCreate { /* setup */ }
        Function("syncFn") { args in /* ... */ }
        AsyncFunction("asyncFn") { (args, promise) in /* ... */ }
        View(EMWDATStreamView.self) {
            Prop("propName") { (view, value) in /* ... */ }
        }
    }
}
```

### AppDelegateSubscriber

```swift
public class EMWDATAppDelegateSubscriber: ExpoAppDelegateSubscriber {
    public func application(_ app: UIApplication, open url: URL,
                          options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return Wearables.shared.handleUrl(url)
    }
}
```

Register in `expo-module.config.json` under `apple.appDelegateSubscribers`.

### JS module loading

```typescript
import { requireNativeModule } from "expo-modules-core";
const module = requireNativeModule<ModuleInterface>("EMWDAT");
```

### Event subscription (JS)

```typescript
const subscription = module.addListener("eventName", (payload) => { ... });
subscription.remove(); // cleanup
```

---

## Config Plugin Reference

### Info.plist keys required

```xml
CFBundleURLTypes → CFBundleURLSchemes: [urlScheme]
LSApplicationQueriesSchemes: ["fb-viewapp"]
UISupportedExternalAccessoryProtocols: ["com.meta.ar.wearable"]
UIBackgroundModes: ["bluetooth-peripheral", "external-accessory"]
NSBluetoothAlwaysUsageDescription: "..."
MWDAT: { AppLinkURLScheme: "urlScheme://", MetaAppID: "0" }
```

### Expo config plugin pattern

```typescript
import { ConfigPlugin, withInfoPlist } from "expo/config-plugins";

const withEMWDAT: ConfigPlugin<Props> = (config, props) => {
  config = withInfoPlist(config, (config) => {
    // modify config.modResults (the Info.plist dict)
    return config;
  });
  return config;
};
```

---

## Naming Conventions

| Concept            | TypeScript           | Swift                | Event name                  |
| ------------------ | -------------------- | -------------------- | --------------------------- |
| Module             | `EMWDAT`             | `EMWDATModule`       | —                           |
| Registration state | `RegistrationState`  | `RegistrationState`  | `onRegistrationStateChange` |
| Devices list       | `Device[]`           | `[DeviceIdentifier]` | `onDevicesChange`           |
| Link state         | `LinkState`          | `LinkState`          | `onLinkStateChange`         |
| Stream state       | `StreamSessionState` | `StreamSessionState` | `onStreamStateChange`       |
| Video frame        | `VideoFrameMetadata` | `VideoFrame`         | `onVideoFrame`              |
| Photo captured     | `PhotoData`          | `PhotoData`          | `onPhotoCaptured`           |
| Stream error       | `StreamSessionError` | `StreamSessionError` | `onStreamError`             |
| Permission         | `PermissionStatus`   | `PermissionStatus`   | `onPermissionStatusChange`  |
