import { useMemo } from "react";
import { Layout } from "./shared/ui/Layout";
import { HashRouter, useHashLocation } from "./shared/routing/hashRouter";
import { AdminPage } from "./features/staff-desk/AdminPage";
import { BookPage } from "./features/booking/BookPage";
import { HomePage } from "./features/home/HomePage";
import { NotFoundPage } from "./features/not-found/NotFoundPage";
import { BookingStoreProvider } from "./features/booking-store/context";
import { createLocalStorageBookingStore } from "./features/booking-store/localStorageStore";
import type { BookingStore } from "./features/booking-store/types";

function AppRoutes() {
  const { path } = useHashLocation();
  if (path === "/") return <HomePage />;
  if (path === "/book") return <BookPage />;
  if (path === "/admin") return <AdminPage />;
  return <NotFoundPage />;
}

export function App({ store }: { store?: BookingStore }) {
  const resolved = useMemo(() => store ?? createLocalStorageBookingStore(), [store]);
  return (
    <BookingStoreProvider store={resolved}>
      <HashRouter>
        <Layout>
          <AppRoutes />
        </Layout>
      </HashRouter>
    </BookingStoreProvider>
  );
}
