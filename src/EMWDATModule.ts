import { NativeModule, requireNativeModule } from "expo";

import { EMWDATModuleEvents } from "./EMWDAT.types";

declare class EMWDATModule extends NativeModule<EMWDATModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<EMWDATModule>("EMWDAT");
