import { generateConfirmationCode } from "../domain/code";
import { buildCalendar } from "../domain/slots";
import {
  hasErrors,
  normalizeAuMobile,
  validateBookingForm,
} from "../domain/validation";
import { createSeed } from "./seed";
import type {
  Booking,
  BookingPatch,
  BookingStore,
  CreateBookingInput,
  DemoSnapshot,
  Service,
  ServiceInput,
} from "./types";

export class StoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoreError";
  }
}

function newId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${uuid}`;
}

export class MemoryBookingStore implements BookingStore {
  private data: DemoSnapshot;
  private listeners = new Set<() => void>();

  constructor(
    initial: DemoSnapshot,
    private readonly clock: () => Date = () => new Date(),
    private readonly random: () => number = Math.random,
  ) {
    this.data = structuredClone(initial);
  }

  now(): Date {
    return this.clock();
  }

  exportSnapshot(): DemoSnapshot {
    return structuredClone(this.data);
  }

  async listServices(): Promise<Service[]> {
    return structuredClone(this.data.services);
  }

  async listBookings(): Promise<Booking[]> {
    return structuredClone(this.data.bookings);
  }

  async createBooking(input: CreateBookingInput): Promise<Booking> {
    const errors = validateBookingForm({
      name: input.customerName,
      dogName: input.dogName,
      dogSize: input.dogSize,
      mobile: input.mobile,
      email: input.email,
      serviceId: input.serviceId,
      slotStart: input.slotStart,
      notes: input.notes,
    });
    if (hasErrors(errors)) {
      throw new StoreError(Object.values(errors)[0] ?? "Check the booking details.");
    }
    const service = this.data.services.find((item) => item.id === input.serviceId && item.active);
    if (!service) throw new StoreError("Choose a service that is on the menu.");
    const mobile = normalizeAuMobile(input.mobile);
    if (!mobile) throw new StoreError("Enter an Australian mobile, like 0412 345 678.");
    this.assertSlotOpen(input.slotStart, service.durationMinutes);

    const booking: Booking = {
      id: newId("bkg"),
      customerName: input.customerName.trim(),
      dogName: input.dogName.trim(),
      dogSize: input.dogSize,
      mobile,
      email: input.email.trim().toLowerCase(),
      serviceId: service.id,
      serviceName: service.name,
      priceCents: service.priceCents,
      durationMinutes: service.durationMinutes,
      slotStart: input.slotStart,
      notes: input.notes.trim(),
      status: "pending",
      emailVerified: false,
      confirmationCode: generateConfirmationCode(this.random),
      createdAt: this.now().toISOString(),
    };
    this.data = { ...this.data, bookings: [...this.data.bookings, booking] };
    this.emit();
    return structuredClone(booking);
  }

  async confirmBooking(id: string, code: string): Promise<Booking> {
    const booking = this.findBooking(id);
    if (booking.status === "cancelled") {
      throw new StoreError("This sample booking has been cancelled.");
    }
    if (booking.emailVerified) return structuredClone(booking);
    const entered = code.replace(/\D/g, "");
    if (entered.length !== 6) {
      throw new StoreError("Enter the 6-digit code from the sample email.");
    }
    if (entered !== booking.confirmationCode) {
      throw new StoreError("That code does not match the sample email.");
    }
    return this.replaceBooking({ ...booking, emailVerified: true });
  }

  async updateBooking(id: string, patch: BookingPatch): Promise<Booking> {
    const booking = this.findBooking(id);
    let next = { ...booking };

    if (patch.status && patch.status !== booking.status) {
      const allowed =
        (booking.status === "pending" && (patch.status === "confirmed" || patch.status === "cancelled")) ||
        (booking.status === "confirmed" && patch.status === "cancelled");
      if (!allowed) throw new StoreError("That status change is not available.");
      next = { ...next, status: patch.status };
    }

    if (patch.slotStart && patch.slotStart !== booking.slotStart) {
      if (booking.status === "cancelled" || next.status === "cancelled") {
        throw new StoreError("Cancelled bookings stay on their original time.");
      }
      this.assertSlotOpen(patch.slotStart, booking.durationMinutes, booking.id);
      next = { ...next, slotStart: patch.slotStart };
    }

    return this.replaceBooking(next);
  }

  async saveService(input: ServiceInput): Promise<Service> {
    const name = input.name.trim();
    const summary = input.summary.trim();
    if (name.length < 2 || name.length > 60) throw new StoreError("Enter a service name.");
    if (summary.length > 160) throw new StoreError("Keep the description shorter.");
    if (!Number.isInteger(input.priceCents) || input.priceCents <= 0 || input.priceCents > 100_000) {
      throw new StoreError("Enter a price in Australian dollars.");
    }
    if (
      !Number.isInteger(input.durationMinutes) ||
      input.durationMinutes < 15 ||
      input.durationMinutes > 240
    ) {
      throw new StoreError("Enter a duration from 15 to 240 minutes.");
    }

    if (input.id) {
      const existing = this.data.services.find((service) => service.id === input.id);
      if (!existing) throw new StoreError("That service is no longer in the sample list.");
      const updated: Service = {
        ...existing,
        name,
        summary,
        priceCents: input.priceCents,
        durationMinutes: input.durationMinutes,
        active: input.active,
      };
      this.data = {
        ...this.data,
        services: this.data.services.map((service) => (service.id === input.id ? updated : service)),
      };
      this.emit();
      return structuredClone(updated);
    }

    const created: Service = {
      id: newId("svc"),
      name,
      summary,
      priceCents: input.priceCents,
      durationMinutes: input.durationMinutes,
      active: input.active,
    };
    this.data = { ...this.data, services: [...this.data.services, created] };
    this.emit();
    return structuredClone(created);
  }

  async removeService(id: string): Promise<void> {
    this.data = {
      ...this.data,
      services: this.data.services.filter((service) => service.id !== id),
    };
    this.emit();
  }

  async resetDemoData(): Promise<void> {
    this.data = createSeed(this.now());
    this.emit();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private findBooking(id: string): Booking {
    const booking = this.data.bookings.find((item) => item.id === id);
    if (!booking) throw new StoreError("That booking is not in this browser.");
    return booking;
  }

  private replaceBooking(next: Booking): Booking {
    this.data = {
      ...this.data,
      bookings: this.data.bookings.map((booking) => (booking.id === next.id ? next : booking)),
    };
    this.emit();
    return structuredClone(next);
  }

  private assertSlotOpen(slotStart: string, durationMinutes: number, ignoreBookingId?: string): void {
    const calendar = buildCalendar({
      now: this.now(),
      durationMinutes,
      bookings: this.data.bookings
        .filter((booking) => booking.id !== ignoreBookingId)
        .map((booking) => ({
          slotStart: booking.slotStart,
          durationMinutes: booking.durationMinutes,
          status: booking.status,
        })),
    });
    const slot = calendar.flatMap((day) => day.slots).find((item) => item.start === slotStart);
    if (!slot) throw new StoreError("That time is outside the sample calendar.");
    if (!slot.available) throw new StoreError("That time has already been taken.");
  }

  private emit(): void {
    for (const listener of [...this.listeners]) listener();
  }
}
