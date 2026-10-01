import { HORIZON_DAYS, OPENING_HOURS, SLOT_STEP_MINUTES } from "./hours";
import {
  addDaysToKey,
  formatDayLabel,
  perthDateKey,
  weekdayIndexForKey,
  zonedDate,
} from "./time";

export type SlotBooking = {
  slotStart: string;
  durationMinutes: number;
  status: "pending" | "confirmed" | "cancelled";
};

export type TimeSlot = {
  start: string;
  end: string;
  available: boolean;
};

export type CalendarDay = {
  dateKey: string;
  weekdayShort: string;
  dayNum: string;
  monthShort: string;
  longLabel: string;
  closed: boolean;
  slots: TimeSlot[];
};

function overlaps(start: number, end: number, otherStart: number, otherEnd: number): boolean {
  return start < otherEnd && otherStart < end;
}

export function buildCalendar(args: {
  now: Date;
  durationMinutes: number;
  bookings: SlotBooking[];
  horizonDays?: number;
  stepMinutes?: number;
}): CalendarDay[] {
  const horizon = args.horizonDays ?? HORIZON_DAYS;
  const step = args.stepMinutes ?? SLOT_STEP_MINUTES;
  const startKey = perthDateKey(args.now);
  const blocking = args.bookings.filter((booking) => booking.status !== "cancelled");
  const days: CalendarDay[] = [];

  for (let offset = 0; offset < horizon; offset += 1) {
    const dateKey = addDaysToKey(startKey, offset);
    const label = formatDayLabel(dateKey);
    const hours = OPENING_HOURS[weekdayIndexForKey(dateKey)];
    if (!hours) {
      days.push({ dateKey, ...label, closed: true, slots: [] });
      continue;
    }

    const slots: TimeSlot[] = [];
    for (
      let minute = hours.openMin;
      minute + args.durationMinutes <= hours.closeMin;
      minute += step
    ) {
      const start = zonedDate(dateKey, minute);
      if (start.getTime() <= args.now.getTime()) continue;
      const end = new Date(start.getTime() + args.durationMinutes * 60_000);
      const taken = blocking.some((booking) => {
        const bookingStart = new Date(booking.slotStart).getTime();
        const bookingEnd = bookingStart + booking.durationMinutes * 60_000;
        return overlaps(start.getTime(), end.getTime(), bookingStart, bookingEnd);
      });
      slots.push({
        start: start.toISOString(),
        end: end.toISOString(),
        available: !taken,
      });
    }

    days.push({ dateKey, ...label, closed: false, slots });
  }

  return days;
}
