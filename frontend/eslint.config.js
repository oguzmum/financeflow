import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules", "src/api/schema.d.ts"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"],
  {
    languageOptions: { globals: globals.browser },
    rules: {
      // ADR-0001: money is integer cents; never parse amounts with parseFloat (use the Cents helpers, WP-21)
      "no-restricted-globals": [
        "error",
        { name: "parseFloat", message: "Parse amounts as strings into cents (ADR-0001)." },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "Number",
          property: "parseFloat",
          message: "Parse amounts as strings into cents (ADR-0001).",
        },
      ],
    },
  },
);
