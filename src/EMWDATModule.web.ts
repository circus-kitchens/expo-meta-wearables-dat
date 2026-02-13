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
  getStreamState(): Promise<string> {
    unsupported();
  }
  startStream(): Promise<void> {
    unsupported();
  }
  stopStream(): Promise<void> {
    unsupported();
  }
  capturePhoto(): Promise<void> {
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
export async function getStreamState(): Promise<never> {
  unsupported();
}
export async function startStream(): Promise<void> {
  unsupported();
}
export async function stopStream(): Promise<void> {
  unsupported();
}
export async function capturePhoto(): Promise<void> {
  unsupported();
}
