/**
 * Pages talk only to this interface.
 * The demo adapter keeps data in localStorage. A Supabase adapter can
 * implement the same methods and be passed to BookingStoreProvider
 * without changing the UI. No method sends email.
 */
export type BookingStatus = "pending" | "confirmed" | "cancelled";

export const DOG_SIZES = ["Small", "Medium", "Large", "Giant"] as const;
export type DogSize = (typeof DOG_SIZES)[number];

export type Service = {
  id: string;
  name: string;
  summary: string;
  priceCents: number;
  durationMinutes: number;
  active: boolean;
};

export type Booking = {
  id: string;
  customerName: string;
  dogName: string;
  dogSize: DogSize | "";
  mobile: string;
  email: string;
  serviceId: string;
  serviceName: string;
  priceCents: number;
  durationMinutes: number;
  slotStart: string;
  notes: string;
  status: BookingStatus;
  emailVerified: boolean;
  confirmationCode: string;
  createdAt: string;
};

export type DemoSnapshot = {
  version: 1;
  services: Service[];
  bookings: Booking[];
};

export type CreateBookingInput = {
  customerName: string;
  dogName: string;
  dogSize: DogSize;
  mobile: string;
  email: string;
  serviceId: string;
  slotStart: string;
  notes: string;
};

export type BookingPatch = {
  status?: BookingStatus;
  slotStart?: string;
};

export type ServiceInput = {
  id?: string;
  name: string;
  summary: string;
  priceCents: number;
  durationMinutes: number;
  active: boolean;
};

export interface BookingStore {
  now(): Date;
  listServices(): Promise<Service[]>;
  listBookings(): Promise<Booking[]>;
  createBooking(input: CreateBookingInput): Promise<Booking>;
  confirmBooking(id: string, code: string): Promise<Booking>;
  updateBooking(id: string, patch: BookingPatch): Promise<Booking>;
  deleteBooking(id: string): Promise<void>;
  saveService(input: ServiceInput): Promise<Service>;
  removeService(id: string): Promise<void>;
  resetDemoData(): Promise<void>;
  subscribe(listener: () => void): () => void;
}
