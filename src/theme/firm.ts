import type { HeaderLogo, SiteConfig } from "../config/types.ts";

/**
 * Default firm logo. The files are hosted with the Crom Services brand kit.
 * They may not resolve until that kit is published. The starter still renders
 * the picture element so a published file appears without a code change.
 */
export const defaultLogo: HeaderLogo = {
  light: "https://cromservices.com.au/brand/logo/crom-logo-v26-ink.png",
  dark: "https://cromservices.com.au/brand/logo/crom-logo-v26-white.png",
  alt: "Crom Services",
  width: 526,
  height: 481,
};

/** Dark page background from crom-shared theme.css v1 (`--bg`). */
export const FIRM_DARK_BG = "#1b1a17";

function declarations(tokens: Record<string, string>, indent: string): string {
  return Object.entries(tokens)
    .map(([key, value]) => `${indent}${key}: ${value};`)
    .join("\n");
}

function cssString(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

/** @font-face rules for config.fallbackFonts. Empty when there are none. */
export function fallbackFontCss(config: SiteConfig): string {
  const faces = config.fallbackFonts ?? [];
  return faces
    .map((face) => {
      const lines = [
        `font-family: ${cssString(face.family)};`,
        `src: ${face.local.map((name) => `local(${cssString(name)})`).join(", ")};`,
        face.weight ? `font-weight: ${face.weight};` : "",
        face.sizeAdjust ? `size-adjust: ${face.sizeAdjust};` : "",
        face.ascentOverride ? `ascent-override: ${face.ascentOverride};` : "",
        face.descentOverride ? `descent-override: ${face.descentOverride};` : "",
        face.lineGapOverride ? `line-gap-override: ${face.lineGapOverride};` : "",
      ].filter(Boolean);
      return `@font-face {\n${lines.map((line) => `  ${line}`).join("\n")}\n}\n`;
    })
    .join("");
}

/** Site-layer overrides. Empty when the config keeps the firm defaults. */
export function themeOverrideCss(config: SiteConfig): string {
  const light = config.theme?.light;
  const dark = config.theme?.dark;
  const root: Record<string, string> = {};
  if (dark === false) root["color-scheme"] = "light";
  if (light) Object.assign(root, light);
  const blocks: string[] = [];
  if (Object.keys(root).length > 0) {
    blocks.push(`:root {\n${declarations(root, "  ")}\n}`);
  }
  if (dark && typeof dark === "object" && Object.keys(dark).length > 0) {
    blocks.push(
      `@media (prefers-color-scheme: dark) {\n  :root:not([data-color-scheme="light"]) {\n${declarations(dark, "    ")}\n  }\n}`,
    );
  }
  const faces = fallbackFontCss(config);
  if (blocks.length === 0) return faces;
  return `@layer defaults, site;\n${faces}@layer site {\n${blocks.join("\n")}\n}\n`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function replaceWhenDifferent(html: string, pattern: RegExp, current: string, nextValue: string, wrap: (value: string) => string): string {
  if (current === nextValue) return html;
  return html.replace(pattern, wrap(escapeHtml(nextValue)));
}

/**
 * Points an icon link at a config file. A relative file keeps the link's base
 * prefix (%BASE_URL% in the template, or the resolved base during a build).
 */
function replaceIcon(html: string, rel: string, file: string | undefined): string {
  if (!file) return html;
  const pattern = new RegExp(`(<link rel="${rel}" href=")([^"]*)(")`);
  const match = html.match(pattern);
  if (!match) return html;
  const current = match[2];
  let nextHref: string;
  if (/^https?:\/\//.test(file)) {
    nextHref = file;
  } else {
    const prefix =
      current.startsWith("%BASE_URL%") || /^https?:\/\//.test(current)
        ? "%BASE_URL%"
        : current.slice(0, current.lastIndexOf("/") + 1);
    nextHref = `${prefix}${file.replace(/^\//, "")}`;
  }
  if (nextHref === current) return html;
  return html.replace(match[0], `${match[1]}${escapeHtml(nextHref)}${match[3]}`);
}

/**
 * Fills the document head from the active config.
 * Saltbush already matches index.html, so its text, font, and theme-color stay put.
 */
export function applySiteHead(html: string, config: SiteConfig): string {
  let next = html;
  if (config.theme?.dark === false && !next.includes("data-color-scheme=")) {
    next = next.replace('<html lang="en-AU">', '<html lang="en-AU" data-color-scheme="light">');
  }

  const title = next.match(/<title>([\s\S]*?)<\/title>/);
  if (title && title[1] !== config.titles.home) {
    next = next.replace(title[0], `<title>${escapeHtml(config.titles.home)}</title>`);
  }

  const description = next.match(/<meta\s+name="description"\s+content="([^"]*)"\s*\/?>/);
  if (description && description[1] !== config.metaDescription) {
    next = next.replace(description[0], `<meta name="description" content="${escapeHtml(config.metaDescription)}" />`);
  }

  const theme = next.match(/<meta name="theme-color" content="([^"]*)"\s*\/?>/);
  if (theme && theme[1] !== config.themeColor) {
    const darkMeta =
      config.theme?.dark === false
        ? ""
        : `\n    <meta name="theme-color" content="${FIRM_DARK_BG}" media="(prefers-color-scheme: dark)" />`;
    next = next.replace(theme[0], `<meta name="theme-color" content="${escapeHtml(config.themeColor)}" />${darkMeta}`);
  }

  next = replaceWhenDifferent(
    next,
    /href="https:\/\/fonts\.googleapis\.com\/css2[^"]*"/,
    next.match(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]*)"/)?.[1] ?? "",
    config.fontHref,
    (value) => `href="${value}"`,
  );

  next = replaceIcon(next, "icon", config.icons?.favicon);
  next = replaceIcon(next, "apple-touch-icon", config.icons?.appleTouch);

  const css = themeOverrideCss(config);
  if (css && !next.includes('id="site-theme"')) {
    next = next.replace("</head>", `<style id="site-theme">\n${css}</style>\n  </head>`);
  }
  return next;
}
