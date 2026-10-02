import { useMemo, useState, type FormEvent } from "react";
import { maskEmail, maskMobile } from "../domain/mask";
import { Field } from "../components/Field";
import { useDocumentTitle } from "../components/useDocumentTitle";
import { formatAud, formatDuration, formatSlotLong } from "../domain/format";
import { buildCalendar } from "../domain/slots";
import { isOnOrAfterStudioDay } from "../domain/time";
import {
  dollarsToCents,
  hasErrors,
  validateServiceDraft,
  type ServiceDraft,
  type ServiceFieldErrors,
} from "../domain/validation";
import { useBookingStore, useSnapshot } from "../store/context";
import type { Booking, BookingStatus } from "../store/types";

const EMPTY_DRAFT: ServiceDraft = {
  name: "",
  summary: "",
  price: "",
  duration: "",
  active: true,
};

const FILTERS = ["all", "pending", "confirmed", "cancelled"] as const;
type Filter = (typeof FILTERS)[number];

const STATUS_ORDER: BookingStatus[] = ["pending", "confirmed", "cancelled"];

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Approved",
  cancelled: "Cancelled",
};

export function AdminPage() {
  const store = useBookingStore();
  const { ready, services, bookings } = useSnapshot();
  useDocumentTitle("Demo desk · Saltbush");

  const [filter, setFilter] = useState<Filter>("all");
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [nextSlot, setNextSlot] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [draft, setDraft] = useState<ServiceDraft>(EMPTY_DRAFT);
  const [draftErrors, setDraftErrors] = useState<ServiceFieldErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const upcoming = bookings.filter((booking) => isOnOrAfterStudioDay(booking.slotStart, store.now()));
  const visible = upcoming
    .filter((booking) => filter === "all" || booking.status === filter)
    .slice()
    .sort((a, b) => a.slotStart.localeCompare(b.slotStart) || a.customerName.localeCompare(b.customerName));
  const groups = STATUS_ORDER.map((status) => ({
    status,
    items: visible.filter((booking) => booking.status === status),
  })).filter((group) => group.items.length > 0);

  const rescheduleBooking = bookings.find((booking) => booking.id === rescheduleId) ?? null;
  const openSlots = useMemo(() => {
    if (!rescheduleBooking) return [];
    return buildCalendar({
      now: store.now(),
      durationMinutes: rescheduleBooking.durationMinutes,
      bookings: bookings.filter((booking) => booking.id !== rescheduleBooking.id),
    })
      .flatMap((day) => day.slots)
      .filter((slot) => slot.available && slot.start !== rescheduleBooking.slotStart);
  }, [bookings, rescheduleBooking, store]);

  async function run(id: string, task: () => Promise<unknown>) {
    setActionId(id);
    setActionError("");
    try {
      await task();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "That change could not be saved.");
    } finally {
      setActionId(null);
    }
  }

  function beginEdit(serviceId: string) {
    const service = services.find((item) => item.id === serviceId);
    if (!service) return;
    setEditingId(service.id);
    setRemoveId(null);
    setDraftErrors({});
    setDraft({
      name: service.name,
      summary: service.summary,
      price: (service.priceCents / 100).toFixed(2),
      duration: String(service.durationMinutes),
      active: service.active,
    });
  }

  function resetDraft() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setDraftErrors({});
  }

  async function onSaveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateServiceDraft(draft);
    setDraftErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    const priceCents = dollarsToCents(draft.price);
    if (priceCents === null) return;
    await run(editingId ?? "new-service", async () => {
      await store.saveService({
        id: editingId ?? undefined,
        name: draft.name,
        summary: draft.summary,
        priceCents,
        durationMinutes: Number(draft.duration),
        active: draft.active,
      });
      resetDraft();
    });
  }

  const counts: Record<Filter, number> = {
    all: upcoming.length,
    pending: upcoming.filter((booking) => booking.status === "pending").length,
    confirmed: upcoming.filter((booking) => booking.status === "confirmed").length,
    cancelled: upcoming.filter((booking) => booking.status === "cancelled").length,
  };

  return (
    <>
      <section className="page-intro">
        <p className="eyebrow">Demo · no login</p>
        <h1>Demo desk</h1>
        <p>
          No login. This page is part of the public demo and only changes sample data in this
          browser. Approve, cancel, or move a booking, or edit the menu.
        </p>
      </section>

      {!ready ? <p role="status">Loading sample data…</p> : null}

      <div className="admin-grid">
        <section aria-labelledby="bookings-heading">
          <div className="section-head">
            <h2 id="bookings-heading">Upcoming bookings</h2>
            <p>From today, grouped by status.</p>
          </div>
          <div className="filter-row" role="group" aria-label="Filter by status">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
              >
                {item === "all" ? "All" : STATUS_LABEL[item]} <span className="count">{counts[item]}</span>
              </button>
            ))}
          </div>
          {actionError ? (
            <p className="field-error" role="alert">
              {actionError}
            </p>
          ) : null}
          {ready && visible.length === 0 ? <p>No sample bookings in this view.</p> : null}
          <div className="booking-groups">
            {groups.map((group) => (
              <section key={group.status} className="status-group" aria-labelledby={`status-${group.status}`}>
                <h3 id={`status-${group.status}`} className="status-group-heading">
                  {STATUS_LABEL[group.status]}
                </h3>
                <ul className="booking-list">
                  {group.items.map((booking) => (
                    <li key={booking.id}>
                      <BookingCard
                        booking={booking}
                        busy={actionId === booking.id}
                        rescheduleOpen={rescheduleId === booking.id}
                        nextSlot={nextSlot}
                        openSlots={openSlots}
                        onApprove={() =>
                          void run(booking.id, () => store.updateBooking(booking.id, { status: "confirmed" }))
                        }
                        onCancel={() =>
                          void run(booking.id, () => store.updateBooking(booking.id, { status: "cancelled" }))
                        }
                        onDelete={() =>
                          void run(booking.id, async () => {
                            await store.deleteBooking(booking.id);
                            if (rescheduleId === booking.id) setRescheduleId(null);
                          })
                        }
                        onToggleReschedule={() => {
                          setRescheduleId((current) => (current === booking.id ? null : booking.id));
                          setNextSlot("");
                          setActionError("");
                        }}
                        onNextSlot={setNextSlot}
                        onSaveReschedule={() => {
                          if (!nextSlot) {
                            setActionError("Choose an open time.");
                            return;
                          }
                          void run(booking.id, async () => {
                            await store.updateBooking(booking.id, { slotStart: nextSlot });
                            setRescheduleId(null);
                            setNextSlot("");
                          });
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>

        <section aria-labelledby="services-heading">
          <div className="section-head">
            <h2 id="services-heading">Services</h2>
            <p>Name, price, duration, and whether it is on the public menu.</p>
          </div>
          <form
            className="stack-form service-editor"
            noValidate
            aria-label={editingId ? "Edit service" : "Add a service"}
            onSubmit={onSaveService}
          >
            <Field id="service-name" label="Service name" error={draftErrors.name}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  value={draft.name}
                  autoComplete="off"
                  aria-invalid={invalid || undefined}
                  aria-describedby={describedBy}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, name: event.target.value }))
                  }
                />
              )}
            </Field>
            <Field id="service-summary" label="Short description" error={draftErrors.summary}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  value={draft.summary}
                  autoComplete="off"
                  aria-invalid={invalid || undefined}
                  aria-describedby={describedBy}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, summary: event.target.value }))
                  }
                />
              )}
            </Field>
            <div className="form-grid">
              <Field id="service-price" label="Price (AUD)" error={draftErrors.price}>
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    inputMode="decimal"
                    value={draft.price}
                    autoComplete="off"
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, price: event.target.value }))
                    }
                  />
                )}
              </Field>
              <Field id="service-duration" label="Duration (minutes)" error={draftErrors.duration}>
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    inputMode="numeric"
                    value={draft.duration}
                    autoComplete="off"
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, duration: event.target.value }))
                    }
                  />
                )}
              </Field>
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, active: event.target.checked }))
                }
              />
              Show on the public menu
            </label>
            <div className="hero-actions">
              <button className="button" type="submit" disabled={actionId !== null}>
                {editingId ? "Save changes" : "Add service"}
              </button>
              {editingId ? (
                <button className="button button-ghost" type="button" onClick={resetDraft}>
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>

          <ul className="service-admin-list">
            {services.map((service) => (
              <li key={service.id} className="service-admin-card">
                <div>
                  <h3>{service.name}</h3>
                  <p>
                    {formatAud(service.priceCents)} · {formatDuration(service.durationMinutes)}
                  </p>
                  <p className="meta">{service.active ? "On the menu" : "Hidden"}</p>
                </div>
                <div className="booking-actions">
                  <button type="button" className="button button-ghost" aria-label={`Edit ${service.name}`} onClick={() => beginEdit(service.id)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button button-danger"
                    aria-label={`Remove ${service.name}`}
                    onClick={() => setRemoveId(service.id)}
                  >
                    Remove
                  </button>
                </div>
                {removeId === service.id ? (
                  <div className="confirm-inline" role="group" aria-label={`Confirm removal of ${service.name}`}>
                    <p>Remove {service.name} from the sample menu?</p>
                    <div className="hero-actions">
                      <button
                        type="button"
                        className="button button-danger"
                        onClick={() =>
                          void run(service.id, async () => {
                            await store.removeService(service.id);
                            if (editingId === service.id) resetDraft();
                            setRemoveId(null);
                          })
                        }
                      >
                        Yes, remove
                      </button>
                      <button type="button" className="button button-ghost" onClick={() => setRemoveId(null)}>
                        Keep
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="reset-panel" aria-labelledby="reset-heading">
        <h2 id="reset-heading">Reset demo data</h2>
        <p>Clears bookings in this browser and restores the sample services.</p>
        {!confirmReset ? (
          <button type="button" className="button button-danger" onClick={() => setConfirmReset(true)}>
            Reset demo data
          </button>
        ) : (
          <div role="group" aria-label="Confirm reset">
            <p>Restore the original sample bookings and services?</p>
            <div className="hero-actions">
              <button
                type="button"
                className="button"
                onClick={() =>
                  void run("reset", async () => {
                    await store.resetDemoData();
                    resetDraft();
                    setRescheduleId(null);
                    setConfirmReset(false);
                  })
                }
              >
                Restore sample data
              </button>
              <button type="button" className="button button-ghost" onClick={() => setConfirmReset(false)}>
                Keep my changes
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function BookingCard({
  booking,
  busy,
  rescheduleOpen,
  nextSlot,
  openSlots,
  onApprove,
  onCancel,
  onDelete,
  onToggleReschedule,
  onNextSlot,
  onSaveReschedule,
}: {
  booking: Booking;
  busy: boolean;
  rescheduleOpen: boolean;
  nextSlot: string;
  openSlots: { start: string }[];
  onApprove: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onToggleReschedule: () => void;
  onNextSlot: (value: string) => void;
  onSaveReschedule: () => void;
}) {
  const when = formatSlotLong(booking.slotStart);
  const dogName = typeof booking.dogName === "string" ? booking.dogName.trim() : "";
  const dogSize = typeof booking.dogSize === "string" ? booking.dogSize : "";
  const dog = dogName && dogSize ? `${dogName} · ${dogSize}` : dogName || dogSize || "Not recorded";
  const [revealed, setRevealed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const contactId = `contact-${booking.id}`;
  const mobile = typeof booking.mobile === "string" ? booking.mobile : "";
  const email = typeof booking.email === "string" ? booking.email : "";
  return (
    <article className="booking-card" aria-label={`Booking for ${booking.customerName} at ${when}`}>
      <header className="booking-head">
        <h3>{booking.customerName}</h3>
        <span className={`pill pill-${booking.status}`}>{STATUS_LABEL[booking.status]}</span>
      </header>
      <dl className="booking-facts">
        <div>
          <dt>Dog</dt>
          <dd>{dog}</dd>
        </div>
        <div>
          <dt>Service</dt>
          <dd>
            {booking.serviceName} · {formatAud(booking.priceCents)} · {formatDuration(booking.durationMinutes)}
          </dd>
        </div>
        <div>
          <dt>When</dt>
          <dd>{when}</dd>
        </div>
        <div>
          <dt>Contact</dt>
          <dd id={contactId}>
            {revealed ? mobile : maskMobile(mobile)} · {revealed ? email : maskEmail(email)}
          </dd>
          <button
            type="button"
            className="button button-ghost"
            aria-expanded={revealed}
            aria-controls={contactId}
            onClick={() => setRevealed((current) => !current)}
          >
            {revealed ? "Hide details" : "Show details"}
          </button>
        </div>
        {booking.notes ? (
          <div>
            <dt>Notes</dt>
            <dd>{booking.notes}</dd>
          </div>
        ) : null}
        <div>
          <dt>Sample email</dt>
          <dd>{booking.emailVerified ? "Confirmed on screen" : "Not confirmed yet"}</dd>
        </div>
      </dl>
      <div className="booking-actions">
        {booking.status === "pending" ? (
          <button type="button" className="button" aria-label={`Approve ${booking.customerName}`} disabled={busy} onClick={onApprove}>
            Approve
          </button>
        ) : null}
        {booking.status !== "cancelled" ? (
          <button type="button" className="button button-ghost" aria-label={`Cancel ${booking.customerName}`} disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        ) : null}
        <button
          type="button"
          className="button button-danger"
          aria-label={`Delete booking for ${booking.customerName}`}
          disabled={busy}
          onClick={() => setConfirmDelete(true)}
        >
          Delete booking
        </button>
        {booking.status !== "cancelled" ? (
          <button
            type="button"
            className="button button-ghost"
            aria-label={`Reschedule ${booking.customerName}`}
            aria-expanded={rescheduleOpen}
            disabled={busy}
            onClick={onToggleReschedule}
          >
            Reschedule
          </button>
        ) : null}
      </div>
      {confirmDelete ? (
        <div className="confirm-inline" role="group" aria-label={`Confirm deletion of ${booking.customerName}`}>
          <p>Delete this booking?</p>
          <div className="hero-actions">
            <button
              type="button"
              className="button button-danger"
              disabled={busy}
              onClick={() => {
                onDelete();
                setConfirmDelete(false);
              }}
            >
              Yes, delete
            </button>
            <button type="button" className="button button-ghost" disabled={busy} onClick={() => setConfirmDelete(false)}>
              Keep it
            </button>
          </div>
        </div>
      ) : null}
      {rescheduleOpen ? (
        <form
          className="reschedule"
          onSubmit={(event) => {
            event.preventDefault();
            onSaveReschedule();
          }}
        >
          <label htmlFor={`resched-${booking.id}`}>New time for {booking.customerName}</label>
          <select id={`resched-${booking.id}`} value={nextSlot} onChange={(event) => onNextSlot(event.target.value)}>
            <option value="">Choose an open time</option>
            {openSlots.map((slot) => (
              <option key={slot.start} value={slot.start}>
                {formatSlotLong(slot.start)}
              </option>
            ))}
          </select>
          {openSlots.length === 0 ? <p>No other open times fit this service.</p> : null}
          <button type="submit" className="button" aria-label={`Save new time for ${booking.customerName}`} disabled={busy}>
            Save new time
          </button>
        </form>
      ) : null}
    </article>
  );
}
