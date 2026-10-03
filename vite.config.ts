import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vitest/config";
import { harbourPress } from "./src/config/examples/harbour-press.ts";
import { siteConfig } from "./src/site.config.ts";
import { applySiteHead } from "./src/theme/firm.ts";

const root = path.dirname(fileURLToPath(import.meta.url));
const siteConfigPath = path.join(root, "src/site.config.ts");
const exampleEntryPath = path.join(root, "src/config/examples/harbour-press-entry.ts");

function exampleConfigPlugin(enabled: boolean): Plugin {
  return {
    name: "example-site-config",
    enforce: "pre",
    resolveId(source, importer) {
      if (!enabled || !importer || !source.includes("site.config")) return null;
      const resolved = path.resolve(path.dirname(importer), source);
      const candidate = resolved.endsWith(".ts") ? resolved : `${resolved}.ts`;
      if (path.normalize(candidate) !== path.normalize(siteConfigPath)) return null;
      return exampleEntryPath;
    },
  };
}

export default defineConfig(({ mode }) => {
  const example = mode === "example";
  // The head follows the same config as the app: src/site.config.ts, or Harbour Press for the example build.
  const site = example ? harbourPress : siteConfig;
  const base = "/booking-demo/";
  return {
    base,
    plugins: [
      exampleConfigPlugin(example),
      react(),
      {
        name: "site-head",
        transformIndexHtml(html) {
          return applySiteHead(html, site, base);
        },
      },
    ],
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: false,
    },
  };
});
