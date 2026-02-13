# Contributing

Thanks for your interest in contributing to `expo-meta-wearables-dat`!

## Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/circus-kitchens/expo-meta-wearables-dat.git
   cd expo-meta-wearables-dat
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Run the example app**

   ```bash
   cd example
   npx expo prebuild --clean
   npx expo run:ios
   ```

   > Note: The example app requires a physical iOS device with a paired Meta Wearables device. Simulator builds will compile but SDK features won't work.

## Available Commands

```bash
pnpm build          # Build TypeScript → build/
pnpm test           # Run tests (Jest via expo-module-scripts)
pnpm lint           # Lint with ESLint
pnpm clean          # Clean build output
pnpm open:ios       # Open example iOS project in Xcode
```

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) enforced by commitlint + husky:

- `fix: ...` — Bug fix (patch release)
- `feat: ...` — New feature (minor release)
- `feat!: ...` or `BREAKING CHANGE:` footer — Breaking change (major release)
- `chore: ...`, `docs: ...`, `refactor: ...` — No release

## Pull Request Process

1. Fork the repo and create a feature branch from `main`.
2. Make your changes with appropriate tests.
3. Ensure all checks pass:
   ```bash
   pnpm lint
   pnpm build
   pnpm test
   ```
4. Open a PR against `main` with a clear description of the change.
5. A maintainer will review your PR and may request changes.

## Project Structure

- `src/` — TypeScript API (module, types, hook, view)
- `ios/` — Swift native implementation (ExpoModulesCore)
- `android/` — Kotlin stubs
- `plugin/` — Expo config plugin (Info.plist injection)
- `example/` — Example Expo app
