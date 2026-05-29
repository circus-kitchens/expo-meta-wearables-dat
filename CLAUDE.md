# CLAUDE.md

Expo native module for Meta Wearables DAT SDK **0.7** (iOS + Android). Web stubs throw "not supported".

## Commands

Use **pnpm** (enforced). Scripts delegate to `expo-module` CLI.

```bash
pnpm build    # TS → build/
pnpm test     # Jest (4-project: iOS/Android/Web/Node)
pnpm lint     # ESLint
```

## Structure

- `src/` — TS API: module (`EMWDATModule.ts`), types, `useMetaWearables` hook, `EMWDATStreamView` native view. Web stubs in `.web.ts` files.
- `ios/` — Swift: `EMWDATModule.swift`, `WearablesManager.swift`, `StreamSessionManager.swift`, `DisplaySessionManager.swift`, `DisplayContentBuilder.swift`, `EMWDATStreamView.swift`, `EMWDATAppDelegateSubscriber.swift`.
- `android/` — Kotlin: `EMWDATModule.kt`, `WearablesManager.kt`, `StreamSessionManager.kt`, `DisplaySessionManager.kt`, `DisplayContentBuilder.kt`, `MockDeviceManager.kt`, `EMWDATView.kt`, `EMWDATLogger.kt`.
- `plugin/` — Config plugin: Info.plist, Xcode embed scripts, AndroidManifest meta-data, `damEnabled` opt-in. Entry: `app.plugin.js`.
- `example/` — Standalone Expo app with own `node_modules`. Linked via metro `watchFolders`.

## SDK version (0.7)

| Platform | Artifacts                                                                     |
| -------- | ----------------------------------------------------------------------------- |
| Android  | `mwdat-core`, `mwdat-camera`, `mwdat-display`, `mwdat-mockdevice` @ **0.7.0** |
| iOS      | SPM `MWDATCore`, `MWDATCamera`, `MWDATDisplay`, `MWDATMockDevice` @ **0.7.0** |

### 0.7 renames (native bridge — TS public API unchanged for camera)

| 0.6                                        | 0.7                                                            |
| ------------------------------------------ | -------------------------------------------------------------- |
| `Session`                                  | `DeviceSession`                                                |
| `SessionError`                             | `DeviceSessionError`                                           |
| `StreamSessionState`                       | `StreamState`                                                  |
| `StreamSession` (iOS)                      | `Stream`                                                       |
| `StreamSessionConfig` (iOS)                | `StreamConfiguration`                                          |
| `RegistrationState` sealed class (Android) | plain enum (`REGISTERED`, …)                                   |
| `PermissionStatus.Granted/Denied`          | `GRANTED` / `DENIED`                                           |
| `Wearables.createSession()` direct return  | `DatResult` — use `.fold()`                                    |
| Stream after `addStream()`                 | call `stream.start()` (Android) / `await stream.start()` (iOS) |

## Display capability (0.7, additive)

Display renders declarative UI on **Meta Ray-Ban Display** glasses. Requires **DAM** (Device Access Toolkit App Model).

### Architecture

```
JS DisplayContentNode (JSON tree)
  → EMWDATModule.addDisplayToSession / sendDisplayContent
  → DisplaySessionManager
  → DisplayContentBuilder (native DSL)
  → mwdat-display / MWDATDisplay
  → glasses lenses
  → captouch tap → onDisplayInteraction (interactionId string)
```

Display attaches to an existing `DeviceSession` like camera streaming — not a separate registration flow.

### TypeScript API (new exports)

- `addDisplayToSession(sessionId)`
- `removeDisplayFromSession(sessionId)`
- `sendDisplayContent(sessionId, contentTree)` — root node must be `type: "flexBox"`
- Events: `onDisplayStateChange`, `onDisplayInteraction`, `onDisplayError`
- Hook: `displayStates`, same three actions + callbacks

### DisplayContentNode (MVP)

`flexBox` | `text` | `button` | `image` | `icon` — see `src/EMWDAT.types.ts`.

Tap handling: set `onPressId` on nodes; native emits `onDisplayInteraction` with that string (no JS callbacks in native).

### Config plugin — `damEnabled`

```json
["expo-meta-wearables-dat", { "urlScheme": "myapp", "damEnabled": true }]
```

When `true`:

- Android: `com.meta.wearable.mwdat.DAM_ENABLED = true` in AndroidManifest
- iOS: `MWDAT.DAMEnabled = true` in Info.plist

Camera-only apps omit `damEnabled` (default `false`).

### Hardware / testing limits

| Requirement      | Version              |
| ---------------- | -------------------- |
| Meta AI app      | V272+                |
| Display firmware | V125+                |
| Hardware         | Meta Ray-Ban Display |

**MockDeviceKit does not simulate display rendering.** Display must be validated on physical Display glasses.

## SDK Docs

- Local: `docs/ios/` (SDK headers/reference)
- Online: https://wearables.developer.meta.com/docs/develop
- Display reference: https://wearables.developer.meta.com/docs/reference/
- The docs site is a client-side rendered SPA — browse API reference at https://wearables.developer.meta.com/docs/reference/

## Key Patterns

- Module name: `"EMWDAT"` across all platforms
- iOS managers decoupled from ExpoModulesCore via callback closures (`EventEmitter`)
- Platform files use `.web.ts`/`.web.tsx` suffix (Metro/webpack resolved)
- All SDK Wearables methods are `async throws` (iOS) — trust `.swiftinterface` over docs
- Session-based capabilities: `createSession()` → `startSession()` → `addStreamToSession()` / `addDisplayToSession()`
- iOS `Stream` / Display are `@MainActor`; `.start()`/`.stop()` are `async`
- `DeviceSessionState`: idle → starting → started → paused → stopping → stopped (terminal)
- Publisher subscriptions use `.listen { }` (SDK extension → `AnyListenerToken`)
- Android uses `DatResult.fold()` — do not use `getOrThrow()` in bridge code

## Consuming this package (unpublished / fork)

Point your Expo app at a git branch or local path — not npm `@1.3.0` (still 0.6 upstream):

```json
"expo-meta-wearables-dat": "github:YOUR_USER/expo-meta-wearables-dat#YOUR_BRANCH"
```

Then `pnpm install`, `npx expo prebuild --clean`, `npx expo run:ios|android`. Requires dev build (not Expo Go).

## Conventions

- Conventional Commits (commitlint + husky). Releases via semantic-release on `main`.
- Pre-commit runs `pnpm lint-staged` — **pnpm must be on PATH** (GitHub Desktop on Windows often needs `corepack enable`).

## Agent rule files

- Cursor: `.cursor/rules/` — `dat-conventions.mdc`, `display-api.mdc`, etc.
- Claude Code: `.claude/rules/`, `.claude/skills/`
- Codex / general agents: `CODEX.md`, `AGENTS.md`
