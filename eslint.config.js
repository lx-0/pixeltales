import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // Add any project-specific rules or overrides here
  {
    rules: {
      // Example: Allow unused vars starting with _
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_.*$",
          varsIgnorePattern: "^_.*$",
          caughtErrorsIgnorePattern: "^_.*$",
        },
      ],
    },
  },
  eslintConfigPrettier, // Must be last to override other configs
);
