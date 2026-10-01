import { useMemo } from "react";
import { Layout } from "./components/Layout";
import { HashRouter, useHashLocation } from "./hashRouter";
import { AdminPage } from "./pages/AdminPage";
import { BookPage } from "./pages/BookPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { BookingStoreProvider } from "./store/context";
import { createLocalStorageBookingStore } from "./store/localStorageStore";
import type { BookingStore } from "./store/types";

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
