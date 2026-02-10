import * as React from "react";

import { EMWDATViewProps } from "./EMWDAT.types";

export default function EMWDATView(props: EMWDATViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
