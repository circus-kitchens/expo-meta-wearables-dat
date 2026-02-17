import {
  type ConfigPlugin,
  withInfoPlist,
  withPodfileProperties,
  withXcodeProject,
} from "expo/config-plugins";

type EMWDATPluginProps = {
  /** URL scheme for Meta AI app callback (required). Do not include "://". */
  urlScheme: string;
  /** Meta App ID — omit or use "" for Developer Mode (default). Published apps get a dedicated value from the Wearables Developer Center. */
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

  const metaAppId = props.metaAppId ?? "";
  const bluetoothDescription =
    props.bluetoothUsageDescription ?? "This app uses Bluetooth to connect to Meta Wearables.";

  // Set iOS deployment target to 16.0 (required by Meta Wearables DAT SDK)
  config = withPodfileProperties(config, (config) => {
    config.modResults["ios.deploymentTarget"] = "16.0";
    return config;
  });

  // Set deployment target + embed MWDAT dynamic frameworks in the Xcode project
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;

    // Set deployment target on all app-level build configurations
    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const buildSettings = configurations[key].buildSettings;
      if (buildSettings?.PRODUCT_BUNDLE_IDENTIFIER) {
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "16.0";
      }
    }

    // Embed MWDATCamera & MWDATCore dynamic frameworks.
    // The SPM products are linked via spm_dependency in the podspec but CocoaPods
    // doesn't embed them — we add a shell script build phase to copy + sign them.
    const target = project.getFirstTarget().uuid;
    const shellScript = `
FRAMEWORKS=("MWDATCamera" "MWDATCore" "MWDATMockDevice")
for fw in "\${FRAMEWORKS[@]}"; do
  SRC="\${BUILT_PRODUCTS_DIR}/\${fw}.framework"
  DST="\${BUILT_PRODUCTS_DIR}/\${FRAMEWORKS_FOLDER_PATH}/\${fw}.framework"
  if [ -d "\${SRC}" ]; then
    mkdir -p "$(dirname "\${DST}")"
    cp -R "\${SRC}" "\${DST}"
    if [ -n "\${EXPANDED_CODE_SIGN_IDENTITY}" ]; then
      codesign --force --sign "\${EXPANDED_CODE_SIGN_IDENTITY}" --preserve-metadata=identifier,entitlements "\${DST}"
    fi
  fi
done
`.trim();

    project.addBuildPhase([], "PBXShellScriptBuildPhase", "Embed MWDAT Frameworks", target, {
      shellPath: "/bin/sh",
      shellScript,
      inputPaths: [
        '"${BUILT_PRODUCTS_DIR}/MWDATCamera.framework"',
        '"${BUILT_PRODUCTS_DIR}/MWDATCore.framework"',
        '"${BUILT_PRODUCTS_DIR}/MWDATMockDevice.framework"',
      ],
      outputPaths: [
        '"${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/MWDATCamera.framework"',
        '"${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/MWDATCore.framework"',
        '"${BUILT_PRODUCTS_DIR}/${FRAMEWORKS_FOLDER_PATH}/MWDATMockDevice.framework"',
      ],
    });

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
