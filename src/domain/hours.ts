import { formatClock } from "./format";

/** Opening windows in minutes from midnight, studio time. Sunday is closed. */
export const OPENING_HOURS: Record<number, { openMin: number; closeMin: number } | null> = {
  0: null,
  1: { openMin: 9 * 60, closeMin: 16 * 60 },
  2: { openMin: 9 * 60, closeMin: 16 * 60 },
  3: { openMin: 9 * 60, closeMin: 16 * 60 },
  4: { openMin: 9 * 60, closeMin: 16 * 60 },
  5: { openMin: 9 * 60, closeMin: 16 * 60 },
  6: { openMin: 9 * 60, closeMin: 13 * 60 },
};

export const HORIZON_DAYS = 14;
export const SLOT_STEP_MINUTES = 30;

export type HoursLine = { label: string; value: string };

export function describeHours(): HoursLine[] {
  const weekday = OPENING_HOURS[1];
  const saturday = OPENING_HOURS[6];
  if (!weekday || !saturday) return [];
  return [
    {
      label: "Monday to Friday",
      value: `${formatClock(weekday.openMin)} – ${formatClock(weekday.closeMin)}`,
    },
    {
      label: "Saturday",
      value: `${formatClock(saturday.openMin)} – ${formatClock(saturday.closeMin)}`,
    },
    { label: "Sunday", value: "Closed" },
  ];
}
