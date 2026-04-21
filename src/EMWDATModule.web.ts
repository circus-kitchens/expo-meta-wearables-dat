import { registerWebModule, NativeModule } from "expo";

import type { EMWDATModuleEvents } from "./EMWDAT.types";

const NOT_SUPPORTED = "EMWDAT is not supported on web";

function unsupported(): never {
  throw new Error(NOT_SUPPORTED);
}

class EMWDATWebModule extends NativeModule<EMWDATModuleEvents> {
  setLogLevel(): void {
    unsupported();
  }
  configure(): Promise<void> {
    unsupported();
  }
  getRegistrationState(): string {
    unsupported();
  }
  getRegistrationStateAsync(): Promise<string> {
    unsupported();
  }
  startRegistration(): Promise<void> {
    unsupported();
  }
  startUnregistration(): Promise<void> {
    unsupported();
  }
  handleUrl(): Promise<boolean> {
    unsupported();
  }
  checkPermissionStatus(): Promise<string> {
    unsupported();
  }
  requestPermission(): Promise<string> {
    unsupported();
  }
  getDevices(): Promise<never[]> {
    unsupported();
  }
  getDevice(): Promise<null> {
    unsupported();
  }

  // Session-based streaming
  createSession(): Promise<string> {
    unsupported();
  }
  startSession(): Promise<void> {
    unsupported();
  }
  stopSession(): Promise<void> {
    unsupported();
  }
  addStreamToSession(): Promise<void> {
    unsupported();
  }
  removeStreamFromSession(): Promise<void> {
    unsupported();
  }
  capturePhoto(): Promise<void> {
    unsupported();
  }

  // Mock device kit
  enableMockDeviceKit(): Promise<void> {
    unsupported();
  }
  disableMockDeviceKit(): Promise<void> {
    unsupported();
  }
  isMockDeviceKitEnabled(): Promise<boolean> {
    unsupported();
  }
  pairMockDevice(): Promise<string> {
    unsupported();
  }
  unpairMockDevice(): Promise<void> {
    unsupported();
  }
  getMockDevices(): Promise<string[]> {
    unsupported();
  }
  mockDevicePowerOn(): Promise<void> {
    unsupported();
  }
  mockDevicePowerOff(): Promise<void> {
    unsupported();
  }
  mockDeviceDon(): Promise<void> {
    unsupported();
  }
  mockDeviceDoff(): Promise<void> {
    unsupported();
  }
  mockDeviceFold(): Promise<void> {
    unsupported();
  }
  mockDeviceUnfold(): Promise<void> {
    unsupported();
  }
  mockDeviceSetCameraFeed(): Promise<void> {
    unsupported();
  }
  mockDeviceSetCapturedImage(): Promise<void> {
    unsupported();
  }
  mockDeviceSetCameraFeedFromCamera(): Promise<void> {
    unsupported();
  }
  mockSetPermissionStatus(): Promise<void> {
    unsupported();
  }
  mockSetPermissionRequestResult(): Promise<void> {
    unsupported();
  }
}

/** Web module — all methods throw "not supported". */
export const EMWDATModule = registerWebModule(EMWDATWebModule, "EMWDAT");

// =============================================================================
// Wrapper functions (matching EMWDATModule.ts exports — all throw on web)
// =============================================================================

export function addListener(): null {
  return null;
}

export function setLogLevel(): void {
  unsupported();
}
export async function configure(): Promise<void> {
  unsupported();
}
export function getRegistrationState(): never {
  unsupported();
}
export async function getRegistrationStateAsync(): Promise<never> {
  unsupported();
}
export async function startRegistration(): Promise<void> {
  unsupported();
}
export async function startUnregistration(): Promise<void> {
  unsupported();
}
export async function handleUrl(): Promise<never> {
  unsupported();
}
export async function checkPermissionStatus(): Promise<never> {
  unsupported();
}
export async function requestPermission(): Promise<never> {
  unsupported();
}
export async function getDevices(): Promise<never[]> {
  unsupported();
}
export async function getDevice(): Promise<null> {
  unsupported();
}

// Session-based streaming
export async function createSession(): Promise<never> {
  unsupported();
}
export async function startSession(): Promise<void> {
  unsupported();
}
export async function stopSession(): Promise<void> {
  unsupported();
}
export async function addStreamToSession(): Promise<void> {
  unsupported();
}
export async function removeStreamFromSession(): Promise<void> {
  unsupported();
}
export async function capturePhoto(): Promise<void> {
  unsupported();
}

// Mock device kit
export async function enableMockDeviceKit(): Promise<void> {
  unsupported();
}
export async function disableMockDeviceKit(): Promise<void> {
  unsupported();
}
export async function isMockDeviceKitEnabled(): Promise<never> {
  unsupported();
}
export async function pairMockDevice(): Promise<never> {
  unsupported();
}
export async function unpairMockDevice(): Promise<void> {
  unsupported();
}
export async function getMockDevices(): Promise<never> {
  unsupported();
}
export async function mockDevicePowerOn(): Promise<void> {
  unsupported();
}
export async function mockDevicePowerOff(): Promise<void> {
  unsupported();
}
export async function mockDeviceDon(): Promise<void> {
  unsupported();
}
export async function mockDeviceDoff(): Promise<void> {
  unsupported();
}
export async function mockDeviceFold(): Promise<void> {
  unsupported();
}
export async function mockDeviceUnfold(): Promise<void> {
  unsupported();
}
export async function mockDeviceSetCameraFeed(): Promise<void> {
  unsupported();
}
export async function mockDeviceSetCapturedImage(): Promise<void> {
  unsupported();
}
export async function mockDeviceSetCameraFeedFromCamera(): Promise<void> {
  unsupported();
}
export async function mockSetPermissionStatus(): Promise<void> {
  unsupported();
}
export async function mockSetPermissionRequestResult(): Promise<void> {
  unsupported();
}
