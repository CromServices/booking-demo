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
    expect(bookings.some((booking) => booking.customerName === "Demo Harper")).toBe(true);
  });
});
