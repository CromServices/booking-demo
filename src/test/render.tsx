import { render, type RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";
import { App } from "../App";
import { Layout } from "../components/Layout";
import { HashRouter } from "../hashRouter";
import { BookingStoreProvider } from "../store/context";
import type { BookingStore } from "../store/types";

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
