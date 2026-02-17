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
  getStreamState: jest.fn(() => Promise.resolve("stopped")),
  startRegistration: jest.fn(() => Promise.resolve()),
  startUnregistration: jest.fn(() => Promise.resolve()),
  checkPermissionStatus: jest.fn(() => Promise.resolve("denied")),
  requestPermission: jest.fn(() => Promise.resolve("granted")),
  getDevice: jest.fn(() => Promise.resolve(null)),
  startStream: jest.fn(() => Promise.resolve()),
  stopStream: jest.fn(() => Promise.resolve()),
  capturePhoto: jest.fn(() => Promise.resolve()),
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
  m.getStreamState.mockResolvedValue("stopped");
  m.startRegistration.mockResolvedValue(undefined);
  m.startUnregistration.mockResolvedValue(undefined);
  m.checkPermissionStatus.mockResolvedValue("denied");
  m.requestPermission.mockResolvedValue("granted");
  m.getDevice.mockResolvedValue(null);
  m.startStream.mockResolvedValue(undefined);
  m.stopStream.mockResolvedValue(undefined);
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
    m.getStreamState.mockResolvedValue("stopped");

    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));

    await act(async () => {
      await result.current.configure();
    });

    expect(result.current.registrationState).toBe("registered");
    expect(result.current.devices).toHaveLength(1);
    expect(result.current.streamState).toBe("stopped");
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

  it("warns and returns early if already configured", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation();

    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));

    await act(async () => {
      await result.current.configure();
    });
    await act(async () => {
      await result.current.configure();
    });

    expect(m.configure).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith("[useMetaWearables] SDK already configured");
    warnSpy.mockRestore();
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

  it("startStream throws if not configured", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    await expect(result.current.startStream()).rejects.toThrow("SDK not configured");
  });

  it("capturePhoto throws if not streaming", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));

    await act(async () => {
      await result.current.configure();
    });

    await expect(result.current.capturePhoto()).rejects.toThrow("stream is not active");
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
// startStream — permission check flow
// ---------------------------------------------------------------------------

describe("startStream", () => {
  async function configureRegistered(result: any) {
    m.getRegistrationStateAsync.mockResolvedValue("registered");
    await act(async () => {
      await result.current.configure();
    });
  }

  it("throws if not registered", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    await act(async () => {
      await result.current.configure();
    });

    await expect(result.current.startStream()).rejects.toThrow("Must be registered");
  });

  it("checks permission then requests if denied", async () => {
    m.checkPermissionStatus.mockResolvedValue("denied");
    m.requestPermission.mockResolvedValue("granted");

    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    await configureRegistered(result);

    await act(async () => {
      await result.current.startStream();
    });

    expect(m.checkPermissionStatus).toHaveBeenCalledWith("camera");
    expect(m.requestPermission).toHaveBeenCalledWith("camera");
    expect(m.startStream).toHaveBeenCalled();
  });

  it("skips permission request if already granted", async () => {
    m.checkPermissionStatus.mockResolvedValue("granted");

    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    await configureRegistered(result);

    await act(async () => {
      await result.current.startStream();
    });

    expect(m.requestPermission).not.toHaveBeenCalled();
    expect(m.startStream).toHaveBeenCalled();
  });

  it("throws if permission denied after request", async () => {
    m.checkPermissionStatus.mockResolvedValue("denied");
    m.requestPermission.mockResolvedValue("denied");

    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    await configureRegistered(result);

    await act(async () => {
      await expect(result.current.startStream()).rejects.toThrow("Camera permission required");
    });
    expect(m.startStream).not.toHaveBeenCalled();
  });

  it("throws if already streaming", async () => {
    m.checkPermissionStatus.mockResolvedValue("granted");
    m.getStreamState.mockResolvedValue("streaming");

    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    await configureRegistered(result);

    await expect(result.current.startStream()).rejects.toThrow("Stream already active");
  });
});

// ---------------------------------------------------------------------------
// stopStream
// ---------------------------------------------------------------------------

describe("stopStream", () => {
  it("no-ops when already stopped", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));

    await act(async () => {
      await result.current.stopStream();
    });

    expect(m.stopStream).not.toHaveBeenCalled();
  });

  it("delegates when stream is active", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));

    const listeners = getListeners();

    // Simulate stream becoming active
    await act(async () => {
      listeners.onStreamStateChange({ state: "streaming" });
    });

    await act(async () => {
      await result.current.stopStream();
    });

    expect(m.stopStream).toHaveBeenCalled();
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

  it("onStreamStateChange updates state", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    const listeners = getListeners();

    await act(async () => {
      listeners.onStreamStateChange({ state: "streaming" });
    });

    expect(result.current.streamState).toBe("streaming");
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

  it("onStreamError sets lastError and auto-stops if streaming", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    const listeners = getListeners();

    await act(async () => {
      listeners.onStreamStateChange({ state: "streaming" });
    });

    await act(async () => {
      listeners.onStreamError({ type: "internalError" });
    });

    expect(result.current.lastError).toEqual({ type: "internalError" });
    expect(m.stopStream).toHaveBeenCalled();
  });

  it("onStreamError does NOT auto-stop if already stopped", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    const listeners = getListeners();

    await act(async () => {
      listeners.onStreamError({ type: "timeout" });
    });

    expect(result.current.lastError).toEqual({ type: "timeout" });
    expect(m.stopStream).not.toHaveBeenCalled();
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

  it("onDeviceSessionStateChange updates map", async () => {
    const { result } = renderHook(() => useMetaWearables({ autoConfig: false }));
    const listeners = getListeners();

    await act(async () => {
      listeners.onDeviceSessionStateChange({
        deviceId: "dev-1",
        sessionState: "running",
      });
    });

    expect(result.current.deviceSessionStates).toEqual({ "dev-1": "running" });
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

  it("calls user callbacks", async () => {
    const onStreamStateChange = jest.fn();

    renderHook(() => useMetaWearables({ autoConfig: false, onStreamStateChange }));
    const listeners = getListeners();

    await act(async () => {
      listeners.onStreamStateChange({ state: "streaming" });
    });

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

    expect(removeFns.length).toBe(10);

    unmount();

    removeFns.forEach((fn) => expect(fn).toHaveBeenCalled());
  });
});
