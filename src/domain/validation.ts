export type BookingFormValues = {
  name: string;
  mobile: string;
  email: string;
  serviceId: string;
  slotStart: string;
  notes: string;
};

export type BookingFormErrors = Partial<Record<keyof BookingFormValues, string>>;

export const bookingMessages = {
  name: "Enter the name for this booking.",
  mobile: "Enter an Australian mobile, like 0412 345 678.",
  email: "Enter an email address so the sample confirmation can be addressed to you.",
  service: "Choose a service.",
  slot: "Choose an open time.",
  notes: "Keep notes to 400 characters or fewer.",
} as const;

export function normalizeAuMobile(input: string): string | null {
  const compact = input.replace(/[\s()-]/g, "");
  let national = "";
  if (/^04\d{8}$/.test(compact)) national = compact;
  else if (/^\+614\d{8}$/.test(compact)) national = `0${compact.slice(3)}`;
  else if (/^614\d{8}$/.test(compact)) national = `0${compact.slice(2)}`;
  else return null;
  return `${national.slice(0, 4)} ${national.slice(4, 7)} ${national.slice(7)}`;
}

export function validateBookingForm(values: BookingFormValues): BookingFormErrors {
  const errors: BookingFormErrors = {};
  const name = values.name.trim();
  if (!/^[\p{L}][\p{L}\p{M}'’.\- ]{1,79}$/u.test(name)) {
    errors.name = bookingMessages.name;
  }
  if (!normalizeAuMobile(values.mobile)) {
    errors.mobile = bookingMessages.mobile;
  }
  const email = values.email.trim();
  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = bookingMessages.email;
  }
  if (!values.serviceId) errors.serviceId = bookingMessages.service;
  if (!values.slotStart) errors.slotStart = bookingMessages.slot;
  if (values.notes.trim().length > 400) errors.notes = bookingMessages.notes;
  return errors;
}

export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}

export type ServiceDraft = {
  name: string;
  summary: string;
  price: string;
  duration: string;
  active: boolean;
};

export type ServiceFieldErrors = Partial<Record<"name" | "summary" | "price" | "duration", string>>;

export function dollarsToCents(input: string): number | null {
  const trimmed = input.trim().replace(/^\$/, "");
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > 100_000) return null;
  return cents;
}

export function validateServiceDraft(draft: ServiceDraft): ServiceFieldErrors {
  const errors: ServiceFieldErrors = {};
  const name = draft.name.trim();
  if (name.length < 2 || name.length > 60) {
    errors.name = "Enter a service name (2–60 characters).";
  }
  if (draft.summary.trim().length > 160) {
    errors.summary = "Keep the description to 160 characters or fewer.";
  }
  if (dollarsToCents(draft.price) === null) {
    errors.price = "Enter a price in Australian dollars, such as 65 or 65.50.";
  }
  const duration = Number(draft.duration);
  if (!/^\d+$/.test(draft.duration.trim()) || duration < 15 || duration > 240) {
    errors.duration = "Enter a duration from 15 to 240 minutes.";
  }
  return errors;
}
