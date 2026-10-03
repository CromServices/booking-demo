import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Layout } from "../components/Layout";
import { calendarWindow } from "../domain/hours";
import { validateBookingForm, type BookingFormValues } from "../domain/validation";
import { HashRouter } from "../hashRouter";
import { BookPage } from "../pages/BookPage";
import { MemoryBookingStore } from "../store/memoryStore";
import { BookingStoreProvider } from "../store/context";
import { createSeed } from "../store/seed";
import { fixedClock, FIXED_NOW } from "../test/fixtures";
import { SiteProvider } from "./context";
import { harbourPress } from "./examples/harbour-press";
import { saltbush } from "./saltbush";
import { siteConfig } from "../site.config";
import { applySiteHead, themeOverrideCss } from "../theme/firm";

const styles = readFileSync(join(process.cwd(), "src/styles.css"), "utf8");
const indexHtml = readFileSync(join(process.cwd(), "index.html"), "utf8");

describe("site config", () => {
  it("loads Saltbush as the active site", () => {
    expect(siteConfig).toBe(saltbush);
    expect(siteConfig.businessName).toBe("Saltbush Dog Grooming");
    expect(siteConfig.storage).toEqual({ key: "saltbush-booking-demo-v1", version: 1 });
    expect(siteConfig.credit).toBe("light");
    expect(siteConfig.theme?.dark).toBe(false);
    expect(siteConfig.headerArt).toMatchObject({
      src: "saltbush-v2-header-light.svg",
      width: 281,
      height: 80,
      alt: "Saltbush Dog Grooming",
    });
    expect(siteConfig.heroArt).toMatchObject({ src: "saltbush-v2-hero.svg", width: 720, height: 840 });
    expect(siteConfig.extraFields.map((field) => field.id)).toEqual(["dogName", "dogSize"]);
  });

  it("keeps a second business on the default firm skin", () => {
    expect(harbourPress.businessName).toBe("Harbour Press");
    expect("theme" in harbourPress).toBe(false);
    expect(harbourPress.credit).toBe("system");
    expect("headerArt" in harbourPress).toBe(false);
    expect(harbourPress.storage.key).not.toBe(saltbush.storage.key);
    expect(harbourPress.extraFields.some((field) => /dog/i.test(field.id + field.label))).toBe(false);
    expect(themeOverrideCss(harbourPress)).toBe("");
  });

  it("pins Saltbush to its light client theme", () => {
    const css = themeOverrideCss(saltbush);
    expect(css).toContain("color-scheme: light");
    expect(css).toContain("--footer-bg: #ebe4d8");
    expect(css).not.toContain("prefers-color-scheme");
    const head = applySiteHead(indexHtml, saltbush);
    expect(head).toContain('data-color-scheme="light"');
    expect(head).toContain("<title>Saltbush Dog Grooming · Demo</title>");
    expect(head).toContain("--footer-bg: #ebe4d8");
    expect(head).toContain("family=Bricolage+Grotesque:opsz,wght@12..96,600..800&family=Outfit");
    expect(head).toContain("display=swap");
    expect(head).toContain('<link rel="icon" href="%BASE_URL%saltbush-v2-favicon.svg"');
    expect(head).toContain('<link rel="apple-touch-icon" href="%BASE_URL%saltbush-v2-apple-touch-180.png"');
    expect(head).not.toContain("crom-shared/brand/favicon");
    expect(css).toContain('font-family: "Bricolage Fallback";');
    expect(css).toContain("size-adjust: 92%;");
    expect(css).toContain("--h1-weight: 750");
    expect(css).toContain("--lockup-height: 52px");
  });

  it("uses the Crom demo icon unless a config brings its own", () => {
    expect(indexHtml).not.toMatch(/rel="(icon|apple-touch-icon)"/);
    const example = applySiteHead(indexHtml, harbourPress);
    const base = "https://cromservices.github.io/crom-shared/brand/favicon/";
    expect(example).toContain(`<link rel="icon" href="${base}favicon.ico" sizes="any" />`);
    expect(example).toContain(`<link rel="icon" href="${base}favicon.svg" type="image/svg+xml" />`);
    expect(example).toContain(`<link rel="apple-touch-icon" href="${base}apple-touch-icon.png" />`);
    expect(example).not.toMatch(/saltbush/i);

    const own = applySiteHead(
      indexHtml,
      { ...harbourPress, icons: [{ rel: "icon", href: "press-icon.svg", type: "image/svg+xml" }] },
      "/booking-demo/",
    );
    expect(own).toContain('<link rel="icon" href="/booking-demo/press-icon.svg" type="image/svg+xml" />');
    expect(own).not.toContain("crom-shared/brand/favicon");
  });

  it("keeps the firm dark colours and the shared green dot token", () => {
    const dark = styles.slice(styles.indexOf("prefers-color-scheme: dark"));
    const colourBlock = dark.slice(0, dark.indexOf("}"));
    for (const token of ["#1b1a17", "#26241f", "#24221d", "#f3f1ec", "#a7a399", "#38352e", "#111111"]) {
      expect(colourBlock).toContain(token);
    }
    expect(colourBlock).not.toMatch(/radius|font-family|padding|letter-spacing/);
    const greens = [...styles.matchAll(/--accent-green:\s*([^;]+);/g)].map((match) => match[1]);
    expect(greens).toEqual(["#4caf78", "#4caf78"]);
    expect(styles).not.toContain("var(--accent-green)");
    const exampleHead = applySiteHead(indexHtml, harbourPress);
    expect(exampleHead).not.toContain('data-color-scheme="light"');
    expect(exampleHead).toContain("<title>Harbour Press · Demo</title>");
    expect(exampleHead).toContain("family=Inter");
  });
});

describe("default logo", () => {
  it("uses the Saltbush header art on its own", () => {
    render(
      <SiteProvider config={saltbush}>
        <HashRouter>
          <Layout>
            <p>Home</p>
          </Layout>
        </HashRouter>
      </SiteProvider>,
    );
    expect(document.querySelector("picture")).toBeNull();
    const logo = screen.getByRole("img", { name: "Saltbush Dog Grooming" });
    expect(logo).toHaveAttribute("width", "281");
    expect(logo).toHaveAttribute("height", "80");
    expect(logo.getAttribute("src")).toContain("saltbush-v2-header-light.svg");
    expect(screen.getAllByRole("link", { name: "Built by Crom Services" })).toHaveLength(1);
  });

  it("swaps the firm logo with a picture source when dark mode is enabled", () => {
    render(
      <SiteProvider config={harbourPress}>
        <HashRouter>
          <Layout>
            <p>Home</p>
          </Layout>
        </HashRouter>
      </SiteProvider>,
    );
    const source = document.querySelector("picture source");
    const image = screen.getByRole("img", { name: "Crom Services" });
    expect(source?.getAttribute("media")).toBe("(prefers-color-scheme: dark)");
    expect(source?.getAttribute("srcset")).toMatch(/^https:\/\//);
    expect(image.getAttribute("src")).toMatch(/^https:\/\//);
    expect(image.getAttribute("src")).not.toBe(source?.getAttribute("srcset"));
  });
});

describe("extra fields", () => {
  it("validates and stores answers from the config, not a fixed pet model", async () => {
    const user = userEvent.setup();
    const config = {
      ...saltbush,
      extraFields: [
        {
          id: "jobName",
          label: "Job name",
          kind: "text" as const,
          required: true,
          pattern: "^[\\p{L}][\\p{L} .'-]{0,40}$",
          patternFlags: "u",
          messages: { required: "Enter a job name.", invalid: "Enter a job name." },
        },
        {
          id: "stock",
          label: "Stock",
          kind: "select" as const,
          required: true,
          emptyLabel: "Choose a stock",
          options: ["Cotton", "Recycled"],
          messages: { required: "Choose a stock.", invalid: "Choose a stock." },
        },
      ],
    };
    const blank: BookingFormValues = {
      name: "Ada Okonkwo",
      mobile: "0412 345 678",
      email: "ada@example.com",
      serviceId: "svc-cards",
      slotStart: "2026-10-06T02:00:00.000Z",
      notes: "",
      extras: { jobName: "", stock: "Linen" },
    };
    expect(validateBookingForm(blank, config.extraFields).extras).toEqual({
      jobName: "Enter a job name.",
      stock: "Choose a stock.",
    });

    const store = new MemoryBookingStore(createSeed(FIXED_NOW, config), fixedClock(FIXED_NOW), Math.random, config);
    window.location.hash = "#/book";
    render(
      <SiteProvider config={config}>
        <BookingStoreProvider store={store}>
          <HashRouter>
            <Layout>
              <BookPage />
            </Layout>
          </HashRouter>
        </BookingStoreProvider>
      </SiteProvider>,
    );

    expect(screen.queryByLabelText("Dog's name")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Request this time" }));
    expect(screen.getByText("Enter a job name.")).toBeInTheDocument();
    expect(screen.getByText("Choose a stock.")).toBeInTheDocument();

    await user.click(await screen.findByRole("radio", { name: /Bath & brush/ }));
    await user.click(screen.getByRole("button", { name: "9:30 am available" }));
    await user.type(screen.getByLabelText("Name"), "Test Visitor");
    await user.type(screen.getByLabelText("Job name"), "Recital");
    await user.selectOptions(screen.getByLabelText("Stock"), "Cotton");
    await user.type(screen.getByLabelText("Mobile"), "0412 345 678");
    await user.type(screen.getByLabelText("Email"), "test.visitor@example.com");
    await user.click(screen.getByRole("button", { name: "Request this time" }));

    expect(await screen.findByRole("heading", { name: "Simulated confirmation email" })).toBeInTheDocument();
    const saved = (await store.listBookings()).find((booking) => booking.customerName === "Test Visitor");
    expect(saved?.extras).toEqual({ jobName: "Recital", stock: "Cotton" });
    expect(calendarWindow(config).horizonDays).toBe(14);
  });
});
