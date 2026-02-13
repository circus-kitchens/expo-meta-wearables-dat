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

/**
 * Subscribe to a native SDK event. Returns a subscription handle, or `null` on non-iOS platforms.
 *
 * @param eventName - The event to listen for (e.g. `"onRegistrationStateChanged"`).
 * @param listener - Callback invoked when the event fires.
 */
export function addListener<E extends keyof EMWDATModuleEvents>(
  eventName: E,
  listener: EMWDATModuleEvents[E]
): { remove: () => void } | null {
  if (Platform.OS !== "ios") {
    return null;
  }
  return EMWDATModule.addListener(eventName, listener);
}

/** Set the native SDK log verbosity. */
export function setLogLevel(level: LogLevel): void {
  EMWDATModule.setLogLevel(level);
}

/** Initialize the Meta Wearables SDK. Must be called before any other SDK method. */
export async function configure(): Promise<void> {
  return EMWDATModule.configure();
}

/** Return the current registration state synchronously. */
export function getRegistrationState(): RegistrationState {
  return EMWDATModule.getRegistrationState() as RegistrationState;
}

/** Return the current registration state asynchronously. */
export async function getRegistrationStateAsync(): Promise<RegistrationState> {
  return (await EMWDATModule.getRegistrationStateAsync()) as RegistrationState;
}

/** Begin the device registration flow. Opens the Meta AI companion app. */
export async function startRegistration(): Promise<void> {
  return EMWDATModule.startRegistration();
}

/** Unregister the current device from the SDK. */
export async function startUnregistration(): Promise<void> {
  return EMWDATModule.startUnregistration();
}

/** Handle a deep-link URL callback from the Meta AI companion app. Returns `true` if the URL was consumed. */
export async function handleUrl(url: string): Promise<boolean> {
  return EMWDATModule.handleUrl(url);
}

/** Check the current status of a permission without prompting the user. */
export async function checkPermissionStatus(permission: Permission): Promise<PermissionStatus> {
  return (await EMWDATModule.checkPermissionStatus(permission)) as PermissionStatus;
}

/** Request a permission from the user. Returns the resulting status. */
export async function requestPermission(permission: Permission): Promise<PermissionStatus> {
  return (await EMWDATModule.requestPermission(permission)) as PermissionStatus;
}

/** Return all registered Meta Wearables devices. */
export async function getDevices(): Promise<Device[]> {
  return EMWDATModule.getDevices();
}

/** Return a specific device by its identifier, or `null` if not found. */
export async function getDevice(identifier: string): Promise<Device | null> {
  return EMWDATModule.getDevice(identifier);
}

/** Return the current stream session state. */
export async function getStreamState(): Promise<StreamSessionState> {
  return (await EMWDATModule.getStreamState()) as StreamSessionState;
}

/** Start a camera stream session with the given configuration. Defaults apply for omitted fields. */
export async function startStream(config?: Partial<StreamSessionConfig>): Promise<void> {
  return EMWDATModule.startStream(config ?? {});
}

/** Stop the active stream session. */
export async function stopStream(): Promise<void> {
  return EMWDATModule.stopStream();
}

/** Capture a photo from the active stream. Defaults to JPEG format. */
export async function capturePhoto(format?: PhotoCaptureFormat): Promise<void> {
  return EMWDATModule.capturePhoto(format ?? "jpeg");
}
