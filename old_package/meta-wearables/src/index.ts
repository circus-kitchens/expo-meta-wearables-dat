// Re-export everything from module
export {
  addListener,
  capturePhoto,
  checkPermissionStatus,
  configure,
  EventSubscription,
  getDevice,
  getDevices,
  getRegistrationState,
  getRegistrationStateAsync,
  getStreamState,
  MetaWearablesModule,
  requestPermission,
  setLogLevel,
  startRegistration,
  startStream,
  startUnregistration,
  stopStream,
} from "./module";

// Export types
export * from "./types";

// Export view component
export { MetaWearablesStreamView } from "./MetaWearablesStreamView";
export type { MetaWearablesStreamViewProps } from "./MetaWearablesStreamView";

// Export React hook
export { useMetaWearables } from "./useMetaWearables";
export type { UseMetaWearablesOptions, UseMetaWearablesReturn } from "./useMetaWearables";
