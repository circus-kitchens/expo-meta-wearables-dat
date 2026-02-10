// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const fs = require("fs");
const path = require("path");

const config = getDefaultConfig(__dirname);

const monorepoRoot = path.resolve(__dirname, "..");

// Escape special regex characters in file paths
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Block root's react and react-native to prevent duplicate instances.
// With pnpm, node_modules entries are symlinks into .pnpm/; we need to
// block both the symlink path and the resolved (real) path.
const packagesToBlock = ["react", "react-native"];
const blockPatterns = [...Array.from(config.resolver.blockList ?? [])];

for (const pkg of packagesToBlock) {
  const symlinkPath = path.resolve(monorepoRoot, "node_modules", pkg);
  blockPatterns.push(new RegExp(escape(symlinkPath) + "(/.*|$)"));
  try {
    const resolvedPath = fs.realpathSync(symlinkPath);
    if (resolvedPath !== symlinkPath) {
      blockPatterns.push(new RegExp(escape(resolvedPath) + "(/.*|$)"));
    }
  } catch {}
}

config.resolver.blockList = blockPatterns;

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Force react and react-native to resolve from example's node_modules
config.resolver.extraNodeModules = {
  "expo-meta-wearables-dat": monorepoRoot,
  react: path.resolve(__dirname, "node_modules", "react"),
  "react-native": path.resolve(__dirname, "node_modules", "react-native"),
};

config.watchFolders = [monorepoRoot];

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
