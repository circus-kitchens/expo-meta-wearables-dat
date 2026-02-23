# Android Implementation

## Objective

This package implements Meta Wearables DAT SDK (MWDAT) to connect with Meta Wearables Glasses and wraps it and exposes it to be used by React Native applications. Right now we only support iOS, and we want to also add support for Android.

## Useful Links

- Documentation: https://deepwiki.com/facebook/meta-wearables-dat-android
- Discussions: https://github.com/facebook/meta-wearables-dat-android/discussions
- Issues: https://github.com/facebook/meta-wearables-dat-android/issues
- Example app: https://github.com/facebook/meta-wearables-dat-android/tree/main/samples/CameraAccess

## Guidelines

- We need to use the same names as the iOS.
- We need to strictly stick to the documentation.
- The implementation needs to work smoothly with the current iOS implementation.
- You can ask questions if needed
- Keep the code simple and efficient.
- If there's things that we should do outside the terminal (e.g. Android Studio, etc), you can ask me to do it and then we can continue.
- Make sure we are addressing all the Android paths next to where we are currently handling iOS.
- You can ask for information we have on the Meta Dev Center.
- We should implement the SDK in the example app:

```
<!-- Android integration
Add the following meta-data element inside the <application> tag in your AndroidManifest.xml file:
Android Application ID -->
<meta-data android:name="com.meta.wearable.mwdat.APPLICATION_ID" android:value="879777611505837" />
<meta-data android:name="com.meta.wearable.mwdat.CLIENT_TOKEN" android:value="AR|879777611505837|9b6ee93c3e702e47516fb8462fe48e83" />
```
