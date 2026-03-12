import type {
  VideoCodec,
  StreamSessionError,
  StreamSessionConfig,
  CaptureError,
} from "../EMWDAT.types";

describe("v0.5 type changes", () => {
  it("VideoCodec accepts 'hvc1' and 'raw'", () => {
    const raw: VideoCodec = "raw";
    const hvc1: VideoCodec = "hvc1";
    expect(raw).toBe("raw");
    expect(hvc1).toBe("hvc1");
  });

  it("StreamSessionError includes thermalCritical", () => {
    const error: StreamSessionError = { type: "thermalCritical" };
    expect(error.type).toBe("thermalCritical");
  });

  it("StreamSessionConfig accepts hvc1 codec", () => {
    const config: StreamSessionConfig = {
      videoCodec: "hvc1",
      resolution: "high",
      frameRate: 30,
    };
    expect(config.videoCodec).toBe("hvc1");
  });

  it("CaptureError type values", () => {
    const errors: CaptureError[] = [
      "deviceDisconnected",
      "notStreaming",
      "captureInProgress",
      "captureFailed",
    ];
    expect(errors).toHaveLength(4);
  });
});
