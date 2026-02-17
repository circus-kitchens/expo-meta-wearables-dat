import {
  createMockDevice,
  removeMockDevice,
  getMockDevices,
  mockDevicePowerOn,
  mockDevicePowerOff,
  mockDeviceDon,
  mockDeviceDoff,
  mockDeviceFold,
  mockDeviceUnfold,
  mockDeviceSetCameraFeed,
  mockDeviceSetCapturedImage,
} from "../EMWDATModule";

jest.mock("expo", () => ({
  NativeModule: class {},
  requireNativeModule: () => ({
    createMockDevice: jest.fn().mockResolvedValue("mock-id-123"),
    removeMockDevice: jest.fn().mockResolvedValue(undefined),
    getMockDevices: jest.fn().mockResolvedValue(["mock-id-123"]),
    mockDevicePowerOn: jest.fn().mockResolvedValue(undefined),
    mockDevicePowerOff: jest.fn().mockResolvedValue(undefined),
    mockDeviceDon: jest.fn().mockResolvedValue(undefined),
    mockDeviceDoff: jest.fn().mockResolvedValue(undefined),
    mockDeviceFold: jest.fn().mockResolvedValue(undefined),
    mockDeviceUnfold: jest.fn().mockResolvedValue(undefined),
    mockDeviceSetCameraFeed: jest.fn().mockResolvedValue(undefined),
    mockDeviceSetCapturedImage: jest.fn().mockResolvedValue(undefined),
    addListener: jest.fn(),
  }),
}));

jest.mock("react-native", () => ({
  Platform: { OS: "ios" },
}));

describe("Mock device functions", () => {
  it("createMockDevice returns device id", async () => {
    const id = await createMockDevice();
    expect(id).toBe("mock-id-123");
  });

  it("removeMockDevice calls native module", async () => {
    await expect(removeMockDevice("mock-id-123")).resolves.toBeUndefined();
  });

  it("getMockDevices returns array of ids", async () => {
    const ids = await getMockDevices();
    expect(ids).toEqual(["mock-id-123"]);
  });

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
});
