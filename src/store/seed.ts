import type { SiteConfig } from "../config/types";
import { siteConfig } from "../site.config";
import { buildCalendar, type SlotBooking } from "../domain/slots";
import { studioMinutes } from "../domain/time";
import type { Booking, DemoSnapshot } from "./types";

export const SERVICE_IDS = {
  bath: "svc-bath",
  groom: "svc-groom",
  puppy: "svc-puppy",
  nails: "svc-nails",
  deshed: "svc-deshed",
} as const;

function openingHours(config: SiteConfig): Record<number, { openMin: number; closeMin: number } | null> {
  return {
    0: config.schedule.days[0],
    1: config.schedule.days[1],
    2: config.schedule.days[2],
    3: config.schedule.days[3],
    4: config.schedule.days[4],
    5: config.schedule.days[5],
    6: config.schedule.days[6],
  };
}

function pickNthDay(
  now: Date,
  durationMinutes: number,
  bookings: SlotBooking[],
  minuteOfDay: number,
  dayIndex: number,
  config: SiteConfig,
): string | null {
  const matches = buildCalendar({
    now,
    durationMinutes,
    bookings,
    horizonDays: config.schedule.horizonDays,
    stepMinutes: config.schedule.slotStepMinutes,
    openingHours: openingHours(config),
  }).filter((day) =>
    day.slots.some((slot) => slot.available && studioMinutes(new Date(slot.start)) === minuteOfDay),
  );
  const day = matches[dayIndex];
  if (!day) return null;
  return (
    day.slots.find((slot) => slot.available && studioMinutes(new Date(slot.start)) === minuteOfDay)
      ?.start ?? null
  );
}

export function createSeed(now: Date, config: SiteConfig = siteConfig): DemoSnapshot {
  const createdAt = now.toISOString();
  const services = config.services.map((service) => ({ ...service }));
  const bookings: Booking[] = [];
  const asSlots = (): SlotBooking[] =>
    bookings.map((booking) => ({
      slotStart: booking.slotStart,
      durationMinutes: booking.durationMinutes,
      status: booking.status,
    }));

  for (const sample of config.sampleBookings) {
    const service = services.find((item) => item.id === sample.serviceId);
    if (!service) continue;
    const slotStart = pickNthDay(
      now,
      service.durationMinutes,
      asSlots(),
      sample.minuteOfDay,
      sample.dayIndex,
      config,
    );
    if (!slotStart) continue;
    bookings.push({
      id: sample.id,
      customerName: sample.customerName,
      extras: { ...sample.extras },
      mobile: sample.mobile,
      email: sample.email,
      serviceId: service.id,
      serviceName: service.name,
      priceCents: service.priceCents,
      durationMinutes: service.durationMinutes,
      slotStart,
      notes: sample.notes,
      status: sample.status,
      emailVerified: sample.emailVerified ?? true,
      confirmationCode: sample.confirmationCode,
      createdAt,
    });
  }

  return {
    version: config.storage.version,
    services,
    bookings,
  };
}
