import { requireNativeView } from "expo";
import * as React from "react";

import type { EMWDATStreamViewProps } from "./EMWDAT.types";

const NativeView: React.ComponentType<EMWDATStreamViewProps> = requireNativeView("EMWDAT");

/**
 * Native view component for rendering the video stream from Meta Wearables glasses.
 *
 * Renders frames directly from the native SDK for optimal performance.
 * Use in conjunction with `startStream()` to display the camera feed.
 *
 * @example
 * ```tsx
 * const { streamState, startStream } = useMetaWearables();
 *
 * return (
 *   <EMWDATStreamView
 *     isActive={streamState === "streaming"}
 *     resizeMode="contain"
 *     style={{ flex: 1 }}
 *   />
 * );
 * ```
 */
export function EMWDATStreamView({
  isActive = false,
  resizeMode = "contain",
  style,
}: EMWDATStreamViewProps) {
  return <NativeView isActive={isActive} resizeMode={resizeMode} style={style} />;
}
