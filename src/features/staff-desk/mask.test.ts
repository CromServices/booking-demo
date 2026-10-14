import { describe, expect, it } from "vitest";
import { maskEmail, maskMobile } from "./mask";

describe("maskMobile", () => {
  it("keeps the first four and last three digits", () => {
    expect(maskMobile("0400 000 111")).toBe("0400 *** 111");
    expect(maskMobile("0400000111")).toBe("0400 *** 111");
    expect(maskMobile("+61 400 000 111")).toBe("6140 *** 111");
  });

  it("hides short, empty, and non-numeric values", () => {
    expect(maskMobile("")).toBe("***");
    expect(maskMobile("   ")).toBe("***");
    expect(maskMobile("04")).toBe("***");
    expect(maskMobile("040000")).toBe("***");
    expect(maskMobile("no digits")).toBe("***");
    expect(maskMobile("0400000")).toBe("0400 *** 000");
  });
});

describe("maskEmail", () => {
  it("keeps the first letter and the full domain", () => {
    expect(maskEmail("mia.tran@example.com")).toBe("m***@example.com");
    expect(maskEmail("  Sam.Okafor@example.com ")).toBe("S***@example.com");
    expect(maskEmail("a@example.com")).toBe("a***@example.com");
  });

  it("hides odd or incomplete addresses", () => {
    expect(maskEmail("")).toBe("***");
    expect(maskEmail("not-an-email")).toBe("***");
    expect(maskEmail("@example.com")).toBe("***");
    expect(maskEmail("name@")).toBe("***");
    expect(maskEmail("name@.com")).toBe("***");
    expect(maskEmail("name@example.")).toBe("***");
  });
});
