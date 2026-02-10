import { NativeModule, requireNativeModule } from 'expo';

import { ExpoMetaWearablesDatModuleEvents } from './ExpoMetaWearablesDat.types';

declare class ExpoMetaWearablesDatModule extends NativeModule<ExpoMetaWearablesDatModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoMetaWearablesDatModule>('ExpoMetaWearablesDat');
