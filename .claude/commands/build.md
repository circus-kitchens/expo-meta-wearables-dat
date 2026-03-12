---
description: Build the Android project using Gradle
---

Build the Android project using Gradle.

## Prerequisites

- Android Studio or Gradle CLI
- Android SDK with API 26+ (minSdk)
- GitHub personal access token with `read:packages` scope

## Setup GitHub token

The SDK is distributed via GitHub Packages. Set your token:

```bash
# Option 1: Environment variable
export GITHUB_TOKEN=ghp_your_token_here

# Option 2: local.properties
echo "github_token=ghp_your_token_here" >> local.properties
```

## Build

```bash
./gradlew assembleDebug
```

## Install on device

```bash
./gradlew installDebug
```

## Run tests

```bash
./gradlew test
```

## Common build issues

- **Authentication error**: Ensure `GITHUB_TOKEN` is set or `github_token` in `local.properties`
- **Missing repository**: Add the Maven repository for `https://maven.pkg.github.com/facebook/meta-wearables-dat-android` in `settings.gradle.kts`
- **Version not found**: Check available versions at [GitHub Packages](https://github.com/orgs/facebook/packages?repo_name=meta-wearables-dat-android)
