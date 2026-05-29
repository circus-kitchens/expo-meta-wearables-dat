# CODEX.md

Agent guide for **expo-meta-wearables-dat** — Expo native module bridging Meta Wearables DAT SDK **0.7** to React Native.

> Human docs: [README.md](./README.md) · SDK: https://wearables.developer.meta.com/docs/develop/

## Quick facts

- **SDK**: DAT 0.7.0 (`mwdat-core`, `mwdat-camera`, `mwdat-display`, `mwdat-mockdevice`)
- **Platforms**: iOS 16+ / Android API 31+ native; web stubs throw
- **Not Expo Go** — requires dev client (`expo prebuild` + `expo run:*`)
- **pnpm only** — `packageManager: pnpm@10.29.2`; husky pre-commit calls `pnpm lint-staged`

## Repository layout

| Path                                   | Role                                                       |
| -------------------------------------- | ---------------------------------------------------------- |
| `src/EMWDATModule.ts`                  | Typed JS wrappers over native module                       |
| `src/EMWDAT.types.ts`                  | All public TS types incl. `DisplayContentNode`             |
| `src/useMetaWearables.ts`              | React hook — state + actions                               |
| `ios/EMWDATModule.swift`               | Expo module definition, event registration                 |
| `ios/WearablesManager.swift`           | Registration, devices, `DeviceSession` lifecycle           |
| `ios/StreamSessionManager.swift`       | Camera `Stream` capability                                 |
| `ios/DisplaySessionManager.swift`      | Display capability + events                                |
| `ios/DisplayContentBuilder.swift`      | JSON tree → Swift MWDATDisplay DSL                         |
| `android/.../WearablesManager.kt`      | Same responsibilities as iOS                               |
| `android/.../StreamSessionManager.kt`  | Camera stream                                              |
| `android/.../DisplaySessionManager.kt` | Display capability                                         |
| `android/.../DisplayContentBuilder.kt` | JSON tree → Kotlin mwdat-display DSL                       |
| `plugin/src/index.ts`                  | Expo config plugin (`damEnabled`, Maven, embed frameworks) |

## Public API surface

### Camera (unchanged at TS layer since 0.6)

`configure`, `createSession`, `startSession`, `stopSession`, `addStreamToSession`, `removeStreamFromSession`, `capturePhoto`, `EMWDATStreamView`, `useMetaWearables` streaming state.

### Display (0.7, additive)

```typescript
await addDisplayToSession(sessionId);
await sendDisplayContent(sessionId, {
  type: "flexBox",
  direction: "column",
  gap: 12,
  paddingAll: 16,
  children: [
    { type: "text", content: "Hello", style: "heading" },
    { type: "button", label: "Go", onPressId: "go" },
  ],
});
await removeDisplayFromSession(sessionId);
```

Events: `onDisplayStateChange`, `onDisplayInteraction`, `onDisplayError`.

### Config plugin

```json
[
  "expo-meta-wearables-dat",
  {
    "urlScheme": "myapp",
    "damEnabled": true,
    "githubToken": "optional-for-android-maven"
  }
]
```

`damEnabled: true` is **required for Display**; optional for camera-only.

## Native bridge patterns

1. **Session first** — always `createSession` → `startSession` before attaching stream or display.
2. **JSON → DSL** — JS sends `DisplayContentNode`; native `DisplayContentBuilder` builds SDK UI tree. No JS callbacks in native — use `onPressId` + `onDisplayInteraction`.
3. **DatResult (Android)** — `createSession`, `addDisplay`, `sendContent` return `DatResult`; bridge uses `.fold()` and throws to JS on failure.
4. **Start after attach** — call `stream.start()` / `display.start()` after adding capability (0.7 requirement).
5. **DAM** — Display without `damEnabled` in manifest/plist will fail at runtime.

## 0.7 type renames (when editing native code)

See [CLAUDE.md](./CLAUDE.md#07-renames-native-bridge--ts-public-api-unchanged-for-camera) for the full table.

## Testing

```bash
pnpm test          # Jest — types, module, hook, web stubs
pnpm build         # tsc → build/ + plugin/build/
```

- **Camera**: MockDeviceKit in debug builds; example app + physical Ray-Ban Meta.
- **Display**: physical Meta Ray-Ban Display only; Meta AI V272+, firmware V125+.
- Do not add MockDeviceKit display simulation — SDK does not support it.

## Common tasks

| Task                  | Where to edit                                                                   |
| --------------------- | ------------------------------------------------------------------------------- |
| New Display node type | `EMWDAT.types.ts`, both `DisplayContentBuilder.*`, tests in `types.test.ts`     |
| New native event      | `EMWDAT.types.ts` events, both modules' `Events(...)`, hook listeners           |
| SDK version bump      | `android/build.gradle`, `ios/EMWDAT.podspec`, plugin embed script, rename fixes |
| App manifest/plist    | `plugin/src/index.ts` only (config plugin)                                      |

## Do not

- Edit generated `build/` by hand — run `pnpm build`
- Use `getOrThrow()` on Android `DatResult` in bridge code
- Break existing camera TS API without a major version bump
- Commit `package-lock.json` — repo uses `pnpm-lock.yaml`
- Skip husky hooks with `--no-verify` unless explicitly requested

## Related agent docs

- [AGENTS.md](./AGENTS.md) — extended DAT SDK integration guides
- [.cursor/rules/display-api.mdc](./.cursor/rules/display-api.mdc) — Display-specific Cursor rule
- [.cursor/rules/dat-conventions.mdc](./.cursor/rules/dat-conventions.mdc) — Android SDK conventions
