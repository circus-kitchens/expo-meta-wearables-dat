import { useCallback, useEffect, useRef, useState } from "react";

import {
  addListener,
  type EventSubscription,
  capturePhoto as nativeCapturePhoto,
  checkPermissionStatus as nativeCheckPermissionStatus,
  configure as nativeConfigure,
  getDevice as nativeGetDevice,
  getDevices as nativeGetDevices,
  getRegistrationStateAsync as nativeGetRegistrationStateAsync,
  getStreamState as nativeGetStreamState,
  requestPermission as nativeRequestPermission,
  setLogLevel as nativeSetLogLevel,
  startRegistration as nativeStartRegistration,
  startStream as nativeStartStream,
  startUnregistration as nativeStartUnregistration,
  stopStream as nativeStopStream,
} from "./module";
import {
  Device,
  DeviceIdentifier,
  LinkState,
  LogLevel,
  MetaWearablesCallbacks,
  MetaWearablesError,
  MetaWearablesEvents,
  Permission,
  PermissionStatus,
  PhotoCaptureFormat,
  PhotoData,
  RegistrationState,
  StreamSessionConfig,
  StreamSessionState,
} from "./types";

/**
 * Options for the useMetaWearables hook
 */
export interface UseMetaWearablesOptions extends MetaWearablesCallbacks {
  /**
   * Whether to automatically configure the SDK on mount.
   * Set to false if you want to call configure() manually.
   * @default true
   */
  autoConfig?: boolean;

  /**
   * Log level for the module.
   * @default LogLevel.Info
   */
  logLevel?: LogLevel;
}

/**
 * Return type for the useMetaWearables hook
 */
export interface UseMetaWearablesReturn {
  // State
  /** Whether the SDK has been configured */
  isConfigured: boolean;
  /** Current registration state */
  registrationState: RegistrationState;
  /** Current permission status for camera */
  permissionStatus: PermissionStatus;
  /** List of available devices */
  devices: Device[];
  /** Current stream session state */
  streamState: StreamSessionState;
  /** Last error that occurred */
  lastError: MetaWearablesError | null;

  // Configuration
  /** Configure the SDK (if autoConfig is false) */
  configure: () => Promise<void>;
  /** Set the log level */
  setLogLevel: (level: LogLevel) => void;

  // Registration
  /** Start the registration flow with Meta AI app */
  startRegistration: () => Promise<void>;
  /** Start the unregistration flow */
  startUnregistration: () => Promise<void>;

  // Permissions
  /** Check the current permission status */
  checkPermissionStatus: (permission: Permission) => Promise<PermissionStatus>;
  /** Request a permission from the user */
  requestPermission: (permission: Permission) => Promise<PermissionStatus>;

  // Devices
  /** Get a device by identifier */
  getDevice: (identifier: DeviceIdentifier) => Promise<Device | null>;
  /** Refresh the devices list */
  refreshDevices: () => Promise<Device[] | undefined>;

  // Streaming
  /** Start video streaming with the given configuration */
  startStream: (config?: Partial<StreamSessionConfig>) => Promise<void>;
  /** Stop the current video stream */
  stopStream: () => Promise<void>;

  // Photo Capture
  /** Capture a photo during an active stream */
  capturePhoto: (format?: PhotoCaptureFormat) => Promise<void>;
}

/**
 * React hook for interacting with Meta Wearables glasses.
 *
 * Provides a clean API for registration, permissions, device management,
 * video streaming, and photo capture with automatic state management
 * and event handling.
 *
 * @example
 * ```tsx
 * function GlassesView() {
 *   const {
 *     isConfigured,
 *     registrationState,
 *     devices,
 *     streamState,
 *     startRegistration,
 *     startStream,
 *     capturePhoto,
 *   } = useMetaWearables({
 *     onRegistrationStateChange: (state) => console.log('Registration:', state),
 *     onPhotoCaptured: (photo) => console.log('Photo saved:', photo.filePath),
 *   });
 *
 *   if (!isConfigured) return <Text>Loading...</Text>;
 *   if (registrationState !== RegistrationState.Registered) {
 *     return <Button onPress={startRegistration} title="Connect Glasses" />;
 *   }
 *
 *   return (
 *     <View style={{ flex: 1 }}>
 *       <MetaWearablesStreamView
 *         isActive={streamState === StreamSessionState.Streaming}
 *         style={{ flex: 1 }}
 *       />
 *       <Button onPress={capturePhoto} title="Take Photo" />
 *     </View>
 *   );
 * }
 * ```
 */
export function useMetaWearables(options: UseMetaWearablesOptions = {}): UseMetaWearablesReturn {
  const {
    autoConfig = true,
    logLevel = "info",
    onRegistrationStateChange,
    onDevicesChange,
    onDeviceLinkStateChange,
    onStreamStateChange,
    onStreamError,
    onPhotoCaptured,
    onPermissionStatusChange,
  } = options;

  // Store callbacks in refs to avoid re-subscriptions
  const callbacksRef = useRef({
    onRegistrationStateChange,
    onDevicesChange,
    onDeviceLinkStateChange,
    onStreamStateChange,
    onStreamError,
    onPhotoCaptured,
    onPermissionStatusChange,
  });

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onRegistrationStateChange,
      onDevicesChange,
      onDeviceLinkStateChange,
      onStreamStateChange,
      onStreamError,
      onPhotoCaptured,
      onPermissionStatusChange,
    };
  }, [
    onRegistrationStateChange,
    onDevicesChange,
    onDeviceLinkStateChange,
    onStreamStateChange,
    onStreamError,
    onPhotoCaptured,
    onPermissionStatusChange,
  ]);

  // State
  const [isConfigured, setIsConfigured] = useState(false);
  const [registrationState, setRegistrationState] = useState<RegistrationState>("unavailable");
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("denied");
  const [devices, setDevices] = useState<Device[]>([]);
  const [streamState, setStreamState] = useState<StreamSessionState>("stopped");
  const [lastError, setLastError] = useState<MetaWearablesError | null>(null);

  // Event subscriptions ref
  const subscriptionsRef = useRef<(EventSubscription | null)[]>([]);

  // Configure SDK
  const configure = useCallback(async () => {
    if (isConfigured) {
      console.warn("[useMetaWearables] SDK already configured");
      return;
    }

    try {
      nativeSetLogLevel(logLevel);
      await nativeConfigure();
      setIsConfigured(true);

      // Sync initial state (all now async)
      const [regState, deviceList, streamSt] = await Promise.all([
        nativeGetRegistrationStateAsync(),
        nativeGetDevices(),
        nativeGetStreamState(),
      ]);
      setRegistrationState(regState);
      setDevices(deviceList);
      setStreamState(streamSt);
    } catch (error) {
      const err = error as Error;
      setLastError({
        code: "configurationFailed",
        message: err.message,
      });
      throw error;
    }
  }, [isConfigured, logLevel]);

  // Set up event listeners
  useEffect(() => {
    const subscriptions: (EventSubscription | null)[] = [];

    // Registration state changes
    subscriptions.push(
      addListener(MetaWearablesEvents.RegistrationStateChange, (event: unknown) => {
        const { state } = event as { state: RegistrationState };
        setRegistrationState(state);
        callbacksRef.current.onRegistrationStateChange?.(state);
        if (state === "registered") {
          // Sync permission status from native when registered
          nativeCheckPermissionStatus("camera")
            .then((status) => setPermissionStatus(status as PermissionStatus))
            .catch(() => {
              console.warn("[useMetaWearables] Failed to get permission status after registration");
              setPermissionStatus("denied");
            });
        } else {
          // Reset permission status when not registered (permissions get cleared on unregister)
          setPermissionStatus("denied");
        }
      })
    );

    // Devices changes
    subscriptions.push(
      addListener(MetaWearablesEvents.DevicesChange, (event: unknown) => {
        const { devices: newDevices } = event as { devices: Device[] };
        setDevices(newDevices);
        callbacksRef.current.onDevicesChange?.(newDevices);
      })
    );

    // Device link state changes
    subscriptions.push(
      addListener(MetaWearablesEvents.DeviceLinkStateChange, (event: unknown) => {
        const { deviceId, linkState } = event as {
          deviceId: DeviceIdentifier;
          linkState: LinkState;
        };
        callbacksRef.current.onDeviceLinkStateChange?.(deviceId, linkState);
      })
    );

    // Stream state changes
    subscriptions.push(
      addListener(MetaWearablesEvents.StreamStateChange, (event: unknown) => {
        const { state } = event as { state: StreamSessionState };
        setStreamState(state);
        callbacksRef.current.onStreamStateChange?.(state);
      })
    );

    // Stream errors
    subscriptions.push(
      addListener(MetaWearablesEvents.StreamError, (event: unknown) => {
        const { code, message } = event as { code: string; message: string };
        const error: MetaWearablesError = { code, message };
        setLastError(error);
        // Stop the native session so it can be restarted, then reset JS state
        nativeStopStream()
          .catch(() => {})
          .finally(() => setStreamState("stopped"));
        callbacksRef.current.onStreamError?.(error);
      })
    );

    // Photo captured
    subscriptions.push(
      addListener(MetaWearablesEvents.PhotoCaptured, (event: unknown) => {
        const { filePath, format, timestamp } = event as {
          filePath: string;
          format: string;
          timestamp: number;
        };
        const photo: PhotoData = {
          filePath,
          format: format as PhotoCaptureFormat,
          timestamp,
          width: 0,
          height: 0,
        };
        callbacksRef.current.onPhotoCaptured?.(photo);
      })
    );

    // Permission status changes
    subscriptions.push(
      addListener(MetaWearablesEvents.PermissionStatusChange, (event: unknown) => {
        const { permission, status } = event as {
          permission: Permission;
          status: PermissionStatus;
        };
        if (permission === "camera") {
          setPermissionStatus(status);
        }
        callbacksRef.current.onPermissionStatusChange?.(permission, status);
      })
    );

    subscriptionsRef.current = subscriptions;

    // Cleanup on unmount
    return () => {
      subscriptions.forEach((sub) => sub?.remove());
    };
  }, []);

  // Auto-configure on mount
  useEffect(() => {
    if (autoConfig && !isConfigured) {
      configure().catch((err) => {
        console.error("[useMetaWearables] Auto-configure failed:", err);
      });
    }
  }, [autoConfig, isConfigured, configure]);

  // Refresh devices list manually
  const refreshDevices = useCallback(async () => {
    if (!isConfigured) return;
    const deviceList = await nativeGetDevices();
    setDevices(deviceList);
    return deviceList;
  }, [isConfigured]);

  // Wrapped methods with state guards

  const startRegistration = useCallback(async () => {
    if (!isConfigured) {
      throw new Error("SDK not configured. Call configure() first.");
    }
    if (registrationState === "registering") {
      console.warn("[useMetaWearables] Already registering");
      return;
    }
    await nativeStartRegistration();
  }, [isConfigured, registrationState]);

  const startUnregistration = useCallback(async () => {
    if (!isConfigured) {
      throw new Error("SDK not configured. Call configure() first.");
    }
    await nativeStartUnregistration();
  }, [isConfigured]);

  const checkPermissionStatus = useCallback(
    async (permission: Permission): Promise<PermissionStatus> => {
      if (!isConfigured) {
        return "denied";
      }
      return nativeCheckPermissionStatus(permission);
    },
    [isConfigured]
  );

  const requestPermission = useCallback(
    async (permission: Permission): Promise<PermissionStatus> => {
      if (!isConfigured) {
        throw new Error("SDK not configured. Call configure() first.");
      }
      if (registrationState !== "registered") {
        throw new Error("Must be registered before requesting permissions.");
      }
      return nativeRequestPermission(permission);
    },
    [isConfigured, registrationState]
  );

  const getDevice = useCallback(async (identifier: DeviceIdentifier): Promise<Device | null> => {
    return nativeGetDevice(identifier);
  }, []);

  const startStream = useCallback(
    async (config?: Partial<StreamSessionConfig>) => {
      if (!isConfigured) {
        throw new Error("SDK not configured. Call configure() first.");
      }
      if (registrationState !== "registered") {
        throw new Error("Must be registered before streaming.");
      }
      if (permissionStatus !== "granted") {
        throw new Error("Camera permission required for streaming.");
      }
      if (streamState !== "stopped" && streamState !== "paused") {
        const error: MetaWearablesError = {
          code: "sessionAlreadyActive",
          message: "Stream session is already active",
        };
        setLastError(error);
        throw new Error(error.message);
      }

      const defaultConfig: StreamSessionConfig = {
        videoCodec: "raw",
        resolution: "low",
        frameRate: 15,
        ...config,
      };

      await nativeStartStream(defaultConfig);
    },
    [isConfigured, registrationState, permissionStatus, streamState]
  );

  const stopStream = useCallback(async () => {
    if (streamState === "stopped") {
      return;
    }
    await nativeStopStream();
  }, [streamState]);

  const capturePhoto = useCallback(
    async (format: PhotoCaptureFormat = "jpeg") => {
      if (streamState !== "streaming") {
        const error: MetaWearablesError = {
          code: "sessionNotActive",
          message: "Cannot capture photo - stream is not active",
        };
        setLastError(error);
        throw new Error(error.message);
      }
      await nativeCapturePhoto(format);
    },
    [streamState]
  );

  const setLogLevel = useCallback((level: LogLevel) => {
    nativeSetLogLevel(level);
  }, []);

  return {
    // State
    isConfigured,
    registrationState,
    permissionStatus,
    devices,
    streamState,
    lastError,

    // Configuration
    configure,
    setLogLevel,

    // Registration
    startRegistration,
    startUnregistration,

    // Permissions
    checkPermissionStatus,
    requestPermission,

    // Devices
    getDevice,
    refreshDevices,

    // Streaming
    startStream,
    stopStream,

    // Photo Capture
    capturePhoto,
  };
}
