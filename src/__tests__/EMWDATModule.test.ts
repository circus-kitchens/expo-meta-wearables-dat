import { Platform } from "react-native";

import { addListener, startStream, capturePhoto, EMWDATModule } from "../EMWDATModule";

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
    getStreamState: jest.fn(() => Promise.resolve("stopped")),
    startStream: jest.fn(() => Promise.resolve()),
    stopStream: jest.fn(() => Promise.resolve()),
    capturePhoto: jest.fn(() => Promise.resolve()),
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

    it("returns null on non-iOS platforms", () => {
      (Platform as any).OS = "android";
      const sub = addListener("onRegistrationStateChange", jest.fn());
      expect(sub).toBeNull();
      (Platform as any).OS = "ios";
    });
  });

  it("startStream defaults to empty config when called without args", async () => {
    await startStream();
    expect(native.startStream).toHaveBeenCalledWith({});
  });

  it("capturePhoto defaults to jpeg format when called without args", async () => {
    await capturePhoto();
    expect(native.capturePhoto).toHaveBeenCalledWith("jpeg");
  });

  it("capturePhoto passes explicit format through", async () => {
    await capturePhoto("heic");
    expect(native.capturePhoto).toHaveBeenCalledWith("heic");
  });
});
