/** Display-only masking. Stored contact details are left unchanged. */

export function maskMobile(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 7) return "***";
  return `${digits.slice(0, 4)} *** ${digits.slice(-3)}`;
}

export function maskEmail(value: string): string {
  const trimmed = value.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return "***";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!local || !domain || domain.startsWith(".") || domain.endsWith(".")) return "***";
  return `${local[0]}***@${domain}`;
}
