import { describe, expect, it } from "vitest";
import { fixedClock, FIXED_NOW } from "../test/fixtures";
import { createLocalStorageBookingStore, STORAGE_KEY, type KeyValueStorage } from "./localStorageStore";
import { SERVICE_IDS } from "./seed";

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
    expect(booking.dogName).toBe("");
    expect(booking.dogSize).toBe("");
  });
});
