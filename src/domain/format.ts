import { formatDayLabel, perthDateKey, perthMinutes } from "./time";

export function formatClock(minutes: number): string {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const suffix = hour24 >= 12 ? "pm" : "am";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours <= 0) return `${remainder} min`;
  if (remainder === 0) return hours === 1 ? "1 hr" : `${hours} hr`;
  return `${hours} hr ${remainder} min`;
}

export function formatAud(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

export function formatSlotLong(iso: string): string {
  const label = formatDayLabel(perthDateKey(new Date(iso)));
  return `${label.longLabel}, ${formatClock(perthMinutes(new Date(iso)))}`;
}
