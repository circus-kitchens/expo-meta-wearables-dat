import * as React from 'react';

import { ExpoMetaWearablesDatViewProps } from './ExpoMetaWearablesDat.types';

export default function ExpoMetaWearablesDatView(props: ExpoMetaWearablesDatViewProps) {
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
