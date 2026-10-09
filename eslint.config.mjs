import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      /**
       * Downgraded to a warning, deliberately and temporarily.
       *
       * eslint-config-next 16 pulls eslint-plugin-react-hooks 7, which adds
       * the React Compiler rules. `set-state-in-effect` flags the
       * fetch-in-an-effect-then-setState pattern this codebase uses on
       * roughly every page — 36 call sites at the time of writing.
       *
       * The rule is right that this causes a cascading render, but those are
       * data loads on mount, not hot paths, and reworking 36 of them during
       * launch stabilisation carries more risk than the renders cost. Kept
       * as a warning so the signal stays visible and new ones are obvious.
       *
       * To clear it: move each load behind a `use()` / suspense boundary or
       * a data library, then restore this to "error" and delete this block.
       */
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next*/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
    "test-*.js",
  ]),
]);

export default eslintConfig;
