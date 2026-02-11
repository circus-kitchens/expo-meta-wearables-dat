import { requireNativeViewManager } from "expo-modules-core";
import * as React from "react";
import { StyleProp, ViewStyle } from "react-native";

/**
 * Props for the MetaWearablesStreamView component
 */
export interface MetaWearablesStreamViewProps {
  /**
   * Whether the view should actively display frames.
   * Set to true when streaming is active.
   */
  isActive?: boolean;

  /**
   * How the video content should be resized to fit the view.
   * - "contain": Scale to fit while maintaining aspect ratio (default)
   * - "cover": Scale to fill while maintaining aspect ratio (may crop)
   * - "stretch": Stretch to fill (may distort)
   */
  resizeMode?: "contain" | "cover" | "stretch";

  /**
   * Style for the view container
   */
  style?: StyleProp<ViewStyle>;
}

// Get the native view
const NativeView: React.ComponentType<MetaWearablesStreamViewProps> =
  requireNativeViewManager("MetaWearablesStreamView");

/**
 * Native view component for rendering video stream frames from Meta Wearables glasses.
 *
 * This component renders frames directly from the native SDK for optimal performance.
 * Use in conjunction with startStream() to display the camera feed.
 *
 * @example
 * ```tsx
 * const { streamState, startStream, stopStream } = useMetaWearables();
 *
 * return (
 *   <MetaWearablesStreamView
 *     isActive={streamState === StreamSessionState.Streaming}
 *     resizeMode="contain"
 *     style={{ flex: 1 }}
 *   />
 * );
 * ```
 */
export function MetaWearablesStreamView({
  isActive = false,
  resizeMode = "contain",
  style,
}: MetaWearablesStreamViewProps) {
  return <NativeView isActive={isActive} resizeMode={resizeMode} style={style} />;
}
