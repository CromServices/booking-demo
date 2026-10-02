import { describe, expect, it } from "vitest";
import { fixedClock, FIXED_NOW } from "../test/fixtures";
import { createLocalStorageBookingStore, STORAGE_KEY, type KeyValueStorage } from "./localStorageStore";
import { MemoryBookingStore } from "./memoryStore";
import { createSeed, SERVICE_IDS } from "./seed";

function memoryStorage(initial?: string): KeyValueStorage & { raw: () => string | null } {
  const map = new Map<string, string>();
  if (initial !== undefined) map.set(STORAGE_KEY, initial);
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
    raw: () => map.get(STORAGE_KEY) ?? null,
  };
}

describe("createLocalStorageBookingStore", () => {
  it("persists changes and restores them in a new adapter", async () => {
    const storage = memoryStorage();
    const clock = fixedClock();
    const first = createLocalStorageBookingStore(storage, STORAGE_KEY, clock);
    await first.saveService({
      name: "Paw balm",
      summary: "Sample add-on",
      priceCents: 2500,
      durationMinutes: 20,
      active: true,
    });
    const second = createLocalStorageBookingStore(storage, STORAGE_KEY, clock);
    const services = await second.listServices();
    expect(services.some((service) => service.name === "Paw balm")).toBe(true);
    await second.resetDemoData();
    const restored = await second.listServices();
    expect(restored.some((service) => service.name === "Paw balm")).toBe(false);
    expect(restored.some((service) => service.id === SERVICE_IDS.bath)).toBe(true);
    expect(JSON.parse(storage.raw() ?? "{}").version).toBe(1);
  });

  it("replaces corrupt saved data with the sample seed", async () => {
    const storage = memoryStorage("{not json");
    const store = createLocalStorageBookingStore(storage, STORAGE_KEY, fixedClock(FIXED_NOW));
    const bookings = await store.listBookings();
    expect(bookings.some((booking) => booking.customerName === "Mia Tran")).toBe(true);
  });

  it("shows a saved booking that has no dog details", async () => {
    const legacy = {
      version: 1,
      services: [
        {
          id: SERVICE_IDS.bath,
          name: "Bath & brush",
          summary: "Warm wash.",
          priceCents: 6500,
          durationMinutes: 60,
          active: true,
        },
      ],
      bookings: [
        {
          id: "bkg-old",
          customerName: "Old Client",
          mobile: "0400 000 444",
          email: "old.client@example.com",
          serviceId: SERVICE_IDS.bath,
          serviceName: "Bath & brush",
          priceCents: 6500,
          durationMinutes: 60,
          slotStart: "2026-10-06T02:30:00.000Z",
          notes: "",
          status: "pending",
          emailVerified: false,
          confirmationCode: "444444",
          createdAt: FIXED_NOW,
        },
      ],
    };
    const store = createLocalStorageBookingStore(
      memoryStorage(JSON.stringify(legacy)),
      STORAGE_KEY,
      fixedClock(FIXED_NOW),
    );
    const [booking] = await store.listBookings();
    expect(booking.customerName).toBe("Old Client");
    expect(booking.extras.dogName).toBe("");
    expect(booking.extras.dogSize).toBe("");
  });

  it("keeps extra answers saved on an older record", async () => {
    const legacy = {
      version: 1,
      services: [
        {
          id: SERVICE_IDS.bath,
          name: "Bath & brush",
          summary: "Warm wash.",
          priceCents: 6500,
          durationMinutes: 60,
          active: true,
        },
      ],
      bookings: [
        {
          id: "bkg-old",
          customerName: "Old Client",
          dogName: "Noodle",
          dogSize: "Small",
          mobile: "0400 000 444",
          email: "old.client@example.com",
          serviceId: SERVICE_IDS.bath,
          serviceName: "Bath & brush",
          priceCents: 6500,
          durationMinutes: 60,
          slotStart: "2026-10-06T02:30:00.000Z",
          notes: "",
          status: "pending",
          emailVerified: false,
          confirmationCode: "444444",
          createdAt: FIXED_NOW.toISOString(),
        },
      ],
    };
    const store = createLocalStorageBookingStore(
      memoryStorage(JSON.stringify(legacy)),
      STORAGE_KEY,
      fixedClock(FIXED_NOW),
    );
    const [booking] = await store.listBookings();
    expect(booking.extras).toEqual({ dogName: "Noodle", dogSize: "Small" });
  });

  it("reseeds when the saved snapshot version does not match", async () => {
    const storage = memoryStorage(
      JSON.stringify({
        version: 0,
        services: [],
        bookings: [
          {
            id: "bkg-stale",
            customerName: "Stale Client",
            extras: {},
            mobile: "0400 000 444",
            email: "stale@example.com",
            serviceId: SERVICE_IDS.bath,
            serviceName: "Bath & brush",
            priceCents: 6500,
            durationMinutes: 60,
            slotStart: "2026-10-06T02:30:00.000Z",
            notes: "",
            status: "pending",
            emailVerified: false,
            confirmationCode: "444444",
            createdAt: FIXED_NOW.toISOString(),
          },
        ],
      }),
    );
    const store = createLocalStorageBookingStore(storage, STORAGE_KEY, fixedClock(FIXED_NOW));
    const bookings = await store.listBookings();
    expect(bookings.some((booking) => booking.customerName === "Stale Client")).toBe(false);
    expect(bookings.some((booking) => booking.customerName === "Mia Tran")).toBe(true);
    expect(JSON.parse(storage.raw() ?? "{}").version).toBe(1);
  });

  it("deletes one booking from the memory store", async () => {
    const store = new MemoryBookingStore(createSeed(FIXED_NOW), fixedClock(FIXED_NOW));
    const before = await store.listBookings();
    await store.deleteBooking(before[0].id);
    const after = await store.listBookings();
    expect(after).toHaveLength(before.length - 1);
    expect(after.some((booking) => booking.id === before[0].id)).toBe(false);
  });

  it("deletes one booking from saved browser data", async () => {
    const storage = memoryStorage();
    const clock = fixedClock(FIXED_NOW);
    const first = createLocalStorageBookingStore(storage, STORAGE_KEY, clock);
    const before = await first.listBookings();
    await first.deleteBooking(before[0].id);
    const second = createLocalStorageBookingStore(storage, STORAGE_KEY, clock);
    const after = await second.listBookings();
    expect(after).toHaveLength(before.length - 1);
    expect(after.some((booking) => booking.id === before[0].id)).toBe(false);
    const saved = JSON.parse(storage.raw() ?? "{}") as { bookings: { id: string }[] };
    expect(saved.bookings.some((booking) => booking.id === before[0].id)).toBe(false);
  });
});
