// @ts-nocheck
import { defineConfig } from "eslint/config";
import universeNativeConfig from "eslint-config-universe/flat/native";
import universeWebConfig from "eslint-config-universe/flat/web";

export default defineConfig([
  {
    ignores: ["build/"],
  },
  {
    extends: [universeNativeConfig, universeWebConfig],
  },
]);
