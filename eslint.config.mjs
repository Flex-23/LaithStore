import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // These fire on idiomatic synchronization effects we use intentionally:
      // localStorage hydration, reading the DOM theme class on mount, resetting
      // menus on route change, and responding to Server Action results.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
