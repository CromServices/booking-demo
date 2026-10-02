import { siteConfig } from "../site.config";

/** Opening windows in minutes from midnight, studio time. Index 0 is Sunday. */
export const OPENING_HOURS: Record<number, { openMin: number; closeMin: number } | null> = {
  0: siteConfig.schedule.days[0],
  1: siteConfig.schedule.days[1],
  2: siteConfig.schedule.days[2],
  3: siteConfig.schedule.days[3],
  4: siteConfig.schedule.days[4],
  5: siteConfig.schedule.days[5],
  6: siteConfig.schedule.days[6],
};

export const HORIZON_DAYS = siteConfig.schedule.horizonDays;
export const SLOT_STEP_MINUTES = siteConfig.schedule.slotStepMinutes;

export type HoursLine = { label: string; value: string };

export function describeHours(): HoursLine[] {
  return siteConfig.schedule.lines.map((line) => ({ label: line.label, value: line.value }));
}

export function calendarWindow(config: {
  schedule: {
    days: readonly ({ openMin: number; closeMin: number } | null)[];
    horizonDays: number;
    slotStepMinutes: number;
  };
}): {
  horizonDays: number;
  stepMinutes: number;
  openingHours: Record<number, { openMin: number; closeMin: number } | null>;
} {
  return {
    horizonDays: config.schedule.horizonDays,
    stepMinutes: config.schedule.slotStepMinutes,
    openingHours: {
      0: config.schedule.days[0] ?? null,
      1: config.schedule.days[1] ?? null,
      2: config.schedule.days[2] ?? null,
      3: config.schedule.days[3] ?? null,
      4: config.schedule.days[4] ?? null,
      5: config.schedule.days[5] ?? null,
      6: config.schedule.days[6] ?? null,
    },
  };
}
