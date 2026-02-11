import { useCallback, useEffect, useRef, useState } from "react";

import type {
  Device,
  DeviceIdentifier,
  LogLevel,
  Permission,
  PermissionStatus,
  PhotoCaptureFormat,
  RegistrationState,
  StreamSessionConfig,
  StreamSessionError,
  StreamSessionState,
  UseMetaWearablesOptions,
  UseMetaWearablesReturn,
} from "./EMWDAT.types";
import {
  addListener,
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
} from "./EMWDATModule";

/**
 * React hook for interacting with Meta Wearables glasses.
 *
 * Provides state management, event handling, and validated actions
 * for registration, permissions, device management, video streaming,
 * and photo capture.
 *
 * @example
 * ```tsx
 * const {
 *   isConfigured,
 *   registrationState,
 *   devices,
 *   streamState,
 *   startRegistration,
 *   startStream,
 *   capturePhoto,
 * } = useMetaWearables({
 *   onRegistrationStateChange: (state) => console.log('Registration:', state),
 *   onPhotoCaptured: (photo) => console.log('Photo saved:', photo.filePath),
 * });
 * ```
 */
export function useMetaWearables(options: UseMetaWearablesOptions = {}): UseMetaWearablesReturn {
  const { autoConfig = true, logLevel = "info", ...callbacks } = options;

  // ---------------------------------------------------------------------------
  // Refs — used for guards & callbacks to avoid stale closures
  // ---------------------------------------------------------------------------

  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const isConfiguredRef = useRef(false);
  const registrationStateRef = useRef<RegistrationState>("unavailable");
  const permissionStatusRef = useRef<PermissionStatus>("denied");
  const streamStateRef = useRef<StreamSessionState>("stopped");

  // ---------------------------------------------------------------------------
  // State — drives re-renders
  // ---------------------------------------------------------------------------

  const [isConfigured, setIsConfigured] = useState(false);
  const [registrationState, setRegistrationState] = useState<RegistrationState>("unavailable");
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("denied");
  const [devices, setDevices] = useState<Device[]>([]);
  const [streamState, setStreamState] = useState<StreamSessionState>("stopped");
  const [lastError, setLastError] = useState<StreamSessionError | null>(null);

  // Sync helpers — update both ref and state
  const syncIsConfigured = useCallback((v: boolean) => {
    isConfiguredRef.current = v;
    setIsConfigured(v);
  }, []);

  const syncRegistrationState = useCallback((v: RegistrationState) => {
    registrationStateRef.current = v;
    setRegistrationState(v);
  }, []);

  const syncPermissionStatus = useCallback((v: PermissionStatus) => {
    permissionStatusRef.current = v;
    setPermissionStatus(v);
  }, []);

  const syncStreamState = useCallback((v: StreamSessionState) => {
    streamStateRef.current = v;
    setStreamState(v);
  }, []);

  // ---------------------------------------------------------------------------
  // Event subscriptions — single effect, empty deps (refs keep values fresh)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const subs = [
      addListener("onRegistrationStateChange", (e) => {
        syncRegistrationState(e.state);
        callbacksRef.current.onRegistrationStateChange?.(e.state);

        // Auto-sync permission status on registration change
        if (e.state === "registered") {
          nativeCheckPermissionStatus("camera")
            .then((status) => syncPermissionStatus(status))
            .catch(() => syncPermissionStatus("denied"));
        } else {
          syncPermissionStatus("denied");
        }
      }),

      addListener("onDevicesChange", (e) => {
        setDevices(e.devices);
        callbacksRef.current.onDevicesChange?.(e.devices);
      }),

      addListener("onLinkStateChange", (e) => {
        callbacksRef.current.onLinkStateChange?.(e.deviceId, e.linkState);
      }),

      addListener("onStreamStateChange", (e) => {
        syncStreamState(e.state);
        callbacksRef.current.onStreamStateChange?.(e.state);
      }),

      addListener("onVideoFrame", (e) => {
        callbacksRef.current.onVideoFrame?.(e);
      }),

      addListener("onPhotoCaptured", (e) => {
        callbacksRef.current.onPhotoCaptured?.(e);
      }),

      addListener("onStreamError", (e) => {
        setLastError(e);
        callbacksRef.current.onStreamError?.(e);

        // Auto-stop stream on error, then reset state
        nativeStopStream()
          .catch(() => {})
          .finally(() => syncStreamState("stopped"));
      }),

      addListener("onPermissionStatusChange", (e) => {
        if (e.permission === "camera") {
          syncPermissionStatus(e.status);
        }
        callbacksRef.current.onPermissionStatusChange?.(e.permission, e.status);
      }),
    ];

    return () => {
      subs.forEach((sub) => sub?.remove());
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Actions — stable references (guards use refs, not state)
  // ---------------------------------------------------------------------------

  const configure = useCallback(async () => {
    if (isConfiguredRef.current) {
      console.warn("[useMetaWearables] SDK already configured");
      return;
    }

    nativeSetLogLevel(logLevel);
    await nativeConfigure();
    syncIsConfigured(true);

    // Sync initial state
    const [regState, deviceList, streamSt] = await Promise.all([
      nativeGetRegistrationStateAsync(),
      nativeGetDevices(),
      nativeGetStreamState(),
    ]);

    syncRegistrationState(regState);
    setDevices(deviceList);
    syncStreamState(streamSt);
  }, [logLevel, syncIsConfigured, syncRegistrationState, syncStreamState]);

  // Auto-configure on mount
  useEffect(() => {
    if (autoConfig) {
      configure().catch((err) => {
        console.error("[useMetaWearables] Auto-configure failed:", err);
      });
    }
  }, []);

  const setLogLevelAction = useCallback((level: LogLevel) => {
    nativeSetLogLevel(level);
  }, []);

  const startRegistration = useCallback(async () => {
    if (!isConfiguredRef.current) {
      throw new Error("SDK not configured. Call configure() first.");
    }
    if (registrationStateRef.current === "registering") {
      console.warn("[useMetaWearables] Already registering");
      return;
    }
    await nativeStartRegistration();
  }, []);

  const startUnregistration = useCallback(async () => {
    if (!isConfiguredRef.current) {
      throw new Error("SDK not configured. Call configure() first.");
    }
    await nativeStartUnregistration();
  }, []);

  const checkPermissionStatusAction = useCallback(
    async (permission: Permission): Promise<PermissionStatus> => {
      if (!isConfiguredRef.current) {
        return "denied";
      }
      const status = await nativeCheckPermissionStatus(permission);
      if (permission === "camera") {
        syncPermissionStatus(status);
      }
      return status;
    },
    [syncPermissionStatus]
  );

  const requestPermissionAction = useCallback(
    async (permission: Permission): Promise<PermissionStatus> => {
      if (!isConfiguredRef.current) {
        throw new Error("SDK not configured. Call configure() first.");
      }
      if (registrationStateRef.current !== "registered") {
        throw new Error("Must be registered before requesting permissions.");
      }
      return nativeRequestPermission(permission);
    },
    []
  );

  const getDevice = useCallback(async (identifier: DeviceIdentifier): Promise<Device | null> => {
    return nativeGetDevice(identifier);
  }, []);

  const refreshDevices = useCallback(async (): Promise<Device[]> => {
    if (!isConfiguredRef.current) {
      throw new Error("SDK not configured. Call configure() first.");
    }
    const deviceList = await nativeGetDevices();
    setDevices(deviceList);
    return deviceList;
  }, []);

  const startStream = useCallback(async (config?: Partial<StreamSessionConfig>) => {
    if (!isConfiguredRef.current) {
      throw new Error("SDK not configured. Call configure() first.");
    }
    if (registrationStateRef.current !== "registered") {
      throw new Error("Must be registered before streaming.");
    }
    if (permissionStatusRef.current !== "granted") {
      throw new Error("Camera permission required for streaming.");
    }
    if (streamStateRef.current === "streaming" || streamStateRef.current === "starting") {
      throw new Error("Stream already active.");
    }
    await nativeStartStream(config);
  }, []);

  const stopStream = useCallback(async () => {
    if (streamStateRef.current === "stopped") {
      return;
    }
    await nativeStopStream();
  }, []);

  const capturePhoto = useCallback(async (format?: PhotoCaptureFormat) => {
    if (streamStateRef.current !== "streaming") {
      throw new Error("Cannot capture photo — stream is not active.");
    }
    await nativeCapturePhoto(format);
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // State
    isConfigured,
    registrationState,
    permissionStatus,
    devices,
    streamState,
    lastError,

    // Actions
    configure,
    setLogLevel: setLogLevelAction,
    startRegistration,
    startUnregistration,
    checkPermissionStatus: checkPermissionStatusAction,
    requestPermission: requestPermissionAction,
    getDevice,
    refreshDevices,
    startStream,
    stopStream,
    capturePhoto,
  };
}
