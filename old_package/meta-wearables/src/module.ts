import { requireNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

import type {
  LogLevel,
  RegistrationState,
  Permission,
  PermissionStatus,
  Device,
  StreamSessionConfig,
  StreamSessionState,
  PhotoCaptureFormat,
} from "./types";

/**
 * Event subscription that can be removed
 */
export interface EventSubscription {
  remove: () => void;
}

/**
 * Native module interface for Meta Wearables
 * As of Expo SDK 52, native modules are already EventEmitters
 */
interface MetaWearablesModuleInterface {
  // Events (built-in to Expo modules)
  addListener(eventName: string, listener: (event: unknown) => void): EventSubscription;

  // Logging
  setLogLevel(level: string): void;

  // Configuration
  configure(): Promise<void>;

  // Registration
  getRegistrationState(): string;
  getRegistrationStateAsync(): Promise<string>;
  startRegistration(): Promise<void>;
  startUnregistration(): Promise<void>;

  // Permissions
  checkPermissionStatus(permission: string): Promise<string>;
  requestPermission(permission: string): Promise<string>;

  // Devices
  getDevices(): Promise<Device[]>;
  getDevice(identifier: string): Promise<Device | null>;

  // Streaming
  getStreamState(): Promise<string>;
  startStream(config: Partial<StreamSessionConfig>): Promise<void>;
  stopStream(): Promise<void>;

  // Photo capture
  capturePhoto(format: string): Promise<void>;
}

/**
 * The native Meta Wearables module
 * As of Expo SDK 52, the module is already an EventEmitter
 */
export const MetaWearablesModule =
  requireNativeModule<MetaWearablesModuleInterface>("MetaWearables");

/**
 * Subscribe to a Meta Wearables event
 */
export function addListener(
  eventName: string,
  listener: (event: unknown) => void
): EventSubscription | null {
  if (Platform.OS !== "ios") {
    console.warn("[MetaWearables] Events not supported on this platform");
    return null;
  }
  return MetaWearablesModule.addListener(eventName, listener);
}

// =============================================================================
// Typed wrapper functions
// =============================================================================

/**
 * Set the logging level for the Meta Wearables module
 */
export function setLogLevel(level: LogLevel): void {
  MetaWearablesModule.setLogLevel(level);
}

/**
 * Configure the Meta Wearables SDK. Must be called once before using other methods.
 */
export async function configure(): Promise<void> {
  return MetaWearablesModule.configure();
}

/**
 * Get the current registration state (sync - returns cached value)
 */
export function getRegistrationState(): RegistrationState {
  return MetaWearablesModule.getRegistrationState() as RegistrationState;
}

/**
 * Get the current registration state (async - returns current value)
 */
export async function getRegistrationStateAsync(): Promise<RegistrationState> {
  const result = await MetaWearablesModule.getRegistrationStateAsync();
  return result as RegistrationState;
}

/**
 * Start the registration flow with the Meta AI app
 */
export async function startRegistration(): Promise<void> {
  return MetaWearablesModule.startRegistration();
}

/**
 * Start the unregistration flow
 */
export async function startUnregistration(): Promise<void> {
  return MetaWearablesModule.startUnregistration();
}

/**
 * Check the current permission status for a permission type
 */
export async function checkPermissionStatus(permission: Permission): Promise<PermissionStatus> {
  const result = await MetaWearablesModule.checkPermissionStatus(permission);
  return result as PermissionStatus;
}

/**
 * Request a permission from the user
 */
export async function requestPermission(permission: Permission): Promise<PermissionStatus> {
  const result = await MetaWearablesModule.requestPermission(permission);
  return result as PermissionStatus;
}

/**
 * Get the list of available devices
 */
export async function getDevices(): Promise<Device[]> {
  return MetaWearablesModule.getDevices();
}

/**
 * Get a specific device by identifier
 */
export async function getDevice(identifier: string): Promise<Device | null> {
  return MetaWearablesModule.getDevice(identifier);
}

/**
 * Get the current stream session state
 */
export async function getStreamState(): Promise<StreamSessionState> {
  const result = await MetaWearablesModule.getStreamState();
  return result as StreamSessionState;
}

/**
 * Start a video stream with the given configuration
 */
export async function startStream(config: Partial<StreamSessionConfig>): Promise<void> {
  return MetaWearablesModule.startStream(config);
}

/**
 * Stop the current video stream
 */
export async function stopStream(): Promise<void> {
  return MetaWearablesModule.stopStream();
}

/**
 * Capture a photo during an active stream
 */
export async function capturePhoto(format: PhotoCaptureFormat): Promise<void> {
  return MetaWearablesModule.capturePhoto(format);
}
