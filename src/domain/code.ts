export function generateConfirmationCode(random: () => number = Math.random): string {
  const value = Math.min(999_999, Math.floor(random() * 1_000_000));
  return value.toString().padStart(6, "0");
}
