import { defineConfig, globalIgnores } from "eslint/config"
import { fixupConfigRules } from "@eslint/compat"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"
import path from "node:path"
import { fileURLToPath } from "node:url"
import js from "@eslint/js"
import { FlatCompat } from "@eslint/eslintrc"
import tseslint from "typescript-eslint"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

// Helper function to trim keys in a globals object, so eslint won't throw an error
const trimGlobals = (globalsObj) => {
  return Object.fromEntries(
    Object.entries(globalsObj).map(([key, value]) => [key.trim(), value])
  )
}

export default defineConfig([
  globalIgnores([
    "**/dist",
    "**/.eslintrc.cjs",
    "**/vite.config.js",
    "**/**tests**",
  ]),
  {
    extends: fixupConfigRules(
      compat.extends(
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:react/jsx-runtime",
        "plugin:react-hooks/recommended"
      )
    ),
    files: ["src/**/*.js", "src/**/*.jsx"],
    plugins: {
      "react-refresh": reactRefresh,
    },

    languageOptions: {
      globals: {
        ...trimGlobals(globals.node),
        ...trimGlobals(globals.browser),
      },

      ecmaVersion: "latest",
      sourceType: "module",
    },

    settings: {
      react: {
        version: "18.3",
      },

      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },

    rules: {
      "no-console": "off",
      "no-undef": "off",

      "no-tabs": [
        "error",
        {
          allowIndentationTabs: true,
        },
      ],

      "no-unused-vars": "off",
      "react/prop-types": "off",
      "prefer-arrow-callback": "error",

      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],

      quotes: ["error", "double"],
      semi: ["error", "never"],

      "no-underscore-dangle": [
        "error",
        {
          allow: ["_id", "__v", "__MONGO_URI__"],
        },
      ],

      "react/no-unescaped-entities": 0,

      "max-len": [
        "error",
        {
          code: 1200,
        },
      ],

      "no-param-reassign": 0,
      "react/display-name": 0,
      "react/no-unknown-property": 0,
      "comma-dangle": 0,
      "object-curly-newline": 0,
      "operator-linebreak": 0,
      "no-alert": "off",
      "no-confirm": "off",
    },
  },
  // ---- TypeScript block. The JS block above stays for src/server/** forever. ----
  {
    extends: [
      ...fixupConfigRules(
        compat.extends(
          "plugin:react/recommended",
          "plugin:react/jsx-runtime",
          "plugin:react-hooks/recommended"
        )
      ),
      // `recommended`, NOT `recommendedTypeChecked`: type-aware linting needs
      // parserOptions.project and roughly triples lint time, for rules
      // (no-floating-promises) that would fire on every fire-and-forget dispatch().
      ...tseslint.configs.recommended,
    ],
    files: ["src/**/*.ts", "src/**/*.tsx"],
    plugins: {
      "react-refresh": reactRefresh,
    },

    languageOptions: {
      parser: tseslint.parser,
      globals: {
        ...trimGlobals(globals.node),
        ...trimGlobals(globals.browser),
      },

      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    settings: {
      react: {
        version: "18.3",
      },

      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },

    rules: {
      // --- carried over verbatim from the JS block ---
      "no-console": "off",

      "no-tabs": [
        "error",
        {
          allowIndentationTabs: true,
        },
      ],

      "react/prop-types": "off",
      "prefer-arrow-callback": "error",

      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],

      quotes: ["error", "double"],
      semi: ["error", "never"],

      "no-underscore-dangle": [
        "error",
        {
          allow: ["_id", "__v", "__MONGO_URI__", "__APP_VERSION__"],
        },
      ],

      "react/no-unescaped-entities": 0,

      "max-len": [
        "error",
        {
          code: 1200,
        },
      ],

      "no-param-reassign": 0,
      "react/display-name": 0,
      "react/no-unknown-property": 0,
      "comma-dangle": 0,
      "object-curly-newline": 0,
      "operator-linebreak": 0,
      "no-alert": "off",
      "no-confirm": "off",

      // --- TypeScript-specific ---
      // TS resolves identifiers itself; the base rules are unaware of type syntax.
      "no-undef": "off",
      "no-unused-vars": "off",
      // Mirrors the repo-wide policy of the JS block.
      "@typescript-eslint/no-unused-vars": "off",
      // We use a small, documented set of casts (each carries a TODO(ts): comment
      // naming the reason). A blocking rule would push people toward @ts-ignore.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",

      // Mechanical enforcement of "no permanent @ts-nocheck". @ts-expect-error is
      // self-healing: it errors once the underlying problem is fixed.
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": true,
          "ts-nocheck": true,
          "ts-check": false,
        },
      ],

      // Guard against Babel's type-elision hazard, not a style preference:
      // Jest transpiles file-by-file with no cross-file type info.
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
    },
  },
])
