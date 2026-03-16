/**
 * Rollup build — replaces webpack for all three library entry points.
 *
 * WHY ROLLUP INSTEAD OF WEBPACK:
 *   Webpack always embeds its own runtime (__webpack_modules__, __webpack_require__,
 *   style-loader IIFE, etc.) into the output bundle.  When a consumer app that also
 *   uses webpack (e.g. CRA 4 / webpack 4) loads that bundle, two webpack runtimes
 *   collide → "__webpack_modules__[moduleId] is not a function" and similar crashes.
 *
 *   Rollup produces flat, runtime-free CJS output — just the code, with require()
 *   calls for externals.  Any bundler (webpack 4, webpack 5, Vite, …) can consume it
 *   without conflict.
 *
 * BUILD TARGETS:
 *   Build 1  dist/index.js          — React BUNDLED IN   (vanilla JS / non-React consumers)
 *   Build 2  dist/react/index.js    — React EXTERNAL     (CRA 4 and all React apps)
 *   Build 3  dist/controller/index.js — No React         (headless controller only)
 */

import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import babel from "@rollup/plugin-babel";
import postcss from "rollup-plugin-postcss";

// ---------------------------------------------------------------------------
// Shared plugin sets
// ---------------------------------------------------------------------------

/** Resolve node_modules (prefer ESM .mjs files when available). */
const resolvePlugin = resolve({
  extensions: [".ts", ".tsx", ".mjs", ".js"],
  browser: true, // prefer browser-friendly entry points
  preferBuiltins: false,
});

/** Handle CommonJS dependencies (eventemitter3, object-hash, etc.). */
const cjsPlugin = commonjs({ include: /node_modules/ });

/**
 * TypeScript: compile .ts/.tsx without emitting declarations here
 * (tsc --emitDeclarationOnly is run separately via the build script).
 */
const tsPlugin = typescript({
  tsconfig: "./tsconfig.json",
  declaration: false, // handled by tsc --emitDeclarationOnly
  declarationMap: false,
});

/**
 * Babel: transpile ES2020+ syntax (optional chaining ?., nullish coalescing ??,
 * logical-assignment operators) that acorn@6 / webpack 4 cannot parse.
 *
 * Targeting Chrome 70 forces Babel to compile away all ES2020 features while
 * keeping the output reasonably modern (no IE 11 boilerplate).
 *
 * `babelHelpers: "bundled"` inlines helpers — no @babel/runtime peer dep needed.
 */
const babelPlugin = babel({
  extensions: [".ts", ".tsx", ".mjs", ".js"],
  babelHelpers: "bundled",
  include: ["src/**/*", "node_modules/**/*"],
  presets: [["@babel/preset-env", { targets: { chrome: "70" }, modules: false }]],
});

/**
 * PostCSS: bundle src/styles/index.css and inject it into the DOM at runtime
 * via a tiny inline snippet (<style> tag injection).  No separate .css file
 * needed — zero consumer configuration.
 */
const cssPlugin = postcss({ inject: true, minimize: true });

// ---------------------------------------------------------------------------
// Rollup configs
// ---------------------------------------------------------------------------

/** React externals shared by Build 2 (React is a peer dep, not bundled). */
const reactExternals = ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"];

/**
 * Suppress known-harmless build warnings:
 *
 *  MODULE_LEVEL_DIRECTIVE — Radix UI and react-hot-toast ship "use client"
 *    directives (React Server Components metadata) at the top of their .mjs
 *    files.  These are meaningless in a client-only bundle; Rollup correctly
 *    ignores them and emits this warning.  Safe to silence.
 *
 *  CIRCULAR_DEPENDENCY — Some React internal packages have cycles.  They work
 *    correctly at runtime; the warning is purely informational.
 */
function onwarn(warning, defaultWarn) {
  if (warning.code === "MODULE_LEVEL_DIRECTIVE") return; // "use client" from RSC packages
  if (warning.code === "CIRCULAR_DEPENDENCY") return; // React internal cycles
  if (warning.code === "SOURCEMAP_ERROR") return; // orphaned source-map lookups from node_modules
  defaultWarn(warning);
}

export default [
  // ── Build 1: dist/index.js — React BUNDLED IN ──────────────────────────
  {
    input: "src/index.ts",
    output: { file: "dist/index.js", format: "cjs", exports: "named", interop: "auto" },
    // No externals — bundle React + everything so vanilla-JS consumers get
    // a single self-contained file.
    plugins: [resolvePlugin, cjsPlugin, tsPlugin, babelPlugin, cssPlugin],
    onwarn,
  },

  // ── Build 2: dist/react/index.js — React EXTERNAL ──────────────────────
  {
    input: "src/react/index.ts",
    output: { file: "dist/react/index.js", format: "cjs", exports: "named", interop: "auto" },
    external: reactExternals,
    plugins: [resolvePlugin, cjsPlugin, tsPlugin, babelPlugin, cssPlugin],
    onwarn,
  },

  // ── Build 3: dist/controller/index.js — Headless, no React ─────────────
  {
    input: "src/controller/index.ts",
    output: { file: "dist/controller/index.js", format: "cjs", exports: "named", interop: "auto" },
    // No React here; bundle eventemitter3 + object-hash only.
    plugins: [resolvePlugin, cjsPlugin, tsPlugin, babelPlugin],
    onwarn,
  },
];
