module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "airbnb-base",
    "airbnb/hooks",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs", "vite.config.js", "**tests**"],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  settings: {
    react: {
      version: "18.2",
    },
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx"],
      },
    },
  },
  plugins: ["react-refresh"],
  rules: {
    "no-console": "off",
    "no-unused-vars": "off",
    "react/prop-types": "off",
    "prefer-arrow-callback": "error",
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    quotes: ["error", "double"],
    semi: ["error", "never"],
    "no-underscore-dangle": ["error", { allow: ["_id", "__v"] }],
    "react/no-unescaped-entities": 0,
    "max-len": ["error", { code: 1200 }], // THIS IS TEMPORARY!!!
    "no-param-reassign": 0,
    "react/display-name": 0,
    "react/no-unknown-property": 0,
    "comma-dangle": 0,
    "object-curly-newline": 0,
  },
}
