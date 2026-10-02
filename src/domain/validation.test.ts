import { describe, expect, it } from "vitest";
import {
  bookingMessages,
  dollarsToCents,
  normalizeAuMobile,
  validateBookingForm,
  validateServiceDraft,
  type BookingFormValues,
} from "./validation";

const valid: BookingFormValues = {
  name: "Mia Tran",
  dogName: "Noodle",
  dogSize: "Small",
  mobile: "0412 345 678",
  email: "mia.tran@example.com",
  serviceId: "svc-bath",
  slotStart: "2026-10-05T01:30:00.000Z",
  notes: "",
};

describe("validateBookingForm", () => {
  it("accepts a complete booking", () => {
    expect(validateBookingForm(valid)).toEqual({});
  });

  it("accepts Australian mobile shapes and rejects other numbers", () => {
    for (const mobile of ["0412345678", "0412 345 678", "+61 412 345 678", "61412345678", "(0412) 345-678"]) {
      expect(normalizeAuMobile(mobile)).toBe("0412 345 678");
      expect(validateBookingForm({ ...valid, mobile })).toEqual({});
    }
    for (const mobile of ["", "12345", "0212345678", "041234567", "04123456789", "+1 202 555 0142"]) {
      expect(validateBookingForm({ ...valid, mobile }).mobile).toBe(bookingMessages.mobile);
    }
  });

  it("checks name, email, service, slot, and notes", () => {
    expect(validateBookingForm({ ...valid, name: "A" }).name).toBe(bookingMessages.name);
    expect(validateBookingForm({ ...valid, name: "Mary-Jane" })).toEqual({});
    expect(validateBookingForm({ ...valid, email: "not-an-email" }).email).toBe(bookingMessages.email);
    expect(validateBookingForm({ ...valid, serviceId: "" }).serviceId).toBe(bookingMessages.service);
    expect(validateBookingForm({ ...valid, slotStart: "" }).slotStart).toBe(bookingMessages.slot);
    expect(validateBookingForm({ ...valid, notes: "x".repeat(401) }).notes).toBe(bookingMessages.notes);
    expect(validateBookingForm({ ...valid, notes: "x".repeat(400) })).toEqual({});
    expect(validateBookingForm({ ...valid, dogName: "" }).dogName).toBe(bookingMessages.dogName);
    expect(validateBookingForm({ ...valid, dogSize: "" }).dogSize).toBe(bookingMessages.dogSize);
    expect(validateBookingForm({ ...valid, dogSize: "Huge" as BookingFormValues["dogSize"] }).dogSize).toBe(
      bookingMessages.dogSize,
    );
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
