// Hook
export { useMetaWearables } from "./useMetaWearables";

// View
export { EMWDATStreamView } from "./EMWDATStreamView";

// Native module + typed wrapper functions
// On web, resolved to EMWDATModule.web.ts via platform-specific file resolution
export {
  EMWDATModule,
  addListener,
  setLogLevel,
  configure,
  getRegistrationState,
  getRegistrationStateAsync,
  startRegistration,
  startUnregistration,
  handleUrl,
  checkPermissionStatus,
  requestPermission,
  getDevices,
  getDevice,
  getStreamState,
  startStream,
  stopStream,
  capturePhoto,
} from "./EMWDATModule";

// Types
export * from "./EMWDAT.types";
