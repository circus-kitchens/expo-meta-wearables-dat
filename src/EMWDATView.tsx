import { requireNativeView } from "expo";
import * as React from "react";

import { EMWDATViewProps } from "./EMWDAT.types";

const NativeView: React.ComponentType<EMWDATViewProps> = requireNativeView("EMWDAT");

export default function EMWDATView(props: EMWDATViewProps) {
  return <NativeView {...props} />;
}
