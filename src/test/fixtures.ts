import { createSeed } from "../store/seed";
import { MemoryBookingStore } from "../store/memoryStore";

export const FIXED_NOW = new Date("2026-10-05T01:00:00.000Z");

export function fixedClock(date = FIXED_NOW): () => Date {
  const time = date.getTime();
  return () => new Date(time);
}

export function makeStore(date = FIXED_NOW): MemoryBookingStore {
  const clock = fixedClock(date);
  return new MemoryBookingStore(createSeed(clock()), clock);
}
