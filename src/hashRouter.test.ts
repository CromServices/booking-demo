import { describe, expect, it } from "vitest";
import { parseHash } from "./hashRouter";

describe("parseHash", () => {
  it("reads hash paths and query strings", () => {
    expect(parseHash("").path).toBe("/");
    expect(parseHash("#/admin").path).toBe("/admin");
    expect(parseHash("#/book?service=svc-bath").path).toBe("/book");
    expect(parseHash("#/book?service=svc-bath").search.get("service")).toBe("svc-bath");
    expect(parseHash("#/book/").path).toBe("/book");
  });
});
