import { addListener, getRegistrationState, configure } from "../EMWDATModule.web";

jest.mock("expo", () => ({
  NativeModule: class {},
  registerWebModule: jest.fn(() => ({})),
}));

describe("Web module stubs", () => {
  it("addListener returns null (does not throw)", () => {
    expect(addListener()).toBeNull();
  });

  it("sync functions throw 'not supported'", () => {
    expect(() => getRegistrationState()).toThrow("EMWDAT is not supported on web");
  });

  it("async functions reject with 'not supported'", async () => {
    await expect(configure()).rejects.toThrow("EMWDAT is not supported on web");
  });
});
