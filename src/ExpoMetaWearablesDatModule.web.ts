import { registerWebModule, NativeModule } from 'expo';

import { ExpoMetaWearablesDatModuleEvents } from './ExpoMetaWearablesDat.types';

class ExpoMetaWearablesDatModule extends NativeModule<ExpoMetaWearablesDatModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ExpoMetaWearablesDatModule, 'ExpoMetaWearablesDatModule');
