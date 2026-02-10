// Reexport the native module. On web, it will be resolved to ExpoMetaWearablesDatModule.web.ts
// and on native platforms to ExpoMetaWearablesDatModule.ts
export { default } from "./ExpoMetaWearablesDatModule";
export { default as ExpoMetaWearablesDatView } from "./ExpoMetaWearablesDatView";
export * from "./ExpoMetaWearablesDat.types";
