import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { fixedClock, FIXED_NOW, makeStore } from "../test/fixtures";
import { renderAt } from "../test/render";
import { createLocalStorageBookingStore, STORAGE_KEY } from "../store/localStorageStore";
import { SERVICE_IDS } from "../store/seed";
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

    const quinn = () => screen.getByRole("article", { name: /Booking for Sam Okafor at/ });
    const before = quinn().getAttribute("aria-label");
    expect(
      screen.getAllByRole("heading", { name: /^(Pending|Approved|Cancelled)$/ }).map((heading) => heading.textContent),
    ).toEqual(["Pending", "Approved", "Cancelled"]);

    expect(screen.getByText("Noodle · Small")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Approve Sam Okafor" }));
    expect(await within(quinn()).findByText("Approved")).toBeInTheDocument();
    expect((await store.listBookings()).find((booking) => booking.customerName === "Sam Okafor")?.status).toBe(
      "confirmed",
    );

    await user.click(screen.getByRole("button", { name: "Cancel Mia Tran" }));
    const harper = screen.getByRole("article", { name: /Booking for Mia Tran at/ });
    expect(await within(harper).findByText("Cancelled")).toBeInTheDocument();
    expect(within(harper).queryByRole("button", { name: "Cancel Mia Tran" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reschedule Sam Okafor" }));
    const select = screen.getByLabelText("New time for Sam Okafor");
    const option = within(select)
      .getAllByRole("option")
      .map((item) => item as HTMLOptionElement)
      .find((item) => item.value);
    expect(option?.value).toBeTruthy();
    await user.selectOptions(select, option!.value);
    await user.click(screen.getByRole("button", { name: "Save new time for Sam Okafor" }));

    await waitFor(() => {
      const after = quinn().getAttribute("aria-label");
      expect(after).not.toBe(before);
      expect(after).toContain(option!.textContent);
    });
    const moved = (await store.listBookings()).find((booking) => booking.customerName === "Sam Okafor");
    expect(moved?.slotStart).toBe(option!.value);
    expect(moved?.status).toBe("confirmed");
  });

  it("masks contact details until that card is revealed, and deletes one booking", async () => {
    const user = userEvent.setup();
    const store = renderAdmin();
    const sam = () => screen.getByRole("article", { name: /Booking for Sam Okafor at/ });
    const priya = () => screen.getByRole("article", { name: /Booking for Priya Nair at/ });

    expect(await screen.findByRole("heading", { name: "Sam Okafor" })).toBeInTheDocument();
    expect(within(sam()).getByText(/0400 \*\*\* 222/)).toBeInTheDocument();
    expect(within(sam()).getByText(/s\*\*\*@example.com/)).toBeInTheDocument();
    expect(within(sam()).queryByText("sam.okafor@example.com")).not.toBeInTheDocument();
    expect(screen.queryByText("mia.tran@example.com")).not.toBeInTheDocument();

    const show = within(sam()).getByRole("button", { name: "Show details" });
    expect(show).toHaveAttribute("aria-expanded", "false");
    await user.click(show);
    expect(within(sam()).getByRole("button", { name: "Hide details" })).toHaveAttribute("aria-expanded", "true");
    expect(within(sam()).getByText(/sam\.okafor@example.com/)).toBeInTheDocument();
    expect(within(sam()).getByText(/0400 000 222/)).toBeInTheDocument();
    expect(screen.queryByText("mia.tran@example.com")).not.toBeInTheDocument();

    await user.click(within(sam()).getByRole("button", { name: "Hide details" }));
    expect(within(sam()).queryByText("sam.okafor@example.com")).not.toBeInTheDocument();

    await user.click(within(priya()).getByRole("button", { name: "Delete booking for Priya Nair" }));
    expect(within(priya()).getByText("Delete this booking?")).toBeInTheDocument();
    await user.click(within(priya()).getByRole("button", { name: "Keep it" }));
    expect(within(priya()).queryByText("Delete this booking?")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Priya Nair" })).toBeInTheDocument();

    await user.click(within(priya()).getByRole("button", { name: "Delete booking for Priya Nair" }));
    await user.click(within(priya()).getByRole("button", { name: "Yes, delete" }));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Priya Nair" })).not.toBeInTheDocument();
    });
    expect(screen.queryByRole("heading", { name: "Cancelled" })).not.toBeInTheDocument();
    expect((await store.listBookings()).some((booking) => booking.customerName === "Priya Nair")).toBe(false);
    expect((await store.listBookings()).some((booking) => booking.customerName === "Sam Okafor")).toBe(true);
  });

  it("moves focus into the delete prompt, back on keep, and onward after delete", async () => {
    const user = userEvent.setup();
    renderAdmin();
    await screen.findByRole("heading", { name: "Sam Okafor" });

    const deleteSam = () => screen.getByRole("button", { name: "Delete booking for Sam Okafor" });
    deleteSam().focus();
    await user.click(deleteSam());
    const prompt = () => screen.getByRole("group", { name: "Confirm deletion of Sam Okafor" });
    await waitFor(() => expect(prompt()).toHaveFocus());

    await user.click(screen.getByRole("button", { name: "Keep it" }));
    expect(deleteSam()).toHaveFocus();
    expect(screen.queryByRole("group", { name: "Confirm deletion of Sam Okafor" })).not.toBeInTheDocument();

    await user.click(deleteSam());
    await waitFor(() => expect(prompt()).toHaveFocus());
    await user.click(screen.getByRole("button", { name: "Yes, delete" }));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Sam Okafor" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel Mia Tran" })).toHaveFocus();
    });
    expect(screen.getByRole("status")).toHaveTextContent("Deleted the booking for Sam Okafor.");

    await user.click(screen.getByRole("button", { name: "Delete booking for Mia Tran" }));
    await user.click(screen.getByRole("button", { name: "Yes, delete" }));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Mia Tran" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Delete booking for Priya Nair" })).toHaveFocus();
    });

    await user.click(screen.getByRole("button", { name: "Delete booking for Priya Nair" }));
    await user.click(screen.getByRole("button", { name: "Yes, delete" }));
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Priya Nair" })).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Upcoming bookings" })).toHaveFocus();
    });
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
    expect((await store.listBookings()).some((booking) => booking.customerName === "Mia Tran")).toBe(true);
  });

  it("renders a saved booking that has no dog details", async () => {
    const legacy = {
      version: 1 as const,
      services: [
        {
          id: SERVICE_IDS.bath,
          name: "Bath & brush",
          summary: "Warm wash.",
          priceCents: 6500,
          durationMinutes: 60,
          active: true,
        },
      ],
      bookings: [
        {
          id: "bkg-old",
          customerName: "Old Client",
          mobile: "0400 000 444",
          email: "old.client@example.com",
          serviceId: SERVICE_IDS.bath,
          serviceName: "Bath & brush",
          priceCents: 6500,
          durationMinutes: 60,
          slotStart: "2026-10-06T02:30:00.000Z",
          notes: "",
          status: "pending" as const,
          emailVerified: false,
          confirmationCode: "444444",
          createdAt: FIXED_NOW.toISOString(),
        },
      ],
    };
    const storage = {
      value: JSON.stringify(legacy),
      getItem: () => storage.value,
      setItem: (_key: string, next: string) => {
        storage.value = next;
      },
      removeItem: () => {
        storage.value = "";
      },
    };
    const store = createLocalStorageBookingStore(storage, STORAGE_KEY, fixedClock(FIXED_NOW));
    renderAt("#/admin", store, <AdminPage />);
    expect(await screen.findByRole("heading", { name: "Old Client" })).toBeInTheDocument();
    expect(screen.getByText("Not recorded")).toBeInTheDocument();
  });
});
