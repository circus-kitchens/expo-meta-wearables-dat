import { type ConfigPlugin, withInfoPlist, withXcodeProject } from "expo/config-plugins";

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

/** Shell script that embeds MWDAT dynamic frameworks into the app bundle. */
const EMBED_MWDAT_SCRIPT = `
# Embed Meta Wearables DAT dynamic frameworks (MWDATCamera, MWDATCore)
FRAMEWORKS_DIR="\${BUILT_PRODUCTS_DIR}/\${FRAMEWORKS_FOLDER_PATH}"
mkdir -p "\${FRAMEWORKS_DIR}"

for fw in MWDATCamera MWDATCore; do
  SRC="\${BUILT_PRODUCTS_DIR}/\${fw}.framework"
  if [ -d "\${SRC}" ]; then
    rsync -av --delete "\${SRC}/" "\${FRAMEWORKS_DIR}/\${fw}.framework/"
    if [ "\${CODE_SIGNING_ALLOWED}" != "NO" ] && [ -n "\${EXPANDED_CODE_SIGN_IDENTITY}" ]; then
      /usr/bin/codesign --force --sign "\${EXPANDED_CODE_SIGN_IDENTITY}" --preserve-metadata=identifier,entitlements "\${FRAMEWORKS_DIR}/\${fw}.framework"
    fi
  fi
done
`;

const EMBED_PHASE_NAME = "[EMWDAT] Embed Frameworks";

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

  // Embed MWDAT dynamic frameworks via a shell script build phase
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const target = project.getFirstTarget()?.firstTarget;
    if (!target) return config;

    // Avoid duplicate phases
    const phases = target.buildPhases ?? [];
    const alreadyAdded = phases.some((p: any) => p.comment === EMBED_PHASE_NAME);
    if (!alreadyAdded) {
      project.addBuildPhase([], "PBXShellScriptBuildPhase", EMBED_PHASE_NAME, target.uuid, {
        shellPath: "/bin/sh",
        shellScript: EMBED_MWDAT_SCRIPT,
      });
    }

    return config;
  });

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
    const mwdatConfig: Record<string, string> = {
      AppLinkURLScheme: `${urlScheme}://`,
      MetaAppID: metaAppId,
    };
    if (props.clientToken) {
      mwdatConfig.ClientToken = props.clientToken;
    }
    plist.MWDAT = mwdatConfig;

    return config;
  });
};

export default withEMWDAT;
