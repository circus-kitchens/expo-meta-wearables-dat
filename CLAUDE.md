# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

- Expo native module (`expo-meta-wearables-dat`) for integrating Meta AI glasses (Meta Wearables DAT) into Expo/React Native apps.
- Built with the [Expo Modules API](https://docs.expo.dev/modules/module-api/). Currently scaffolded from the Expo module template — native functionality is placeholder.
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

- **TypeScript API** (`src/`): Module definition, types, and platform-specific `.web.ts` files
  - `ExpoMetaWearablesDatModule.ts` — loads native module via JSI (`requireNativeModule`)
  - `ExpoMetaWearablesDatModule.web.ts` — web fallback via `registerWebModule`
  - `ExpoMetaWearablesDatView.tsx` / `.web.tsx` — native view component (wraps WebView)
  - `ExpoMetaWearablesDat.types.ts` — shared TypeScript types
  - `index.ts` — public API re-exports

- **iOS** (`ios/`): Swift using ExpoModulesCore
  - `ExpoMetaWearablesDatModule.swift` — module definition (Name, Constants, Events, Functions, View)
  - `ExpoMetaWearablesDatView.swift` — ExpoView subclass wrapping WKWebView

- **Android** (`android/`): Kotlin using expo-modules-kotlin
  - `ExpoMetaWearablesDatModule.kt` — module definition (same pattern as iOS)
  - `ExpoMetaWearablesDatView.kt` — ExpoView subclass wrapping Android WebView

- **Config** (`expo-module.config.json`): Maps native module classes per platform

The `example/` directory contains a standalone Expo app that imports the module from the parent directory (via metro.config.js `watchFolders` and `extraNodeModules`). It has its own `node_modules`.

## Key Patterns

- Native module name registered as `"ExpoMetaWearablesDat"` across all platforms
- Platform-specific files use `.web.ts`/`.web.tsx` suffix convention (resolved by Metro/webpack)
- Module exposes: constants (`PI`), sync functions (`hello`), async functions (`setValueAsync`), events (`onChange`), and a native view
- Android package: `expo.modules.metawearablesdat`
- Build output goes to `build/` (configured in tsconfig.json)
