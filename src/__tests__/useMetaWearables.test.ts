/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";

import { useMetaWearables } from "../useMetaWearables";

jest.mock("../EMWDATModule", () => ({
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  configure: jest.fn(() => Promise.resolve()),
  setLogLevel: jest.fn(),
  getRegistrationStateAsync: jest.fn(() => Promise.resolve("unavailable")),
  getDevices: jest.fn(() => Promise.resolve([])),
  startRegistration: jest.fn(() => Promise.resolve()),
  startUnregistration: jest.fn(() => Promise.resolve()),
  checkPermissionStatus: jest.fn(() => Promise.resolve("denied")),
  requestPermission: jest.fn(() => Promise.resolve("granted")),
  getDevice: jest.fn(() => Promise.resolve(null)),
  createSession: jest.fn(() => Promise.resolve("session-123")),
  startSession: jest.fn(() => Promise.resolve()),
  stopSession: jest.fn(() => Promise.resolve()),
  addStreamToSession: jest.fn(() => Promise.resolve()),
  removeStreamFromSession: jest.fn(() => Promise.resolve()),
  capturePhoto: jest.fn(() => Promise.resolve()),
  enableMockDeviceKit: jest.fn(() => Promise.resolve()),
  disableMockDeviceKit: jest.fn(() => Promise.resolve()),
  isMockDeviceKitEnabled: jest.fn(() => Promise.resolve(false)),
  pairMockDevice: jest.fn(() => Promise.resolve("mock-1")),
  unpairMockDevice: jest.fn(() => Promise.resolve()),
  mockSetPermissionStatus: jest.fn(() => Promise.resolve()),
  mockSetPermissionRequestResult: jest.fn(() => Promise.resolve()),
  mockDeviceSetCameraFeedFromCamera: jest.fn(() => Promise.resolve()),
}));

const m = require("../EMWDATModule") as Record<string, jest.Mock>;

function getListeners(): Record<string, Function> {
  const listeners: Record<string, Function> = {};
  m.addListener.mock.calls.forEach(([event, cb]: [string, Function]) => {
    listeners[event] = cb;
  });
  return listeners;
}

beforeEach(() => {
  jest.clearAllMocks();
  m.addListener.mockImplementation(() => ({ remove: jest.fn() }));
  m.configure.mockResolvedValue(undefined);
  m.setLogLevel.mockImplementation(() => {});
  m.getRegistrationStateAsync.mockResolvedValue("unavailable");
  m.getDevices.mockResolvedValue([]);
  m.startRegistration.mockResolvedValue(undefined);
  m.startUnregistration.mockResolvedValue(undefined);
  m.checkPermissionStatus.mockResolvedValue("denied");
  m.requestPermission.mockResolvedValue("granted");
  m.getDevice.mockResolvedValue(null);
  m.createSession.mockResolvedValue("session-123");
  m.startSession.mockResolvedValue(undefined);
  m.stopSession.mockResolvedValue(undefined);
  m.addStreamToSession.mockResolvedValue(undefined);
  m.removeStreamFromSession.mockResolvedValue(undefined);
  m.capturePhoto.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// Configure
// ---------------------------------------------------------------------------

describe("configure", () => {
  it("auto-configures on mount by default", async () => {
    await act(async () => {
      renderHook(() => useMetaWearables());
    });
    expect(m.configure).toHaveBeenCalledTimes(1);
  });

  it("does not auto-configure when autoConfig is false", async () => {
    await act(async () => {
      renderHook(() => useMetaWearables({ autoConfig: false }));
    });
    expect(m.configure).not.toHaveBeenCalled();
  });

  it("sets isConfigured after success", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));

    await act(async () => {
      await result.current.configure();
    });

    expect(result.current.isConfigured).toBe(true);
    expect(result.current.isConfiguring).toBe(false);
  });

  it("syncs initial state after configure", async () => {
    m.getRegistrationStateAsync.mockResolvedValue("registered");
    m.getDevices.mockResolvedValue([{ identifier: "d1", name: "Glasses", linkState: "connected" }]);

    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));

    await act(async () => {
      await result.current.configure();
    });

    expect(result.current.registrationState).toBe("registered");
    expect(result.current.devices).toHaveLength(1);
  });

  it("sets configError on failure and rethrows", async () => {
    m.configure.mockRejectedValue(new Error("config failed"));

    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));

    await act(async () => {
      await expect(result.current.configure()).rejects.toThrow("config failed");
    });

    expect(result.current.configError).toEqual(new Error("config failed"));
    expect(result.current.isConfigured).toBe(false);
  });

  it("returns early without error if already configured", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));

    await act(async () => {
      await result.current.configure();
    });
    await act(async () => {
      await result.current.configure();
    });

    expect(m.configure).toHaveBeenCalledTimes(1);
  });

  it("sets logLevel before configuring", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false, logLevel: "debug" }));

    await act(async () => {
      await result.current.configure();
    });

    expect(m.setLogLevel).toHaveBeenCalledWith("debug");
  });
});

// ---------------------------------------------------------------------------
// Guards — actions that require configured state
// ---------------------------------------------------------------------------

describe("guards", () => {
  it("startRegistration throws if not configured", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    await expect(result.current.startRegistration()).rejects.toThrow("SDK not configured");
  });

  it("startUnregistration throws if not configured", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    await expect(result.current.startUnregistration()).rejects.toThrow("SDK not configured");
  });

  it("refreshDevices throws if not configured", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    await expect(result.current.refreshDevices()).rejects.toThrow("SDK not configured");
  });

  it("requestPermission throws if not configured", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    await expect(result.current.requestPermission("camera")).rejects.toThrow("SDK not configured");
  });

  it("checkPermissionStatus returns 'denied' if not configured", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    const status = await result.current.checkPermissionStatus("camera");
    expect(status).toBe("denied");
  });

  it("createSession throws if not configured", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    await expect(result.current.createSession()).rejects.toThrow("SDK not configured");
  });

  it("createSession throws if not registered", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    await act(async () => {
      await result.current.configure();
    });
    await expect(result.current.createSession()).rejects.toThrow("Must be registered");
  });
});

// ---------------------------------------------------------------------------
// startRegistration
// ---------------------------------------------------------------------------

describe("startRegistration", () => {
  it("delegates to native when configured", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));

    await act(async () => {
      await result.current.configure();
    });
    await act(async () => {
      await result.current.startRegistration();
    });

    expect(m.startRegistration).toHaveBeenCalled();
  });

  it("no-ops when already registering", async () => {
    m.getRegistrationStateAsync.mockResolvedValue("registering");
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));

    await act(async () => {
      await result.current.configure();
    });
    await act(async () => {
      await result.current.startRegistration();
    });

    expect(m.startRegistration).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith("[useMetaWearables] Already registering");
    warnSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// requestPermission
// ---------------------------------------------------------------------------

describe("requestPermission", () => {
  it("throws if not registered", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));

    await act(async () => {
      await result.current.configure();
    });

    await expect(result.current.requestPermission("camera")).rejects.toThrow("Must be registered");
  });

  it("delegates when configured and registered", async () => {
    m.getRegistrationStateAsync.mockResolvedValue("registered");

    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));

    await act(async () => {
      await result.current.configure();
    });

    let status: string | undefined;
    await act(async () => {
      status = await result.current.requestPermission("camera");
    });

    expect(m.requestPermission).toHaveBeenCalledWith("camera");
    expect(status).toBe("granted");
  });
});

// ---------------------------------------------------------------------------
// Session-based streaming
// ---------------------------------------------------------------------------

describe("session-based streaming", () => {
  async function configureRegistered(result: any) {
    m.getRegistrationStateAsync.mockResolvedValue("registered");
    await act(async () => {
      await result.current.configure();
    });
  }

  it("createSession returns sessionId when registered", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    await configureRegistered(result);

    let sessionId: string | undefined;
    await act(async () => {
      sessionId = await result.current.createSession();
    });

    expect(sessionId).toBe("session-123");
    expect(m.createSession).toHaveBeenCalled();
  });

  it("addStreamToSession checks permission then delegates", async () => {
    m.checkPermissionStatus.mockResolvedValue("granted");

    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    await configureRegistered(result);

    await act(async () => {
      await result.current.addStreamToSession("session-123", { resolution: "high" });
    });

    expect(m.checkPermissionStatus).toHaveBeenCalledWith("camera");
    expect(m.addStreamToSession).toHaveBeenCalledWith("session-123", { resolution: "high" });
  });

  it("addStreamToSession requests permission if denied", async () => {
    m.checkPermissionStatus.mockResolvedValue("denied");
    m.requestPermission.mockResolvedValue("granted");

    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    await configureRegistered(result);

    await act(async () => {
      await result.current.addStreamToSession("session-123");
    });

    expect(m.requestPermission).toHaveBeenCalledWith("camera");
    expect(m.addStreamToSession).toHaveBeenCalled();
  });

  it("addStreamToSession throws if permission denied after request", async () => {
    m.checkPermissionStatus.mockResolvedValue("denied");
    m.requestPermission.mockResolvedValue("denied");

    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    await configureRegistered(result);

    await act(async () => {
      await expect(result.current.addStreamToSession("session-123")).rejects.toThrow(
        "Camera permission required"
      );
    });
    expect(m.addStreamToSession).not.toHaveBeenCalled();
  });

  it("stopSession delegates to native", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    await configureRegistered(result);

    await act(async () => {
      await result.current.stopSession("session-123");
    });

    expect(m.stopSession).toHaveBeenCalledWith("session-123");
  });
});

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

describe("events", () => {
  it("onRegistrationStateChange updates state", async () => {
    // Prevent detached side-effect promises from resolving outside act
    m.checkPermissionStatus.mockReturnValue(new Promise(() => {}));
    m.getDevices.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    const listeners = getListeners();

    await act(async () => {
      listeners.onRegistrationStateChange({ state: "registered" });
    });

    expect(result.current.registrationState).toBe("registered");
  });

  it("onDevicesChange updates devices", async () => {
    const devices = [{ identifier: "d1", name: "Glasses" }];
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    const listeners = getListeners();

    await act(async () => {
      listeners.onDevicesChange({ devices });
    });

    expect(result.current.devices).toEqual(devices);
  });

  it("onDeviceSessionStateChange updates map", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    const listeners = getListeners();

    await act(async () => {
      listeners.onDeviceSessionStateChange({
        sessionId: "s1",
        state: "started",
      });
    });

    expect(result.current.deviceSessionStates).toEqual({ s1: "started" });
  });

  it("onDeviceSessionStateChange cleans up stopped sessions", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    const listeners = getListeners();

    await act(async () => {
      listeners.onDeviceSessionStateChange({ sessionId: "s1", state: "started" });
    });

    expect(result.current.deviceSessionStates).toEqual({ s1: "started" });

    await act(async () => {
      listeners.onDeviceSessionStateChange({ sessionId: "s1", state: "stopped" });
    });

    expect(result.current.deviceSessionStates).toEqual({});
  });

  it("onDeviceSessionError updates error map", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    const listeners = getListeners();

    await act(async () => {
      listeners.onDeviceSessionError({
        sessionId: "s1",
        error: "noEligibleDevice",
        message: "No device available",
      });
    });

    expect(result.current.deviceSessionErrors).toEqual({
      s1: { error: "noEligibleDevice", message: "No device available" },
    });
  });

  it("onCapabilityStateChange updates map", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    const listeners = getListeners();

    await act(async () => {
      listeners.onCapabilityStateChange({ sessionId: "s1", state: "active" });
    });

    expect(result.current.capabilityStates).toEqual({ s1: "active" });
  });

  it("onLinkStateChange handles 'connecting' state", async () => {
    const onLinkStateChange = jest.fn();
    renderHook(() => useMetaWearables({ autoConfig: false, onLinkStateChange }));
    const listeners = getListeners();

    await act(async () => {
      listeners.onLinkStateChange({ deviceId: "d1", linkState: "connecting" });
    });

    expect(onLinkStateChange).toHaveBeenCalledWith("d1", "connecting");
  });

  it("onPermissionStatusChange updates camera permission", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    const listeners = getListeners();

    await act(async () => {
      listeners.onPermissionStatusChange({
        permission: "camera",
        status: "granted",
      });
    });

    expect(result.current.permissionStatus).toBe("granted");
  });

  it("onCompatibilityChange updates device in list", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    const listeners = getListeners();

    await act(async () => {
      listeners.onDevicesChange({
        devices: [
          {
            identifier: "d1",
            name: "Glasses",
            compatibility: "compatible",
            linkState: "connected",
            deviceType: "rayBanMeta",
          },
        ],
      });
    });

    await act(async () => {
      listeners.onCompatibilityChange({
        deviceId: "d1",
        compatibility: "deviceUpdateRequired",
      });
    });

    expect(result.current.devices[0].compatibility).toBe("deviceUpdateRequired");
  });

  it("tracks streamState and calls user callbacks", async () => {
    const onStreamStateChange = jest.fn();

    const { result } = renderHook(() =>
      useMetaWearables({ autoConfig: false, onStreamStateChange })
    );
    const listeners = getListeners();

    expect(result.current.streamState).toBe("stopped");

    await act(async () => {
      listeners.onStreamStateChange({ state: "streaming" });
    });

    expect(result.current.streamState).toBe("streaming");
    expect(onStreamStateChange).toHaveBeenCalledWith("streaming");
  });

  it("cleans up subscriptions on unmount", () => {
    const removeFns: jest.Mock[] = [];
    m.addListener.mockImplementation(() => {
      const remove = jest.fn();
      removeFns.push(remove);
      return { remove };
    });

    const { unmount } = renderHook(() => useMetaWearables({ autoConfig: false }));

    // 12 events: registration, devices, linkState, streamState, videoFrame,
    // photoCaptured, streamError, permissionStatus, compatibility,
    // deviceSessionState, deviceSessionError, capabilityState
    expect(removeFns.length).toBe(12);

    unmount();

    removeFns.forEach((fn) => expect(fn).toHaveBeenCalled());
  });
});
