import type { ExtraField } from "./types";

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

export function extraSummary(
  extras: Record<string, string> | undefined,
  fields: readonly ExtraField[],
  empty: string,
  separator: string,
): string {
  const parts = fields.map((field) => (extras?.[field.id] ?? "").trim()).filter(Boolean);
  return parts.length > 0 ? parts.join(separator) : empty;
}
