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
    "_backup/**",
    ".deadline-backup-*/**",
    ".remediation-backup-*/**",
    ".PRODUCTION_LOCK_BACKUP/**",
    "next-env.d.ts",
    "venv/**",
    ".venv/**",
    "scripts/**",
    "**/*.js",
    "**/*.mjs"
  ]),
]);

export default eslintConfig;
