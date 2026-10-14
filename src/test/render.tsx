import { render, type RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";
import { App } from "../App";
import { Layout } from "../shared/ui/Layout";
import { HashRouter } from "../shared/routing/hashRouter";
import { BookingStoreProvider } from "../features/booking-store/context";
import type { BookingStore } from "../features/booking-store/types";

export function renderAt(hash: string, store: BookingStore, ui?: ReactNode): RenderResult {
  window.location.hash = hash;
  if (ui) {
    return render(
      <BookingStoreProvider store={store}>
        <HashRouter>
          <Layout>{ui}</Layout>
        </HashRouter>
      </BookingStoreProvider>,
    );
  }
  return render(<App store={store} />);
}
