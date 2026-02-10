// @ts-nocheck
import { defineConfig } from "eslint/config";
import universeNativeConfig from "eslint-config-universe/flat/native";
import universeWebConfig from "eslint-config-universe/flat/web";
import globals from "globals";

export default defineConfig([
  { ignores: ["build/"] },
  { extends: [universeNativeConfig, universeWebConfig] },
  {
    files: ["**/*.config.{js,ts,mjs,cjs}"],
    languageOptions: { globals: globals.node },
  },
]);
