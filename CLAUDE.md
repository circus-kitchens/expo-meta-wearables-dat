# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

- Expo native module (`expo-meta-wearables-dat`) for integrating Meta AI glasses (Meta Wearables DAT) into Expo/React Native apps.
- Built with the [Expo Modules API](https://docs.expo.dev/modules/module-api/). iOS-only native implementation backed by Meta Wearables DAT iOS SDK 0.4; Android and web stubs throw "not supported".
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint + husky; releases are automated via semantic-release on push to `main`.
- Contains an example React Native + expo app in `./example`.

## Commands

Package manager is **pnpm** (enforced via `preinstall` script).

```bash
pnpm build          # Build TS → build/
pnpm test           # Run tests (Jest via expo-module-scripts)
pnpm lint           # Lint
pnpm clean          # Clean build output
pnpm prepare        # Prepare module for consumption
pnpm open:ios       # Open example iOS project in Xcode
pnpm open:android   # Open example Android project in Android Studio
```

All scripts delegate to `expo-module` CLI from `expo-module-scripts`.

## Architecture

This is an **Expo Module** with native implementations on three platforms:

- **TypeScript API** (`src/`): Module definition, types, hooks, and platform-specific `.web.ts` files
  - `EMWDATModule.ts` — loads native module via JSI (`requireNativeModule`)
  - `EMWDATModule.web.ts` — web fallback via `registerWebModule` (all methods throw)
  - `EMWDATStreamView.tsx` — native view component for video stream rendering
  - `EMWDAT.types.ts` — shared TypeScript types
  - `useMetaWearables.ts` — React hook wrapping the full module API
  - `index.ts` — public API re-exports

- **iOS** (`ios/`): Swift using ExpoModulesCore + Meta Wearables DAT SDK 0.4
  - `EMWDATModule.swift` — module definition (Events, Functions, View)
  - `EMWDATStreamView.swift` — ExpoView subclass rendering video frames
  - `WearablesManager.swift` — @MainActor singleton managing SDK lifecycle
  - `StreamSessionManager.swift` — @MainActor singleton managing camera streaming
  - `EMWDATAppDelegateSubscriber.swift` — handles deep link URL forwarding
  - `EMWDATLogger.swift` — logging utilities

- **Android** (`android/`): Kotlin using expo-modules-kotlin
  - `EMWDATModule.kt` — stub module (all methods throw "not supported")
  - `EMWDATView.kt` — stub view

- **Config plugin** (`plugin/`): Expo config plugin for iOS build setup
  - `app.plugin.js` — entry point

- **Config** (`expo-module.config.json`): Maps native module classes per platform

The `example/` directory contains a standalone Expo app that imports the module from the parent directory (via metro.config.js `watchFolders` and `extraNodeModules`). It has its own `node_modules`.

## Key Patterns

- Native module name registered as `"EMWDAT"` across all platforms
- Platform-specific files use `.web.ts`/`.web.tsx` suffix convention (resolved by Metro/webpack)
- iOS managers are @MainActor singletons decoupled from ExpoModulesCore via callback closures
- Android package: `expo.modules.emwdat`
- Build output goes to `build/` (configured in tsconfig.json)
