import {
  enableMockDeviceKit,
  disableMockDeviceKit,
  isMockDeviceKitEnabled,
  pairMockDevice,
  unpairMockDevice,
  getMockDevices,
  mockDevicePowerOn,
  mockDevicePowerOff,
  mockDeviceDon,
  mockDeviceDoff,
  mockDeviceFold,
  mockDeviceUnfold,
  mockDeviceSetCameraFeed,
  mockDeviceSetCapturedImage,
  mockDeviceSetCameraFeedFromCamera,
  mockSetPermissionStatus,
  mockSetPermissionRequestResult,
} from "../EMWDATModule";

jest.mock("expo", () => ({
  NativeModule: class {},
  requireNativeModule: () => ({
    enableMockDeviceKit: jest.fn().mockResolvedValue(undefined),
    disableMockDeviceKit: jest.fn().mockResolvedValue(undefined),
    isMockDeviceKitEnabled: jest.fn().mockResolvedValue(true),
    pairMockDevice: jest.fn().mockResolvedValue("mock-id-123"),
    unpairMockDevice: jest.fn().mockResolvedValue(undefined),
    getMockDevices: jest.fn().mockResolvedValue(["mock-id-123"]),
    mockDevicePowerOn: jest.fn().mockResolvedValue(undefined),
    mockDevicePowerOff: jest.fn().mockResolvedValue(undefined),
    mockDeviceDon: jest.fn().mockResolvedValue(undefined),
    mockDeviceDoff: jest.fn().mockResolvedValue(undefined),
    mockDeviceFold: jest.fn().mockResolvedValue(undefined),
    mockDeviceUnfold: jest.fn().mockResolvedValue(undefined),
    mockDeviceSetCameraFeed: jest.fn().mockResolvedValue(undefined),
    mockDeviceSetCapturedImage: jest.fn().mockResolvedValue(undefined),
    mockDeviceSetCameraFeedFromCamera: jest.fn().mockResolvedValue(undefined),
    mockSetPermissionStatus: jest.fn().mockResolvedValue(undefined),
    mockSetPermissionRequestResult: jest.fn().mockResolvedValue(undefined),
    addListener: jest.fn(),
  }),
}));

jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

describe("Mock device kit lifecycle", () => {
  it("enableMockDeviceKit resolves", async () => {
    await expect(enableMockDeviceKit()).resolves.toBeUndefined();
  });

  it("enableMockDeviceKit passes config", async () => {
    await expect(
      enableMockDeviceKit({ initiallyRegistered: false, initialPermissionsGranted: false })
    ).resolves.toBeUndefined();
  });

  it("disableMockDeviceKit resolves", async () => {
    await expect(disableMockDeviceKit()).resolves.toBeUndefined();
  });

  it("isMockDeviceKitEnabled returns boolean", async () => {
    const enabled = await isMockDeviceKitEnabled();
    expect(enabled).toBe(true);
  });
});

describe("Mock device pairing", () => {
  it("pairMockDevice returns device id", async () => {
    const id = await pairMockDevice();
    expect(id).toBe("mock-id-123");
  });

  it("unpairMockDevice calls native module", async () => {
    await expect(unpairMockDevice("mock-id-123")).resolves.toBeUndefined();
  });

  it("getMockDevices returns array of ids", async () => {
    const ids = await getMockDevices();
    expect(ids).toEqual(["mock-id-123"]);
  });
});

describe("Mock device simulation", () => {
  it("mockDevicePowerOn resolves", async () => {
    await expect(mockDevicePowerOn("mock-id-123")).resolves.toBeUndefined();
  });

  it("mockDevicePowerOff resolves", async () => {
    await expect(mockDevicePowerOff("mock-id-123")).resolves.toBeUndefined();
  });

  it("mockDeviceDon resolves", async () => {
    await expect(mockDeviceDon("mock-id-123")).resolves.toBeUndefined();
  });

  it("mockDeviceDoff resolves", async () => {
    await expect(mockDeviceDoff("mock-id-123")).resolves.toBeUndefined();
  });

  it("mockDeviceFold resolves", async () => {
    await expect(mockDeviceFold("mock-id-123")).resolves.toBeUndefined();
  });

  it("mockDeviceUnfold resolves", async () => {
    await expect(mockDeviceUnfold("mock-id-123")).resolves.toBeUndefined();
  });

  it("mockDeviceSetCameraFeed resolves", async () => {
    await expect(
      mockDeviceSetCameraFeed("mock-id-123", "file:///test.mp4")
    ).resolves.toBeUndefined();
  });

  it("mockDeviceSetCapturedImage resolves", async () => {
    await expect(
      mockDeviceSetCapturedImage("mock-id-123", "file:///test.jpg")
    ).resolves.toBeUndefined();
  });

  it("mockDeviceSetCameraFeedFromCamera resolves", async () => {
    await expect(
      mockDeviceSetCameraFeedFromCamera("mock-id-123", "front")
    ).resolves.toBeUndefined();
  });
});

describe("Mock permissions", () => {
  it("mockSetPermissionStatus resolves", async () => {
    await expect(mockSetPermissionStatus("camera", "granted")).resolves.toBeUndefined();
  });

  it("mockSetPermissionRequestResult resolves", async () => {
    await expect(mockSetPermissionRequestResult("camera", "denied")).resolves.toBeUndefined();
  });
});
