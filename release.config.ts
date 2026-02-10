import type { Options } from "semantic-release";

/** @see https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md */
const config: Options = {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "semantic-release-pnpm",
    "@semantic-release/git",
    "@semantic-release/github",
  ],
};

export default config;
