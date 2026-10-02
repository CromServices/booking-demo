import { describe, expect, it } from "vitest";
import { formatClock } from "./format";
import { buildCalendar } from "./slots";
import { studioMinutes } from "./time";

const MONDAY_9AM = new Date("2026-10-05T01:00:00.000Z");

function clocks(now: Date, durationMinutes: number) {
  const day = buildCalendar({ now, durationMinutes, bookings: [] })[0];
  return day.slots.map((slot) => formatClock(studioMinutes(new Date(slot.start))));
}

describe("buildCalendar", () => {
  it("covers 14 studio days and marks Sunday closed", () => {
    const days = buildCalendar({ now: MONDAY_9AM, durationMinutes: 60, bookings: [] });
    expect(days).toHaveLength(14);
    expect(days[0]?.dateKey).toBe("2026-10-05");
    expect(days.find((day) => day.dateKey === "2026-10-11")).toMatchObject({
      closed: true,
      slots: [],
    });
  });

  it("hides slots that have already started", () => {
    expect(clocks(MONDAY_9AM, 60)[0]).toBe("9:30 am");
    const at1030 = new Date("2026-10-05T02:30:00.000Z");
    const later = clocks(at1030, 60);
    expect(later).not.toContain("9:30 am");
    expect(later).not.toContain("10:30 am");
    expect(later[0]).toBe("11:00 am");
  });

  it("keeps a slot only when the service finishes by closing time", () => {
    expect(clocks(MONDAY_9AM, 90)).toContain("2:30 pm");
    expect(clocks(MONDAY_9AM, 90)).not.toContain("3:00 pm");
    const days = buildCalendar({ now: MONDAY_9AM, durationMinutes: 60, bookings: [] });
    const saturday = days.find((day) => day.dateKey === "2026-10-10");
    const saturdayClocks = saturday?.slots.map((slot) => formatClock(studioMinutes(new Date(slot.start))));
    expect(saturdayClocks).toContain("12:00 pm");
    expect(saturdayClocks).not.toContain("12:30 pm");
  });

  it("marks overlapping bookings taken and ignores cancelled ones", () => {
    const open = buildCalendar({ now: MONDAY_9AM, durationMinutes: 60, bookings: [] });
    const target = open[0]?.slots.find((slot) => studioMinutes(new Date(slot.start)) === 10 * 60 + 30);
    expect(target?.available).toBe(true);

    const blocked = buildCalendar({
      now: MONDAY_9AM,
      durationMinutes: 60,
      bookings: [{ slotStart: target!.start, durationMinutes: 60, status: "confirmed" }],
    });
    expect(blocked[0]?.slots.find((slot) => slot.start === target!.start)?.available).toBe(false);
    const eleven = blocked[0]?.slots.find((slot) => studioMinutes(new Date(slot.start)) === 11 * 60);
    expect(eleven?.available).toBe(false);

    const cancelled = buildCalendar({
      now: MONDAY_9AM,
      durationMinutes: 60,
      bookings: [{ slotStart: target!.start, durationMinutes: 60, status: "cancelled" }],
    });
    expect(cancelled[0]?.slots.find((slot) => slot.start === target!.start)?.available).toBe(true);
  });
});
