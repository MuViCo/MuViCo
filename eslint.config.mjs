import { defineConfig, globalIgnores } from "eslint/config"
import { fixupConfigRules } from "@eslint/compat"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"
import path from "node:path"
import { fileURLToPath } from "node:url"
import js from "@eslint/js"
import { FlatCompat } from "@eslint/eslintrc"

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
          extensions: [".js", ".jsx"],
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
          allow: ["_id", "__v"],
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
])
