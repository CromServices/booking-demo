import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { makeStore } from "../test/fixtures";
import { renderAt } from "../test/render";
import { AdminPage } from "./AdminPage";

const BANNER =
  "Demo site by Crom Services. Not a real business. Sample data only. Emails are simulated.";

function renderAdmin() {
  const store = makeStore();
  renderAt("#/admin", store, <AdminPage />);
  return store;
}

describe("demo desk", () => {
  it("approves, cancels, and reschedules upcoming bookings", async () => {
    const user = userEvent.setup();
    const store = renderAdmin();
    expect(await screen.findByRole("heading", { name: "Demo desk" })).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(BANNER);

    const quinn = () => screen.getByRole("article", { name: /Booking for Sample Quinn at/ });
    const before = quinn().getAttribute("aria-label");

    await user.click(screen.getByRole("button", { name: "Approve Sample Quinn" }));
    expect(await within(quinn()).findByText("Confirmed")).toBeInTheDocument();
    expect((await store.listBookings()).find((booking) => booking.customerName === "Sample Quinn")?.status).toBe(
      "confirmed",
    );

    await user.click(screen.getByRole("button", { name: "Cancel Demo Harper" }));
    const harper = screen.getByRole("article", { name: /Booking for Demo Harper at/ });
    expect(await within(harper).findByText("Cancelled")).toBeInTheDocument();
    expect(within(harper).queryByRole("button", { name: "Cancel Demo Harper" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reschedule Sample Quinn" }));
    const select = screen.getByLabelText("New time for Sample Quinn");
    const option = within(select)
      .getAllByRole("option")
      .map((item) => item as HTMLOptionElement)
      .find((item) => item.value);
    expect(option?.value).toBeTruthy();
    await user.selectOptions(select, option!.value);
    await user.click(screen.getByRole("button", { name: "Save new time for Sample Quinn" }));

    await waitFor(() => {
      const after = quinn().getAttribute("aria-label");
      expect(after).not.toBe(before);
      expect(after).toContain(option!.textContent);
    });
    const moved = (await store.listBookings()).find((booking) => booking.customerName === "Sample Quinn");
    expect(moved?.slotStart).toBe(option!.value);
    expect(moved?.status).toBe("confirmed");
  });

  it("adds, edits, and removes a service, then restores the sample data", async () => {
    const user = userEvent.setup();
    const store = renderAdmin();
    await screen.findByRole("heading", { name: "Demo desk" });

    await user.type(screen.getByLabelText("Service name"), "Paw balm");
    await user.type(screen.getByLabelText("Short description"), "A sample add-on.");
    await user.type(screen.getByLabelText("Price (AUD)"), "25");
    await user.type(screen.getByLabelText("Duration (minutes)"), "20");
    await user.click(screen.getByRole("button", { name: "Add service" }));
    expect(await screen.findByRole("heading", { name: "Paw balm" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Paw balm" }));
    const price = screen.getByLabelText("Price (AUD)");
    await user.clear(price);
    await user.type(price, "28");
    expect(price).toHaveValue("28");
    await user.click(screen.getByLabelText("Show on the public menu"));
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    const paw = screen.getByRole("heading", { name: "Paw balm" }).closest("li");
    expect(paw).toBeTruthy();
    expect(await within(paw as HTMLElement).findByText(/\$28\.00/)).toBeInTheDocument();
    expect(screen.getByText("Hidden")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove Paw balm" }));
    await user.click(screen.getByRole("button", { name: "Yes, remove" }));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Paw balm" })).not.toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("Service name"), "Temporary rinse");
    await user.type(screen.getByLabelText("Price (AUD)"), "15");
    await user.type(screen.getByLabelText("Duration (minutes)"), "15");
    await user.click(screen.getByRole("button", { name: "Add service" }));
    expect(await screen.findByRole("heading", { name: "Temporary rinse" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset demo data" }));
    await user.click(screen.getByRole("button", { name: "Restore sample data" }));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Temporary rinse" })).not.toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Bath & brush" })).toBeInTheDocument();
    expect((await store.listBookings()).some((booking) => booking.customerName === "Demo Harper")).toBe(true);
  });
});
