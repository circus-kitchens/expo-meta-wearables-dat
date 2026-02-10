import type { UserConfig } from "@commitlint/types";
import { RuleConfigSeverity } from "@commitlint/types";

const expectedTypes = [
  "feat",
  "fix",
  "perf",
  "refactor",
  "docs",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
  "style",
];

/** @see https://commitlint.js.org/reference/configuration.html */
const Configuration: UserConfig = {
  plugins: [
    {
      rules: {
        "custom-type-enum": ({ type }) => {
          if (!type || !expectedTypes.includes(type)) {
            return [
              false,
              `❌ Invalid or missing commit type. Allowed types: ${expectedTypes.join(
                ", "
              )}\n\n✨ Examples:\n  git commit -m "feat: add new icon"\n  git commit -m "fix: correct button alignment"\n  git commit -m "docs: update README"`,
            ];
          }
          return [true];
        },
      },
    },
  ],
  rules: { "custom-type-enum": [RuleConfigSeverity.Error, "always"] },
};

export default Configuration;
