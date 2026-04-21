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
  // Session-based streaming
  createSession,
  startSession,
  stopSession,
  addStreamToSession,
  removeStreamFromSession,
  capturePhoto,
  // Mock device kit
  enableMockDeviceKit,
  disableMockDeviceKit,
  isMockDeviceKitEnabled,
  pairMockDevice,
  unpairMockDevice,
  getMockDevices,
  mockDevicePowerOn,
  mockDevicePowerOff,
  mockDeviceDon,
  mockDeviceDoff,
  mockDeviceFold,
  mockDeviceUnfold,
  mockDeviceSetCameraFeed,
  mockDeviceSetCapturedImage,
  mockDeviceSetCameraFeedFromCamera,
  mockSetPermissionStatus,
  mockSetPermissionRequestResult,
} from "./EMWDATModule";

// Types
export * from "./EMWDAT.types";
