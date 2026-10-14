import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Booking, BookingStore, Service } from "./types";

const BookingStoreContext = createContext<BookingStore | null>(null);

export function BookingStoreProvider({
  store,
  children,
}: {
  store: BookingStore;
  children: ReactNode;
}) {
  return <BookingStoreContext.Provider value={store}>{children}</BookingStoreContext.Provider>;
}

export function useBookingStore(): BookingStore {
  const store = useContext(BookingStoreContext);
  if (!store) throw new Error("useBookingStore must be used within BookingStoreProvider");
  return store;
}

export function useSnapshot(): { ready: boolean; services: Service[]; bookings: Booking[] } {
  const store = useBookingStore();
  const [snap, setSnap] = useState<{ ready: boolean; services: Service[]; bookings: Booking[] }>({
    ready: false,
    services: [],
    bookings: [],
  });

  useEffect(() => {
    let active = true;
    let request = 0;
    const load = () => {
      const id = ++request;
      void Promise.all([store.listServices(), store.listBookings()]).then(([services, bookings]) => {
        if (active && id === request) setSnap({ ready: true, services, bookings });
      });
    };
    load();
    const unsubscribe = store.subscribe(load);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [store]);

  return snap;
}
