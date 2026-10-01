import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { bookingMessages } from "../domain/validation";
import { makeStore } from "../test/fixtures";
import { renderAt } from "../test/render";
import { BookPage } from "./BookPage";

const BANNER =
  "Demo site by Crom Services. Not a real business. Sample data only. Emails are simulated.";

describe("booking form", () => {
  beforeEach(() => {
    window.location.hash = "#/book";
  });

  it("shows inline accessible errors and does not create a booking", async () => {
    const user = userEvent.setup();
    const store = makeStore();
    const before = (await store.listBookings()).length;
    renderAt("#/book", store, <BookPage />);

    expect(screen.getByRole("note")).toHaveTextContent(BANNER);
    const form = await screen.findByRole("form", { name: "Booking details" });
    expect(form).not.toHaveAttribute("action");

    await user.click(screen.getByRole("button", { name: "Request this time" }));

    const alertText = () => screen.getAllByRole("alert").map((element) => element.textContent);
    for (const message of [
      bookingMessages.name,
      bookingMessages.mobile,
      bookingMessages.email,
      bookingMessages.service,
      bookingMessages.slot,
    ]) {
      expect(alertText()).toContain(message);
    }

    const name = screen.getByLabelText("Name");
    expect(name).toHaveAttribute("aria-invalid", "true");
    const describedBy = name.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe(bookingMessages.name);
    expect(await store.listBookings()).toHaveLength(before);

    await user.type(name, "A");
    await user.type(screen.getByLabelText("Mobile"), "0212345678");
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Request this time" }));
    expect(alertText()).toEqual(
      expect.arrayContaining([bookingMessages.name, bookingMessages.mobile, bookingMessages.email]),
    );
  });

  it("walks the simulated confirmation code and rejects a mismatch", async () => {
    const user = userEvent.setup();
    const store = makeStore();
    renderAt("#/book", store, <BookPage />);

    await user.click(await screen.findByRole("radio", { name: /Bath & brush/ }));
    await user.click(screen.getByRole("button", { name: "9:30 am available" }));
    await user.type(screen.getByLabelText("Name"), "Test Visitor");
    await user.type(screen.getByLabelText("Mobile"), "0412 345 678");
    await user.type(screen.getByLabelText("Email"), "Test.Visitor@Example.com");
    await user.type(screen.getByLabelText("Notes"), "Walkthrough sample");
    await user.click(screen.getByRole("button", { name: "Request this time" }));

    const email = await screen.findByRole("article", { name: "Simulated confirmation email" });
    expect(email).toHaveTextContent(/not sent/i);
    expect(email).toHaveTextContent("test.visitor@example.com");
    const code = within(email).getByRole("status", { name: "Confirmation code" }).textContent ?? "";
    expect(code).toMatch(/^\d{6}$/);

    const wrong = code === "000000" ? "000001" : "000000";
    await user.type(screen.getByLabelText("Code from the sample email"), wrong);
    await user.click(screen.getByRole("button", { name: "Confirm with code" }));
    expect(
      (await screen.findAllByRole("alert")).some(
        (element) => element.textContent === "That code does not match the sample email.",
      ),
    ).toBe(true);

    const bookings = await store.listBookings();
    expect(bookings.find((booking) => booking.customerName === "Test Visitor")?.emailVerified).toBe(false);

    await user.clear(screen.getByLabelText("Code from the sample email"));
    await user.type(screen.getByLabelText("Code from the sample email"), code);
    await user.click(screen.getByRole("button", { name: "Confirm with code" }));
    expect(await screen.findByRole("heading", { name: "Request lodged" })).toBeInTheDocument();
    expect(screen.getByText(/No email was sent/)).toBeInTheDocument();

    const saved = (await store.listBookings()).find((booking) => booking.customerName === "Test Visitor");
    expect(saved).toMatchObject({
      email: "test.visitor@example.com",
      mobile: "0412 345 678",
      status: "pending",
      emailVerified: true,
      notes: "Walkthrough sample",
    });
  });
});
