import { describe, expect, it } from "vitest";
import { saltbush } from "../config/saltbush";
import {
  bookingMessages,
  dollarsToCents,
  normalizeAuMobile,
  validateBookingForm,
  validateServiceDraft,
  type BookingFormValues,
} from "./validation";

const fields = saltbush.extraFields;
const dogNameMessage = fields.find((field) => field.id === "dogName")?.messages.required;
const dogSizeMessage = fields.find((field) => field.id === "dogSize")?.messages.required;

const valid: BookingFormValues = {
  name: "Mia Tran",
  extras: { dogName: "Noodle", dogSize: "Small" },
  mobile: "0412 345 678",
  email: "mia.tran@example.com",
  serviceId: "svc-bath",
  slotStart: "2026-10-05T01:30:00.000Z",
  notes: "",
};

function validate(values: BookingFormValues) {
  return validateBookingForm(values, fields);
}

describe("validateBookingForm", () => {
  it("accepts a complete booking", () => {
    expect(validate(valid)).toEqual({});
  });

  it("accepts Australian mobile shapes and rejects other numbers", () => {
    for (const mobile of ["0412345678", "0412 345 678", "+61 412 345 678", "61412345678", "(0412) 345-678"]) {
      expect(normalizeAuMobile(mobile)).toBe("0412 345 678");
      expect(validate({ ...valid, mobile })).toEqual({});
    }
    for (const mobile of ["", "12345", "0212345678", "041234567", "04123456789", "+1 202 555 0142"]) {
      expect(validate({ ...valid, mobile }).mobile).toBe(bookingMessages.mobile);
    }
  });

  it("checks name, email, service, slot, and notes", () => {
    expect(validate({ ...valid, name: "A" }).name).toBe(bookingMessages.name);
    expect(validate({ ...valid, name: "Mary-Jane" })).toEqual({});
    expect(validate({ ...valid, email: "not-an-email" }).email).toBe(bookingMessages.email);
    expect(validate({ ...valid, serviceId: "" }).serviceId).toBe(bookingMessages.service);
    expect(validate({ ...valid, slotStart: "" }).slotStart).toBe(bookingMessages.slot);
    expect(validate({ ...valid, notes: "x".repeat(401) }).notes).toBe(bookingMessages.notes);
    expect(validate({ ...valid, notes: "x".repeat(400) })).toEqual({});
    expect(validate({ ...valid, extras: { ...valid.extras, dogName: "" } }).extras?.dogName).toBe(dogNameMessage);
    expect(validate({ ...valid, extras: { ...valid.extras, dogSize: "" } }).extras?.dogSize).toBe(dogSizeMessage);
    expect(validate({ ...valid, extras: { ...valid.extras, dogSize: "Huge" } }).extras?.dogSize).toBe(dogSizeMessage);
  });
});

describe("validateServiceDraft", () => {
  it("accepts dollars and a duration in range", () => {
    expect(dollarsToCents("65.50")).toBe(6550);
    expect(dollarsToCents("0")).toBeNull();
    expect(
      validateServiceDraft({
        name: "Paw balm",
        summary: "A sample add-on.",
        price: "25",
        duration: "20",
        active: true,
      }),
    ).toEqual({});
    expect(
      validateServiceDraft({ name: "", summary: "", price: "free", duration: "5", active: true }).name,
    ).toBeTruthy();
  });
});
