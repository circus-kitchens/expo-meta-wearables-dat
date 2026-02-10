import { registerWebModule, NativeModule } from "expo";

import { EMWDATModuleEvents } from "./EMWDAT.types";

class EMWDATModule extends NativeModule<EMWDATModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit("onChange", { value });
  }
  hello() {
    return "Hello world! 👋";
  }
}

export default registerWebModule(EMWDATModule, "EMWDATModule");
