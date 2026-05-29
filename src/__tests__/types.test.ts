import type {
  VideoCodec,
  StreamSessionError,
  StreamSessionConfig,
  CaptureError,
  DisplayState,
  DisplayErrorCode,
  DisplayContentNode,
  EMWDATPluginProps,
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

describe("v0.7 Display types", () => {
  it("DisplayState accepts all expected values", () => {
    const states: DisplayState[] = ["stopped", "starting", "started", "stopping"];
    expect(states).toHaveLength(4);
  });

  it("DisplayErrorCode accepts all expected values", () => {
    const codes: DisplayErrorCode[] = [
      "capabilityDenied",
      "deviceDisconnected",
      "invalidSessionState",
      "renderingFailed",
      "unexpectedError",
    ];
    expect(codes).toHaveLength(5);
  });

  it("DisplayContentNode flexBox with children", () => {
    const node: DisplayContentNode = {
      type: "flexBox",
      direction: "column",
      gap: 12,
      paddingAll: 16,
      children: [
        { type: "text", content: "Hello", style: "heading" },
        {
          type: "button",
          label: "Continue",
          style: "primary",
          onPressId: "btn-continue",
        },
      ],
    };
    expect(node.type).toBe("flexBox");
    if (node.type === "flexBox") {
      expect(node.children).toHaveLength(2);
    }
  });

  it("DisplayContentNode text node", () => {
    const node: DisplayContentNode = {
      type: "text",
      content: "Hello, glasses!",
      style: "body",
      color: "secondary",
    };
    expect(node.type).toBe("text");
    if (node.type === "text") {
      expect(node.content).toBe("Hello, glasses!");
    }
  });

  it("DisplayContentNode button node requires onPressId", () => {
    const node: DisplayContentNode = {
      type: "button",
      label: "Tap me",
      onPressId: "action-1",
    };
    expect(node.type).toBe("button");
    if (node.type === "button") {
      expect(node.onPressId).toBe("action-1");
    }
  });

  it("EMWDATPluginProps accepts damEnabled", () => {
    const props: EMWDATPluginProps = {
      urlScheme: "myapp",
      damEnabled: true,
    };
    expect(props.damEnabled).toBe(true);
  });
});
