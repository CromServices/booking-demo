import { createSeed } from "./seed";
import { MemoryBookingStore } from "./memoryStore";
import type { BookingStore, DemoSnapshot } from "./types";

export const STORAGE_KEY = "saltbush-booking-demo-v1";

export type KeyValueStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function isSnapshot(value: unknown): value is DemoSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as DemoSnapshot;
  return snapshot.version === 1 && Array.isArray(snapshot.services) && Array.isArray(snapshot.bookings);
}

function readSnapshot(storage: KeyValueStorage, key: string): DemoSnapshot | null {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function createLocalStorageBookingStore(
  storage: KeyValueStorage = window.localStorage,
  key = STORAGE_KEY,
  now: () => Date = () => new Date(),
): BookingStore {
  const existing = readSnapshot(storage, key);
  const memory = new MemoryBookingStore(existing ?? createSeed(now()), now);
  const persist = () => {
    storage.setItem(key, JSON.stringify(memory.exportSnapshot()));
  };
  if (!existing) persist();
  memory.subscribe(persist);
  return memory;
}
