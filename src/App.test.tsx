import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeStore } from "./test/fixtures";
import { renderAt } from "./test/render";

describe("hash routing", () => {
  it("opens the demo desk from a hash link", async () => {
    renderAt("#/admin", makeStore());
    expect(await screen.findByRole("heading", { name: "Demo desk" })).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(
      "Demo site by Crom Services. Not a real business. Sample data only. Emails are simulated.",
    );
    expect(screen.getByRole("link", { name: "cromservices@gmail.com" })).toHaveAttribute(
      "href",
      "mailto:cromservices@gmail.com",
    );
    const credit = screen.getByRole("link", { name: "Built by Crom Services" });
    expect(credit).toHaveAttribute("href", "https://cromservices.com.au");
    expect(credit.querySelector("img")?.getAttribute("src")).toMatch(
      /^https:\/\/cromservices\.com\.au\/brand\/credit\/crom-credit-mark-ink@1x\.png$/,
    );
  });

  it("shows the hero art as an SVG with a raster fallback", async () => {
    renderAt("#/", makeStore());
    const hero = await screen.findByRole("img", {
      name: "Illustration: a fluffy cream dog in a rust bandana sitting on a sand dune by the sea, with saltbush shrubs and a low sun",
    });
    expect(hero).toHaveAttribute("width", "720");
    expect(hero).toHaveAttribute("height", "840");
    expect(hero.getAttribute("src")).toMatch(/saltbush-v2-hero-720x840\.webp$/);
    const source = hero.closest("picture")?.querySelector("source");
    expect(source?.getAttribute("type")).toBe("image/svg+xml");
    expect(source?.getAttribute("srcset")).toMatch(/saltbush-v2-hero\.svg$/);
  });
});
