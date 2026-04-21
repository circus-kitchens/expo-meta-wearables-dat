import { useCallback, useEffect, useRef, useState } from "react";

import type {
  CameraFacing,
  CapabilityState,
  Compatibility,
  Device,
  DeviceIdentifier,
  DeviceSessionErrorCode,
  DeviceSessionState,
  LogLevel,
  MockDeviceKitConfig,
  Permission,
  PermissionStatus,
  PhotoCaptureFormat,
  RegistrationState,
  StreamSessionConfig,
  UseMetaWearablesOptions,
  UseMetaWearablesReturn,
} from "./EMWDAT.types";
import {
  addListener,
  addStreamToSession as nativeAddStreamToSession,
  capturePhoto as nativeCapturePhoto,
  checkPermissionStatus as nativeCheckPermissionStatus,
  configure as nativeConfigure,
  createSession as nativeCreateSession,
  disableMockDeviceKit as nativeDisableMockDeviceKit,
  enableMockDeviceKit as nativeEnableMockDeviceKit,
  getDevice as nativeGetDevice,
  getDevices as nativeGetDevices,
  getRegistrationStateAsync as nativeGetRegistrationStateAsync,
  isMockDeviceKitEnabled as nativeIsMockDeviceKitEnabled,
  mockDeviceSetCameraFeedFromCamera as nativeMockDeviceSetCameraFeedFromCamera,
  mockSetPermissionRequestResult as nativeMockSetPermissionRequestResult,
  mockSetPermissionStatus as nativeMockSetPermissionStatus,
  pairMockDevice as nativePairMockDevice,
  removeStreamFromSession as nativeRemoveStreamFromSession,
  requestPermission as nativeRequestPermission,
  setLogLevel as nativeSetLogLevel,
  startRegistration as nativeStartRegistration,
  startSession as nativeStartSession,
  startUnregistration as nativeStartUnregistration,
  stopSession as nativeStopSession,
  unpairMockDevice as nativeUnpairMockDevice,
} from "./EMWDATModule";

/**
 * React hook for interacting with Meta Wearables glasses.
 *
 * Provides state management, event handling, and validated actions
 * for registration, permissions, device management, session-based
 * video streaming, and photo capture.
 *
 * @example
 * ```tsx
 * const {
 *   isConfigured,
 *   registrationState,
 *   devices,
 *   createSession,
 *   startSession,
 *   addStreamToSession,
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

  // ---------------------------------------------------------------------------
  // State — drives re-renders
  // ---------------------------------------------------------------------------

  const [isConfigured, setIsConfigured] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [configError, setConfigError] = useState<Error | null>(null);
  const [registrationState, setRegistrationState] = useState<RegistrationState>("unavailable");
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("denied");
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceSessionStates, setDeviceSessionStates] = useState<
    Record<string, DeviceSessionState>
  >({});
  const [deviceSessionErrors, setDeviceSessionErrors] = useState<
    Record<string, { error: DeviceSessionErrorCode; message?: string }>
  >({});
  const [capabilityStates, setCapabilityStates] = useState<Record<string, CapabilityState>>({});

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

  // ---------------------------------------------------------------------------
  // Event subscriptions — single effect, empty deps (refs keep values fresh)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const subs = [
      addListener("onRegistrationStateChange", (e) => {
        syncRegistrationState(e.state);
        callbacksRef.current.onRegistrationStateChange?.(e.state);

        // Auto-sync permission and devices on registration change
        if (e.state === "registered") {
          nativeCheckPermissionStatus("camera")
            .then((status) => syncPermissionStatus(status))
            .catch(() => syncPermissionStatus("denied"));
          nativeGetDevices()
            .then((deviceList) => setDevices(deviceList))
            .catch(() => {});
        } else {
          syncPermissionStatus("denied");
          setDeviceSessionStates({});
          setDeviceSessionErrors({});
          setCapabilityStates({});
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
        callbacksRef.current.onStreamStateChange?.(e.state);
      }),

      addListener("onVideoFrame", (e) => {
        callbacksRef.current.onVideoFrame?.(e);
      }),

      addListener("onPhotoCaptured", (e) => {
        callbacksRef.current.onPhotoCaptured?.(e);
      }),

      addListener("onStreamError", (e) => {
        callbacksRef.current.onStreamError?.(e);
      }),

      addListener("onPermissionStatusChange", (e) => {
        if (e.permission === "camera") {
          syncPermissionStatus(e.status);
        }
        callbacksRef.current.onPermissionStatusChange?.(e.permission, e.status);
      }),

      addListener("onCompatibilityChange", (e) => {
        setDevices((prev) =>
          prev.map((d) =>
            d.identifier === e.deviceId
              ? { ...d, compatibility: e.compatibility as Compatibility }
              : d
          )
        );
        callbacksRef.current.onCompatibilityChange?.(e.deviceId, e.compatibility as Compatibility);
      }),

      addListener("onDeviceSessionStateChange", (e) => {
        setDeviceSessionStates((prev) => ({
          ...prev,
          [e.sessionId]: e.state,
        }));
        callbacksRef.current.onDeviceSessionStateChange?.(e.sessionId, e.state);

        // Clean up stopped sessions from state
        if (e.state === "stopped") {
          setDeviceSessionStates((prev) => {
            const next = { ...prev };
            delete next[e.sessionId];
            return next;
          });
          setDeviceSessionErrors((prev) => {
            const next = { ...prev };
            delete next[e.sessionId];
            return next;
          });
          setCapabilityStates((prev) => {
            const next = { ...prev };
            delete next[e.sessionId];
            return next;
          });
        }
      }),

      addListener("onDeviceSessionError", (e) => {
        setDeviceSessionErrors((prev) => ({
          ...prev,
          [e.sessionId]: { error: e.error, message: e.message },
        }));
        callbacksRef.current.onDeviceSessionError?.(e.sessionId, e.error, e.message);
      }),

      addListener("onCapabilityStateChange", (e) => {
        setCapabilityStates((prev) => ({
          ...prev,
          [e.sessionId]: e.state,
        }));
        callbacksRef.current.onCapabilityStateChange?.(e.sessionId, e.state);
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
      return;
    }

    setIsConfiguring(true);
    setConfigError(null);

    try {
      nativeSetLogLevel(logLevel);
      await nativeConfigure();
      syncIsConfigured(true);

      // Sync initial state
      const [regState, deviceList] = await Promise.all([
        nativeGetRegistrationStateAsync(),
        nativeGetDevices(),
      ]);

      syncRegistrationState(regState);
      setDevices(deviceList);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setConfigError(error);
      throw error;
    } finally {
      setIsConfiguring(false);
    }
  }, [logLevel, syncIsConfigured, syncRegistrationState]);

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

  // ---------------------------------------------------------------------------
  // Session-based streaming actions
  // ---------------------------------------------------------------------------

  const createSession = useCallback(async (deviceId?: DeviceIdentifier): Promise<string> => {
    if (!isConfiguredRef.current) {
      throw new Error("SDK not configured. Call configure() first.");
    }
    if (registrationStateRef.current !== "registered") {
      throw new Error("Must be registered before creating a session.");
    }
    return nativeCreateSession(deviceId);
  }, []);

  const startSession = useCallback(async (sessionId: string): Promise<void> => {
    await nativeStartSession(sessionId);
  }, []);

  const stopSession = useCallback(async (sessionId: string): Promise<void> => {
    await nativeStopSession(sessionId);
  }, []);

  const addStreamToSession = useCallback(
    async (sessionId: string, config?: Partial<StreamSessionConfig>): Promise<void> => {
      // Verify camera permission before adding stream
      const status = await nativeCheckPermissionStatus("camera");
      if (status !== "granted") {
        const requested = await nativeRequestPermission("camera");
        syncPermissionStatus(requested as PermissionStatus);
        if (requested !== "granted") {
          throw new Error("Camera permission required for streaming.");
        }
      } else {
        syncPermissionStatus("granted");
      }
      await nativeAddStreamToSession(sessionId, config);
    },
    [syncPermissionStatus]
  );

  const removeStreamFromSession = useCallback(async (sessionId: string): Promise<void> => {
    await nativeRemoveStreamFromSession(sessionId);
  }, []);

  const capturePhoto = useCallback(async (format?: PhotoCaptureFormat) => {
    await nativeCapturePhoto(format);
  }, []);

  // ---------------------------------------------------------------------------
  // Mock device kit actions
  // ---------------------------------------------------------------------------

  const enableMockDeviceKit = useCallback(async (config?: MockDeviceKitConfig): Promise<void> => {
    await nativeEnableMockDeviceKit(config);
  }, []);

  const disableMockDeviceKit = useCallback(async (): Promise<void> => {
    await nativeDisableMockDeviceKit();
  }, []);

  const isMockDeviceKitEnabled = useCallback(async (): Promise<boolean> => {
    return nativeIsMockDeviceKitEnabled();
  }, []);

  const pairMockDevice = useCallback(async (): Promise<string> => {
    return nativePairMockDevice();
  }, []);

  const unpairMockDevice = useCallback(async (deviceId: string): Promise<void> => {
    await nativeUnpairMockDevice(deviceId);
  }, []);

  const mockSetPermissionStatusAction = useCallback(
    async (permission: Permission, status: PermissionStatus): Promise<void> => {
      await nativeMockSetPermissionStatus(permission, status);
    },
    []
  );

  const mockSetPermissionRequestResultAction = useCallback(
    async (permission: Permission, result: PermissionStatus): Promise<void> => {
      await nativeMockSetPermissionRequestResult(permission, result);
    },
    []
  );

  const mockDeviceSetCameraFeedFromCameraAction = useCallback(
    async (id: string, facing: CameraFacing): Promise<void> => {
      await nativeMockDeviceSetCameraFeedFromCamera(id, facing);
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // State
    isConfigured,
    isConfiguring,
    configError,
    registrationState,
    permissionStatus,
    devices,
    deviceSessionStates,
    deviceSessionErrors,
    capabilityStates,

    // Actions — configuration
    configure,
    setLogLevel: setLogLevelAction,

    // Actions — registration
    startRegistration,
    startUnregistration,

    // Actions — permissions
    checkPermissionStatus: checkPermissionStatusAction,
    requestPermission: requestPermissionAction,

    // Actions — devices
    getDevice,
    refreshDevices,

    // Actions — session-based streaming
    createSession,
    startSession,
    stopSession,
    addStreamToSession,
    removeStreamFromSession,
    capturePhoto,

    // Actions — mock device kit
    enableMockDeviceKit,
    disableMockDeviceKit,
    isMockDeviceKitEnabled,
    pairMockDevice,
    unpairMockDevice,
    mockSetPermissionStatus: mockSetPermissionStatusAction,
    mockSetPermissionRequestResult: mockSetPermissionRequestResultAction,
    mockDeviceSetCameraFeedFromCamera: mockDeviceSetCameraFeedFromCameraAction,
  };
}
