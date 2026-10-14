export const STUDIO_TZ = "Australia/Perth";
const STUDIO_OFFSET = "+08:00";

function studioMap(date: Date): Record<string, string> {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: STUDIO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const item of parts) {
    if (item.type !== "literal") map[item.type] = item.value;
  }
  return map;
}

export function studioDateKey(date: Date): string {
  const map = studioMap(date);
  return `${map.year}-${map.month}-${map.day}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function studioWeekdayIndex(date: Date): number {
  const weekday = studioMap(date).weekday;
  const index = WEEKDAYS.indexOf(weekday as (typeof WEEKDAYS)[number]);
  if (index < 0) throw new Error(`Unrecognised studio weekday: ${weekday}`);
  return index;
}

export function studioMinutes(date: Date): number {
  const map = studioMap(date);
  const hour = Number(map.hour);
  const minute = Number(map.minute);
  return (hour === 24 ? 0 : hour) * 60 + minute;
}

export function addDaysToKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const nextYear = utc.getUTCFullYear();
  const nextMonth = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(utc.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function zonedDate(dateKey: string, minutes: number): Date {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return new Date(
    `${dateKey}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00${STUDIO_OFFSET}`,
  );
}

export function weekdayIndexForKey(dateKey: string): number {
  return studioWeekdayIndex(zonedDate(dateKey, 12 * 60));
}

export type DayLabel = {
  weekdayShort: string;
  dayNum: string;
  monthShort: string;
  longLabel: string;
};

export function formatDayLabel(dateKey: string): DayLabel {
  const date = zonedDate(dateKey, 12 * 60);
  const shortParts = new Intl.DateTimeFormat("en-AU", {
    timeZone: STUDIO_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).formatToParts(date);
  const longParts = new Intl.DateTimeFormat("en-AU", {
    timeZone: STUDIO_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).formatToParts(date);
  const read = (parts: Intl.DateTimeFormatPart[], type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return {
    weekdayShort: read(shortParts, "weekday"),
    dayNum: read(shortParts, "day"),
    monthShort: read(shortParts, "month"),
    longLabel: `${read(longParts, "weekday")} ${read(longParts, "day")} ${read(longParts, "month")}`,
  };
}

export function isOnOrAfterStudioDay(iso: string, now: Date): boolean {
  return studioDateKey(new Date(iso)) >= studioDateKey(now);
}
