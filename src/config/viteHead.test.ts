import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { Plugin, UserConfig } from "vite";
import { harbourPress } from "./examples/harbour-press";

// Stand-in for whatever src/site.config.ts points at, to prove vite.config.ts follows it.
vi.mock("../site.config", async () => {
  const { harbourPress: base } = await import("./examples/harbour-press");
  return {
    siteConfig: {
      ...base,
      id: "new-client",
      businessName: "New Client",
      titles: { ...base.titles, home: "New Client · Demo" },
      metaDescription: "New Client demo.",
      icons: [{ rel: "icon", href: "new-client.svg", type: "image/svg+xml" }],
    },
  };
});

const indexHtml = readFileSync(join(process.cwd(), "index.html"), "utf8");

async function headFor(mode: string): Promise<string> {
  // vite.config.ts is Node build code outside the app tsconfig, so load it by path at runtime.
  const configPath = "../../vite.config.ts";
  const { default: factory } = await import(/* @vite-ignore */ configPath);
  const config = (typeof factory === "function"
    ? await factory({ mode, command: "build", isSsrBuild: false, isPreview: false })
    : factory) as UserConfig;
  const plugin = (config.plugins ?? []).flat().find((item) => (item as Plugin)?.name === "site-head") as Plugin;
  const hook = plugin.transformIndexHtml as (html: string) => string;
  return hook(indexHtml);
}

describe("vite head", () => {
  it("fills the head from src/site.config.ts", async () => {
    const head = await headFor("production");
    expect(head).toContain("<title>New Client · Demo</title>");
    expect(head).toContain('content="New Client demo."');
    expect(head).toContain('<link rel="icon" href="/booking-demo/new-client.svg" type="image/svg+xml" />');
    expect(head).not.toMatch(/saltbush/i);
  });

  it("uses Harbour Press and the Crom demo icon for the example build", async () => {
    const head = await headFor("example");
    expect(head).toContain(`<title>${harbourPress.titles.home}</title>`);
    expect(head).toContain("https://cromservices.github.io/crom-shared/brand/favicon/favicon.ico");
    expect(head).not.toMatch(/saltbush/i);
  });
});
