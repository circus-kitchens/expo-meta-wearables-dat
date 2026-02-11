import { type ConfigPlugin, withInfoPlist } from "expo/config-plugins";

type EMWDATPluginProps = {
  /** URL scheme for Meta AI app callback (required). Do not include "://". */
  urlScheme: string;
  /** Meta App ID — use "0" for Developer Mode (default). Published apps get a dedicated value from the Wearables Developer Center. */
  metaAppId?: string;
  /** Custom NSBluetoothAlwaysUsageDescription text */
  bluetoothUsageDescription?: string;
};

/**
 * Adds a string to an Info.plist string array, creating the array if needed.
 * Only adds if not already present.
 */
function addUniqueStringToArray(plist: Record<string, any>, key: string, value: string): void {
  const arr: string[] = plist[key] ?? [];
  if (!arr.includes(value)) {
    arr.push(value);
  }
  plist[key] = arr;
}

const withEMWDAT: ConfigPlugin<EMWDATPluginProps> = (config, props) => {
  let urlScheme = props.urlScheme;

  // Strip "://" suffix if present (common mistake)
  if (urlScheme.includes("://")) {
    console.warn(
      `[EMWDAT] urlScheme "${urlScheme}" contains "://". Stripping protocol suffix — only the scheme name is needed (e.g. "myapp", not "myapp://").`
    );
    urlScheme = urlScheme.replace(/:\/\/.*$/, "");
  }

  const metaAppId = props.metaAppId ?? "0";
  const bluetoothDescription =
    props.bluetoothUsageDescription ?? "This app uses Bluetooth to connect to Meta Wearables.";

  return withInfoPlist(config, (config) => {
    const plist = config.modResults;

    // CFBundleURLTypes — merge new URL scheme entry if not already present
    const urlTypes = plist.CFBundleURLTypes ?? [];
    const existingSchemes = urlTypes.flatMap(
      (entry: { CFBundleURLSchemes?: string[] }) => entry.CFBundleURLSchemes ?? []
    );
    if (!existingSchemes.includes(urlScheme)) {
      urlTypes.push({
        CFBundleURLSchemes: [urlScheme],
      });
    }
    plist.CFBundleURLTypes = urlTypes;

    // LSApplicationQueriesSchemes — needed to discover Meta AI app
    addUniqueStringToArray(plist, "LSApplicationQueriesSchemes", "fb-viewapp");

    // UISupportedExternalAccessoryProtocols — wearables communication
    addUniqueStringToArray(plist, "UISupportedExternalAccessoryProtocols", "com.meta.ar.wearable");

    // UIBackgroundModes — required for Bluetooth and external accessory
    addUniqueStringToArray(plist, "UIBackgroundModes", "bluetooth-peripheral");
    addUniqueStringToArray(plist, "UIBackgroundModes", "external-accessory");

    // NSBluetoothAlwaysUsageDescription
    plist.NSBluetoothAlwaysUsageDescription = bluetoothDescription;

    // MWDAT configuration dictionary
    plist.MWDAT = {
      AppLinkURLScheme: `${urlScheme}://`,
      MetaAppID: metaAppId,
    };

    return config;
  });
};

export default withEMWDAT;
