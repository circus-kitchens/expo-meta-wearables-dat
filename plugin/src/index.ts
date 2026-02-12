import {
  type ConfigPlugin,
  withInfoPlist,
  withPodfileProperties,
  withXcodeProject,
} from "expo/config-plugins";

type EMWDATPluginProps = {
  /** URL scheme for Meta AI app callback (required). Do not include "://". */
  urlScheme: string;
  /** Meta App ID — use "0" for Developer Mode (default). Published apps get a dedicated value from the Wearables Developer Center. */
  metaAppId?: string;
  /** Client Token from Wearables Developer Center (optional for Developer Mode). */
  clientToken?: string;
  /** Custom NSBluetoothAlwaysUsageDescription text */
  bluetoothUsageDescription?: string;
};

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

  // Set iOS deployment target to 16.0 (required by Meta Wearables DAT SDK)
  config = withPodfileProperties(config, (config) => {
    config.modResults["ios.deploymentTarget"] = "16.0";
    return config;
  });

  // Also set deployment target in the Xcode project build settings
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const buildSettings = configurations[key].buildSettings;
      if (buildSettings?.PRODUCT_BUNDLE_IDENTIFIER) {
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "16.0";
      }
    }
    return config;
  });

  return withInfoPlist(config, (config) => {
    const plist = config.modResults;

    // URL scheme for Meta AI app callback — add to CFBundleURLTypes
    const urlTypes: { CFBundleURLSchemes: string[] }[] = plist.CFBundleURLTypes ?? [];
    const existingSchemes = urlTypes.flatMap((t) => t.CFBundleURLSchemes ?? []);
    if (!existingSchemes.includes(urlScheme)) {
      urlTypes.push({ CFBundleURLSchemes: [urlScheme] });
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
    const mwdatConfig: Record<string, string> = {
      AppLinkURLScheme: `${urlScheme}://`,
      MetaAppID: metaAppId,
      TeamID: "$(DEVELOPMENT_TEAM)",
    };
    if (props.clientToken) {
      mwdatConfig.ClientToken = props.clientToken;
    }
    plist.MWDAT = mwdatConfig;

    return config;
  });
};

export default withEMWDAT;
