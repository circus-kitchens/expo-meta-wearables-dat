# CLAUDE.md

Expo native module for Meta Wearables DAT SDK 0.6 (iOS + Android). Web stubs throw "not supported".

## Commands

Use **pnpm** (enforced). Scripts delegate to `expo-module` CLI.

```bash
pnpm build    # TS → build/
pnpm test     # Jest (4-project: iOS/Android/Web/Node)
pnpm lint     # ESLint
```

## Structure

- `src/` — TS API: module (`EMWDATModule.ts`), types, `useMetaWearables` hook, `EMWDATStreamView` native view. Web stubs in `.web.ts` files.
- `ios/` — Swift: `EMWDATModule.swift` (module def), `WearablesManager.swift` + `StreamSessionManager.swift` (@MainActor singletons), `EMWDATStreamView.swift` (video), `EMWDATAppDelegateSubscriber.swift` (deep links).
- `android/` — Kotlin: `EMWDATModule.kt` (module def), `WearablesManager.kt` + `StreamSessionManager.kt` (singletons), `MockDeviceManager.kt`, `EMWDATView.kt` (video), `EMWDATLogger.kt`. Local AARs in `android/libs/`.
- `plugin/` — Config plugin: Info.plist, Xcode, Podfile setup for iOS; AndroidManifest meta-data + intent-filter for Android. Entry: `app.plugin.js`.
- `example/` — Standalone Expo app with own `node_modules`. Linked via metro `watchFolders`.

## SDK Docs

- Local: `docs/ios/` (SDK headers/reference)
- Online: https://wearables.developer.meta.com/docs/develop
- The docs site is a client-side rendered SPA — use `agent-browser` to browse API reference pages at https://wearables.developer.meta.com/docs/reference/

## Key Patterns

- Module name: `"EMWDAT"` across all platforms
- iOS managers decoupled from ExpoModulesCore via callback closures
- Platform files use `.web.ts`/`.web.tsx` suffix (Metro/webpack resolved)
- All SDK Wearables methods are `async throws` — trust `.swiftinterface` over docs
- Session-based streaming: `createSession()` → `DeviceSession`, attach stream via `addStream(config:)`
- `StreamSession` is `@MainActor`; `.start()`/`.stop()` are `async` (no throws); `.capturePhoto()` is sync
- `DeviceSessionState`: idle → starting → started → paused → stopping → stopped (terminal)
- Publisher subscriptions use `.listen { }` (SDK extension → `AnyListenerToken`)

## Conventions

- Conventional Commits (commitlint + husky). Releases via semantic-release on `main`.
