import { Platform } from "react-native";

import {
  addListener,
  addStreamToSession,
  capturePhoto,
  createSession,
  EMWDATModule,
} from "../EMWDATModule";

jest.mock("expo", () => {
  const nativeModule = {
    setLogLevel: jest.fn(),
    configure: jest.fn(() => Promise.resolve()),
    getRegistrationState: jest.fn(() => "registered"),
    getRegistrationStateAsync: jest.fn(() => Promise.resolve("registered")),
    startRegistration: jest.fn(() => Promise.resolve()),
    startUnregistration: jest.fn(() => Promise.resolve()),
    handleUrl: jest.fn(() => Promise.resolve(true)),
    checkPermissionStatus: jest.fn(() => Promise.resolve("granted")),
    requestPermission: jest.fn(() => Promise.resolve("granted")),
    getDevices: jest.fn(() => Promise.resolve([])),
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
    getMockDevices: jest.fn(() => Promise.resolve([])),
    mockDevicePowerOn: jest.fn(() => Promise.resolve()),
    mockDevicePowerOff: jest.fn(() => Promise.resolve()),
    mockDeviceDon: jest.fn(() => Promise.resolve()),
    mockDeviceDoff: jest.fn(() => Promise.resolve()),
    mockDeviceFold: jest.fn(() => Promise.resolve()),
    mockDeviceUnfold: jest.fn(() => Promise.resolve()),
    mockDeviceSetCameraFeed: jest.fn(() => Promise.resolve()),
    mockDeviceSetCapturedImage: jest.fn(() => Promise.resolve()),
    mockDeviceSetCameraFeedFromCamera: jest.fn(() => Promise.resolve()),
    mockSetPermissionStatus: jest.fn(() => Promise.resolve()),
    mockSetPermissionRequestResult: jest.fn(() => Promise.resolve()),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  };
  return {
    NativeModule: class {},
    requireNativeModule: () => nativeModule,
  };
});

jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

const native = EMWDATModule as any;

describe("EMWDATModule wrappers", () => {
  describe("addListener", () => {
    it("delegates to native module on iOS", () => {
      const listener = jest.fn();
      const sub = addListener("onRegistrationStateChange", listener);
      expect(sub).not.toBeNull();
      expect(native.addListener).toHaveBeenCalledWith("onRegistrationStateChange", listener);
    });

    it("delegates to native module on Android", () => {
      (Platform as any).OS = "android";
      const listener = jest.fn();
      const sub = addListener("onRegistrationStateChange", listener);
      expect(sub).not.toBeNull();
      expect(native.addListener).toHaveBeenCalledWith("onRegistrationStateChange", listener);
      (Platform as any).OS = "ios";
    });

    it("returns null on web", () => {
      (Platform as any).OS = "web";
      const sub = addListener("onRegistrationStateChange", jest.fn());
      expect(sub).toBeNull();
      (Platform as any).OS = "ios";
    });
  });

  describe("session-based streaming", () => {
    it("createSession passes deviceId to native", async () => {
      await createSession("device-abc");
      expect(native.createSession).toHaveBeenCalledWith("device-abc");
    });

    it("createSession passes undefined when no deviceId", async () => {
      await createSession();
      expect(native.createSession).toHaveBeenCalledWith(undefined);
    });

    it("addStreamToSession defaults to empty config when called without config", async () => {
      await addStreamToSession("session-123");
      expect(native.addStreamToSession).toHaveBeenCalledWith("session-123", {});
    });

    it("addStreamToSession passes config with compressVideo", async () => {
      await addStreamToSession("session-123", { compressVideo: true, resolution: "high" });
      expect(native.addStreamToSession).toHaveBeenCalledWith("session-123", {
        compressVideo: true,
        resolution: "high",
      });
    });
  });

  describe("capturePhoto", () => {
    it("defaults to jpeg format when called without args", async () => {
      await capturePhoto();
      expect(native.capturePhoto).toHaveBeenCalledWith("jpeg");
    });

    it("passes explicit format through", async () => {
      await capturePhoto("heic");
      expect(native.capturePhoto).toHaveBeenCalledWith("heic");
    });
  });
});
