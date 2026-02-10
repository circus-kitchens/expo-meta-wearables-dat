import { requireNativeView } from "expo";
import * as React from "react";

import { ExpoMetaWearablesDatViewProps } from "./ExpoMetaWearablesDat.types";

const NativeView: React.ComponentType<ExpoMetaWearablesDatViewProps> =
  requireNativeView("ExpoMetaWearablesDat");

export default function ExpoMetaWearablesDatView(props: ExpoMetaWearablesDatViewProps) {
  return <NativeView {...props} />;
}
