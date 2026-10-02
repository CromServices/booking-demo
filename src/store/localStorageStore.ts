import type { ExtraField } from "../config/types";
import { siteConfig } from "../site.config";
import { createSeed } from "./seed";
import { MemoryBookingStore } from "./memoryStore";
import type { Booking, BookingStatus, BookingStore, DemoSnapshot } from "./types";

export const STORAGE_KEY = siteConfig.storage.key;

export type KeyValueStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function isSnapshot(value: unknown, version: number): value is { version: number; services: unknown[]; bookings: unknown[] } {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as { version?: unknown; services?: unknown; bookings?: unknown };
  return snapshot.version === version && Array.isArray(snapshot.services) && Array.isArray(snapshot.bookings);
}

function readExtra(raw: Record<string, unknown>, field: ExtraField): string {
  const bag = raw.extras;
  const fromBag =
    bag && typeof bag === "object" ? (bag as Record<string, unknown>)[field.id] : undefined;
  const fromTop = raw[field.id];
  const value = typeof fromBag === "string" ? fromBag : typeof fromTop === "string" ? fromTop : "";
  if (field.kind === "select" && field.options && value && !field.options.includes(value)) return "";
  return value;
}

function normalizeBooking(raw: unknown, fields: readonly ExtraField[]): Booking | null {
  if (!raw || typeof raw !== "object") return null;
  const booking = raw as Record<string, unknown>;
  const status: BookingStatus =
    booking.status === "pending" || booking.status === "confirmed" || booking.status === "cancelled"
      ? booking.status
      : "pending";
  const extras: Record<string, string> = {};
  for (const field of fields) extras[field.id] = readExtra(booking, field);
  return {
    id: typeof booking.id === "string" ? booking.id : "",
    customerName: typeof booking.customerName === "string" ? booking.customerName : "",
    extras,
    mobile: typeof booking.mobile === "string" ? booking.mobile : "",
    email: typeof booking.email === "string" ? booking.email : "",
    serviceId: typeof booking.serviceId === "string" ? booking.serviceId : "",
    serviceName: typeof booking.serviceName === "string" ? booking.serviceName : "",
    priceCents: typeof booking.priceCents === "number" ? booking.priceCents : 0,
    durationMinutes: typeof booking.durationMinutes === "number" ? booking.durationMinutes : 0,
    slotStart: typeof booking.slotStart === "string" ? booking.slotStart : "",
    notes: typeof booking.notes === "string" ? booking.notes : "",
    status,
    emailVerified: booking.emailVerified === true,
    confirmationCode: typeof booking.confirmationCode === "string" ? booking.confirmationCode : "",
    createdAt: typeof booking.createdAt === "string" ? booking.createdAt : "",
  };
}

function readSnapshot(
  storage: KeyValueStorage,
  key: string,
  version: number,
  fields: readonly ExtraField[],
): DemoSnapshot | null {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isSnapshot(parsed, version)) return null;
    const bookings = parsed.bookings
      .map((booking) => normalizeBooking(booking, fields))
      .filter((booking): booking is Booking => booking !== null);
    return {
      version,
      services: parsed.services as DemoSnapshot["services"],
      bookings,
    };
  } catch {
    return null;
  }
}

export function createLocalStorageBookingStore(
  storage: KeyValueStorage = window.localStorage,
  key = STORAGE_KEY,
  now: () => Date = () => new Date(),
  config = siteConfig,
): BookingStore {
  const existing = readSnapshot(storage, key, config.storage.version, config.extraFields);
  const memory = new MemoryBookingStore(existing ?? createSeed(now(), config), now, Math.random, config);
  const persist = () => {
    storage.setItem(key, JSON.stringify(memory.exportSnapshot()));
  };
  if (!existing) persist();
  memory.subscribe(persist);
  return memory;
}
