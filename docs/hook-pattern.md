# Hook Pattern: `useMetaWearables`

Single facade hook that returns **state**, **actions**, and accepts **event callbacks**.

## Signature

```tsx
const {
  // State (reactive, triggers re-renders)
  isConfigured,
  registrationState,
  permissionStatus,
  streamState,
  devices,
  linkState,

  // Actions (stable references)
  startRegistration,
  startUnregistration,
  requestPermission,
  startStream,
  stopStream,
  capturePhoto,
} = useMetaWearables({
  // Event callbacks (fire-and-forget reactions, no re-render)
  onPhotoCaptured: (photo: PhotoData) => void,
  onDeviceLinkStateChange: (linked: boolean) => void,
  onVideoFrame: (frame: VideoFrame) => void,
  onStreamError: (error: StreamError) => void,
  onDevicesChange: (devices: Device[]) => void,
});
```

## Internal implementation

### State values

Use Expo's `useEvent` internally per state field. Each maps to a native event:

```tsx
const registrationState = useEvent(EMWDAT, "onRegistrationState");
const streamState = useEvent(EMWDAT, "onStreamState");
```

### Event callbacks

Use `useRef` to avoid stale closures and re-subscriptions:

```tsx
const callbackRef = useRef(options.onPhotoCaptured);
callbackRef.current = options.onPhotoCaptured;

useEffect(() => {
  const sub = emitter.addListener("onPhotoCaptured", (e) => {
    callbackRef.current?.(e);
  });
  return () => sub.remove();
}, []);
```

### Actions

Wrap native module calls. Keep references stable with `useCallback`:

```tsx
const startStream = useCallback((deviceId: string) => {
  return EMWDAT.startStream(deviceId);
}, []);
```

## Why this pattern

- **Consumer writes zero `useEffect`s** — the hook owns all subscriptions
- **Callbacks for reactions** ("do X when Y hcleappens") — `onPhotoCaptured`, `onStreamError`, etc.
- **State for rendering** ("show current value") — `registrationState`, `streamState`, etc.
- **Actions for imperative calls** — `startStream()`, `capturePhoto()`, etc.
- **Single import, single call** — matches the tightly coupled MWDAT lifecycle (configure -> register -> stream -> capture)

## Mapping to native MWDAT events

| MWDAT SDK (Swift)                | Exposed as                              | Type             |
| -------------------------------- | --------------------------------------- | ---------------- |
| `addRegistrationStateListener`   | `registrationState`                     | State            |
| `addDevicesListener`             | `devices` / `onDevicesChange`           | State + Callback |
| `addLinkStateListener`           | `linkState` / `onDeviceLinkStateChange` | State + Callback |
| `statePublisher` (StreamSession) | `streamState`                           | State            |
| `videoFramePublisher`            | `onVideoFrame`                          | Callback         |
| `photoDataPublisher`             | `onPhotoCaptured`                       | Callback         |
| `errorPublisher`                 | `onStreamError`                         | Callback         |

**Rule of thumb**: if the consumer needs the value in JSX, expose as **state**. If they need to react/side-effect, expose as **callback**. Some events warrant both.
