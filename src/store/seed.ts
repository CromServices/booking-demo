import { buildCalendar, type SlotBooking } from "../domain/slots";
import { studioMinutes } from "../domain/time";
import type { Booking, DemoSnapshot, Service } from "./types";

export const SERVICE_IDS = {
  bath: "svc-bath",
  groom: "svc-groom",
  puppy: "svc-puppy",
  nails: "svc-nails",
  deshed: "svc-deshed",
} as const;

const SERVICES: Service[] = [
  {
    id: SERVICE_IDS.bath,
    name: "Bath & brush",
    summary: "Warm wash, brush, and a tidy of ears and feet.",
    priceCents: 6500,
    durationMinutes: 60,
    active: true,
  },
  {
    id: SERVICE_IDS.groom,
    name: "Full groom",
    summary: "Bath, dry, and a clip shaped to the coat.",
    priceCents: 12000,
    durationMinutes: 90,
    active: true,
  },
  {
    id: SERVICE_IDS.puppy,
    name: "Puppy introduction",
    summary: "A short first visit for dogs under six months.",
    priceCents: 5500,
    durationMinutes: 45,
    active: true,
  },
  {
    id: SERVICE_IDS.nails,
    name: "Nail and paw tidy",
    summary: "Nails and a quick check of feet. No bath.",
    priceCents: 3000,
    durationMinutes: 30,
    active: true,
  },
  {
    id: SERVICE_IDS.deshed,
    name: "De-shed blow-out",
    summary: "A heavier brush-out for coats that are dropping.",
    priceCents: 9000,
    durationMinutes: 75,
    active: true,
  },
];

function pickNthDay(
  now: Date,
  durationMinutes: number,
  bookings: SlotBooking[],
  minuteOfDay: number,
  dayIndex: number,
): string | null {
  const matches = buildCalendar({ now, durationMinutes, bookings }).filter((day) =>
    day.slots.some((slot) => slot.available && studioMinutes(new Date(slot.start)) === minuteOfDay),
  );
  const day = matches[dayIndex];
  if (!day) return null;
  return (
    day.slots.find((slot) => slot.available && studioMinutes(new Date(slot.start)) === minuteOfDay)
      ?.start ?? null
  );
}

function sampleBooking(
  partial: Omit<Booking, "createdAt" | "emailVerified"> & { emailVerified?: boolean },
  createdAt: string,
): Booking {
  return { emailVerified: true, createdAt, ...partial };
}

export function createSeed(now: Date): DemoSnapshot {
  const createdAt = now.toISOString();
  const bookings: Booking[] = [];
  const asSlots = (): SlotBooking[] =>
    bookings.map((booking) => ({
      slotStart: booking.slotStart,
      durationMinutes: booking.durationMinutes,
      status: booking.status,
    }));

  const bathStart = pickNthDay(now, 60, asSlots(), 10 * 60 + 30, 0);
  if (bathStart) {
    bookings.push(
      sampleBooking(
        {
          id: "bkg-mia",
          customerName: "Mia Tran",
          dogName: "Noodle",
          dogSize: "Small",
          mobile: "0400 000 111",
          email: "mia.tran@example.com",
          serviceId: SERVICE_IDS.bath,
          serviceName: "Bath & brush",
          priceCents: 6500,
          durationMinutes: 60,
          slotStart: bathStart,
          notes: "Noodle is nervous of the dryer, towel finish please.",
          status: "confirmed",
          confirmationCode: "111111",
        },
        createdAt,
      ),
    );
  }

  const groomStart = pickNthDay(now, 90, asSlots(), 11 * 60, 1);
  if (groomStart) {
    bookings.push(
      sampleBooking(
        {
          id: "bkg-sam",
          customerName: "Sam Okafor",
          dogName: "Wattle",
          dogSize: "Medium",
          mobile: "0400 000 222",
          email: "sam.okafor@example.com",
          serviceId: SERVICE_IDS.groom,
          serviceName: "Full groom",
          priceCents: 12000,
          durationMinutes: 90,
          slotStart: groomStart,
          notes: "Wattle's first full groom, keep it short and calm.",
          status: "pending",
          confirmationCode: "222222",
        },
        createdAt,
      ),
    );
  }

  const nailStart = pickNthDay(now, 30, asSlots(), 9 * 60 + 30, 2);
  if (nailStart) {
    bookings.push(
      sampleBooking(
        {
          id: "bkg-priya",
          customerName: "Priya Nair",
          dogName: "Biscuit",
          dogSize: "Large",
          mobile: "0400 000 333",
          email: "priya.nair@example.com",
          serviceId: SERVICE_IDS.nails,
          serviceName: "Nail and paw tidy",
          priceCents: 3000,
          durationMinutes: 30,
          slotStart: nailStart,
          notes: "",
          status: "cancelled",
          confirmationCode: "333333",
        },
        createdAt,
      ),
    );
  }

  return {
    version: 1,
    services: SERVICES.map((service) => ({ ...service })),
    bookings,
  };
}
