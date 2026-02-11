import { NativeModule, requireNativeModule } from "expo";
import { Platform } from "react-native";

import type {
  Device,
  EMWDATModuleEvents,
  LogLevel,
  Permission,
  PermissionStatus,
  PhotoCaptureFormat,
  RegistrationState,
  StreamSessionConfig,
  StreamSessionState,
} from "./EMWDAT.types";

/**
 * Raw native module interface.
 * Uses string types for enum params/returns — wrapper functions cast to typed unions.
 */
declare class EMWDATNativeModule extends NativeModule<EMWDATModuleEvents> {
  setLogLevel(level: string): void;
  configure(): Promise<void>;
  getRegistrationState(): string;
  getRegistrationStateAsync(): Promise<string>;
  startRegistration(): Promise<void>;
  startUnregistration(): Promise<void>;
  handleUrl(url: string): Promise<boolean>;
  checkPermissionStatus(permission: string): Promise<string>;
  requestPermission(permission: string): Promise<string>;
  getDevices(): Promise<Device[]>;
  getDevice(identifier: string): Promise<Device | null>;
  getStreamState(): Promise<string>;
  startStream(config: Partial<StreamSessionConfig>): Promise<void>;
  stopStream(): Promise<void>;
  capturePhoto(format: string): Promise<void>;
}

/** The native EMWDAT module instance. */
export const EMWDATModule = requireNativeModule<EMWDATNativeModule>("EMWDAT");

// =============================================================================
// Typed wrapper functions
// =============================================================================

export function addListener<E extends keyof EMWDATModuleEvents>(
  eventName: E,
  listener: EMWDATModuleEvents[E]
): { remove: () => void } | null {
  if (Platform.OS !== "ios") {
    console.warn("[EMWDAT] Events are only supported on iOS");
    return null;
  }
  return EMWDATModule.addListener(eventName, listener);
}

export function setLogLevel(level: LogLevel): void {
  EMWDATModule.setLogLevel(level);
}

export async function configure(): Promise<void> {
  return EMWDATModule.configure();
}

export function getRegistrationState(): RegistrationState {
  return EMWDATModule.getRegistrationState() as RegistrationState;
}

export async function getRegistrationStateAsync(): Promise<RegistrationState> {
  return (await EMWDATModule.getRegistrationStateAsync()) as RegistrationState;
}

export async function startRegistration(): Promise<void> {
  return EMWDATModule.startRegistration();
}

export async function startUnregistration(): Promise<void> {
  return EMWDATModule.startUnregistration();
}

export async function handleUrl(url: string): Promise<boolean> {
  return EMWDATModule.handleUrl(url);
}

export async function checkPermissionStatus(permission: Permission): Promise<PermissionStatus> {
  return (await EMWDATModule.checkPermissionStatus(permission)) as PermissionStatus;
}

export async function requestPermission(permission: Permission): Promise<PermissionStatus> {
  return (await EMWDATModule.requestPermission(permission)) as PermissionStatus;
}

export async function getDevices(): Promise<Device[]> {
  return EMWDATModule.getDevices();
}

export async function getDevice(identifier: string): Promise<Device | null> {
  return EMWDATModule.getDevice(identifier);
}

export async function getStreamState(): Promise<StreamSessionState> {
  return (await EMWDATModule.getStreamState()) as StreamSessionState;
}

export async function startStream(config?: Partial<StreamSessionConfig>): Promise<void> {
  return EMWDATModule.startStream(config ?? {});
}

export async function stopStream(): Promise<void> {
  return EMWDATModule.stopStream();
}

export async function capturePhoto(format?: PhotoCaptureFormat): Promise<void> {
  return EMWDATModule.capturePhoto(format ?? "jpeg");
}
