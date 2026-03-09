const path = require("path");

const cssRule = {
  test: /\.css$/,
  // CSS (including @radix-ui/themes/styles.css) is auto-injected into <head>
  // via style-loader — consumers need no separate CSS import step.
  use: ["style-loader", "css-loader"],
};

const tsRule = {
  test: /\.tsx?$/,
  use: { loader: "ts-loader", options: { transpileOnly: true } },
  exclude: /node_modules/,
};

module.exports = [
  // Build 1 — default export, React bundled in (for Vue, Angular, vanilla JS consumers)
  {
    entry: "./src/index.ts",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "index.js",
      library: { type: "module" },
    },
    experiments: { outputModule: true },
    resolve: { extensions: [".ts", ".tsx", ".js"] },
    module: { rules: [tsRule, cssRule] },
    externals: {},
    mode: "production",
    optimization: { minimize: false },
    performance: { hints: false }, // library bundles; size warnings not applicable
  },

  // Build 2 — /react subpath, React treated as peer dep (not bundled).
  // externalsType: 'module' is required when output.library.type is 'module'
  // so webpack generates `import x from "react"` rather than CJS require stubs.
  // react/jsx-runtime and react/jsx-dev-runtime must also be external so that
  // bundled deps (@radix-ui/themes, lucide-react, etc.) share the consumer's
  // single React instance — preventing the "duplicate React" runtime error.
  {
    entry: "./src/react/index.ts",
    output: {
      path: path.resolve(__dirname, "dist/react"),
      filename: "index.js",
      library: { type: "module" },
    },
    experiments: { outputModule: true },
    resolve: { extensions: [".ts", ".tsx", ".js"] },
    module: { rules: [tsRule, cssRule] },
    externalsType: "module",
    externals: {
      react: "react",
      "react-dom": "react-dom",
      "react-dom/client": "react-dom/client",
      "react/jsx-runtime": "react/jsx-runtime",
      "react/jsx-dev-runtime": "react/jsx-dev-runtime",
    },
    mode: "production",
    optimization: { minimize: false },
    performance: { hints: false },
  },

  // Build 3 — /controller subpath, headless, no React at all
  {
    entry: "./src/controller/index.ts",
    output: {
      path: path.resolve(__dirname, "dist/controller"),
      filename: "index.js",
      library: { type: "module" },
    },
    experiments: { outputModule: true },
    resolve: { extensions: [".ts", ".tsx", ".js"] },
    module: { rules: [tsRule] },
    externals: {},
    mode: "production",
    optimization: { minimize: false },
  },
];
