import { useEffect, useState, type FormEvent } from "react";
import { DayStrip } from "../components/DayStrip";
import { Field } from "../components/Field";
import { useDocumentTitle } from "../components/useDocumentTitle";
import { formatAud, formatClock, formatDuration, formatSlotLong } from "../domain/format";
import { buildCalendar } from "../domain/slots";
import { studioMinutes } from "../domain/time";
import {
  hasErrors,
  isDogSize,
  validateBookingForm,
  type BookingFormErrors,
  type BookingFormValues,
} from "../domain/validation";
import { HashLink, useHashLocation } from "../hashRouter";
import { useBookingStore, useSnapshot } from "../store/context";
import type { Booking, DogSize } from "../store/types";

const EMPTY: BookingFormValues = {
  name: "",
  dogName: "",
  dogSize: "",
  mobile: "",
  email: "",
  serviceId: "",
  slotStart: "",
  notes: "",
};

export function BookPage() {
  const store = useBookingStore();
  const { ready, services, bookings } = useSnapshot();
  const { search } = useHashLocation();
  const requested = search.get("service") ?? "";
  useDocumentTitle("Book a visit · Saltbush demo");

  const [values, setValues] = useState<BookingFormValues>(EMPTY);
  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [showErrors, setShowErrors] = useState(false);
  const [serviceTouched, setServiceTouched] = useState(false);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Booking | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!pending) return;
    if (confirmed) {
      document.getElementById("lodged-heading")?.scrollIntoView?.({ block: "start" });
      return;
    }
    document.getElementById("email-heading")?.scrollIntoView?.({ block: "start" });
    document.getElementById("confirm-code")?.focus({ preventScroll: true });
  }, [pending, confirmed]);

  useEffect(() => {
    if (serviceTouched || !requested) return;
    if (!services.some((service) => service.id === requested && service.active)) return;
    setValues((current) =>
      current.serviceId === requested ? current : { ...current, serviceId: requested },
    );
  }, [requested, services, serviceTouched]);

  function update(partial: Partial<BookingFormValues>) {
    const next = { ...values, ...partial };
    setValues(next);
    if (showErrors) setErrors(validateBookingForm(next));
  }

  const activeServices = services.filter((service) => service.active);
  const selectedService = activeServices.find((service) => service.id === values.serviceId);
  const days = selectedService
    ? buildCalendar({
        now: store.now(),
        durationMinutes: selectedService.durationMinutes,
        bookings,
      })
    : [];
  const activeDay =
    days.find((day) => day.dateKey === dayKey) ??
    days.find((day) => day.slots.some((slot) => slot.available)) ??
    days[0];

  function chooseService(id: string) {
    setServiceTouched(true);
    const service = activeServices.find((item) => item.id === id);
    let slotStart = values.slotStart;
    if (service && slotStart) {
      const stillOpen = buildCalendar({
        now: store.now(),
        durationMinutes: service.durationMinutes,
        bookings,
      }).some((day) => day.slots.some((slot) => slot.available && slot.start === slotStart));
      if (!stillOpen) slotStart = "";
    }
    update({ serviceId: id, slotStart });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateBookingForm(values);
    setErrors(nextErrors);
    setShowErrors(true);
    setFormError("");
    if (hasErrors(nextErrors)) {
      const order = ["name", "mobile", "email", "dogName", "dogSize", "serviceId", "slotStart", "notes"] as const;
      const first = order.find((key) => nextErrors[key]);
      const focusId =
        first === "serviceId"
          ? "service-choice"
          : first === "slotStart"
            ? "open-times"
            : first === "dogName"
              ? "dog-name"
              : first === "dogSize"
                ? "dog-size"
                : first;
      const showDetails =
        first === "name" || first === "mobile" || first === "email" || first === "dogName" || first === "dogSize";
      window.setTimeout(() => {
        const target = document.getElementById(focusId ?? "");
        const anchor = showDetails
          ? document.querySelector<HTMLElement>(".booking-form") ?? target
          : target;
        anchor?.scrollIntoView?.({ block: "start" });
        target?.focus({ preventScroll: true });
      }, 0);
      return;
    }
    if (!isDogSize(values.dogSize)) return;
    const dogSize: DogSize = values.dogSize;
    setBusy(true);
    try {
      const booking = await store.createBooking({
        customerName: values.name,
        dogName: values.dogName,
        dogSize,
        mobile: values.mobile,
        email: values.email,
        serviceId: values.serviceId,
        slotStart: values.slotStart,
        notes: values.notes,
      });
      setPending(booking);
      setConfirmCode("");
      setConfirmError("");
      setConfirmed(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save that booking.");
    } finally {
      setBusy(false);
    }
  }

  async function onConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending) return;
    setBusy(true);
    setConfirmError("");
    try {
      await store.confirmBooking(pending.id, confirmCode);
      setConfirmed(true);
    } catch (error) {
      setConfirmError(error instanceof Error ? error.message : "Could not confirm that code.");
    } finally {
      setBusy(false);
    }
  }

  function startAnother() {
    setPending(null);
    setConfirmed(false);
    setConfirmCode("");
    setConfirmError("");
    setValues(EMPTY);
    setErrors({});
    setShowErrors(false);
    setServiceTouched(false);
    setDayKey(null);
  }

  return (
    <>
      <section className="page-intro">
        <p className="eyebrow">Online booking</p>
        <h1>Book a visit</h1>
        <p>
          Choose a service, then an open time in the next two weeks. Taken times stay visible and
          cannot be selected. Nothing on this page is emailed.
        </p>
      </section>

      {!ready ? <p role="status">Loading sample data…</p> : null}

      {pending && !confirmed ? (
        <section className="confirm-layout" aria-labelledby="email-heading">
          <div>
            <h2 id="email-heading">Simulated confirmation email</h2>
            <p>Read the code here. It is not sent to the address below.</p>
          </div>
          <article className="email-sheet" aria-label="Simulated confirmation email">
            <p className="email-kicker">Simulated email · not sent</p>
            <p>
              <span className="meta">From</span> Saltbush Dog Grooming &lt;bookings@saltbush.example&gt;
            </p>
            <p>
              <span className="meta">To</span> {pending.email}
            </p>
            <p>
              <span className="meta">Subject</span> Your sample confirmation code
            </p>
            <hr />
            <p>Hello {pending.customerName},</p>
            <p>
              This message was not sent. It only exists on this demo page so you can confirm the
              request for {pending.serviceName} for {pending.dogName} ({pending.dogSize}) on{" "}
              {formatSlotLong(pending.slotStart)} (
              {formatAud(pending.priceCents)}, {formatDuration(pending.durationMinutes)}).
            </p>
            <p className="meta">Confirmation code</p>
            <output className="code-digits" aria-label="Confirmation code">
              {pending.confirmationCode}
            </output>
          </article>
          <form className="stack-form" noValidate onSubmit={onConfirm} aria-label="Confirm the sample code">
            <Field
              id="confirm-code"
              label="Code from the sample email"
              error={confirmError}
              hint="Type the 6-digit code shown above."
            >
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  value={confirmCode}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  spellCheck={false}
                  aria-invalid={invalid || undefined}
                  aria-describedby={describedBy}
                  onChange={(event) => setConfirmCode(event.target.value)}
                />
              )}
            </Field>
            <button className="button" type="submit" disabled={busy}>
              {busy ? "Checking…" : "Confirm with code"}
            </button>
          </form>
        </section>
      ) : null}

      {confirmed && pending ? (
        <section className="success-card" aria-labelledby="lodged-heading">
          <p className="eyebrow">Sample code matched</p>
          <h2 id="lodged-heading">Request lodged</h2>
          <p>
            {pending.customerName} is pending in the demo desk for {pending.dogName} ({pending.dogSize}),{" "}
            {pending.serviceName} on {formatSlotLong(pending.slotStart)}. No email was sent.
          </p>
          <div className="hero-actions">
            <HashLink to="/admin" className="button">
              Open the demo desk
            </HashLink>
            <button className="button button-ghost" type="button" onClick={startAnother}>
              Book another time
            </button>
          </div>
        </section>
      ) : null}

      {!pending ? (
        <>
          <fieldset
            className="service-field"
            aria-invalid={errors.serviceId ? true : undefined}
            aria-describedby={errors.serviceId ? "service-error" : undefined}
          >
            <legend id="service-choice" tabIndex={-1}>
              Service
            </legend>
            {ready && activeServices.length === 0 ? (
              <p>The sample menu is empty. Restore it from the demo desk.</p>
            ) : (
              <div className="choice-grid">
                {activeServices.map((service) => (
                  <label key={service.id} className="choice">
                    <input
                      type="radio"
                      name="service"
                      value={service.id}
                      checked={values.serviceId === service.id}
                      onChange={() => chooseService(service.id)}
                    />
                    <span className="choice-copy">
                      <span className="choice-name">{service.name}</span>
                      <span className="choice-meta">
                        {formatAud(service.priceCents)} · {formatDuration(service.durationMinutes)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
            {errors.serviceId ? (
              <p id="service-error" className="field-error" role="alert">
                {errors.serviceId}
              </p>
            ) : null}
          </fieldset>

          <section
            id="open-times"
            className="calendar"
            tabIndex={-1}
            aria-labelledby="times-heading"
            aria-describedby={errors.slotStart ? "slot-error" : undefined}
          >
            <div className="section-head">
              <h2 id="times-heading">Open times</h2>
              <p>Studio hours, next 14 days. Taken slots stay on the calendar.</p>
            </div>
            {!selectedService ? <p>Choose a service to see times that fit.</p> : null}
            {selectedService && activeDay ? (
              <>
                <div className="legend">
                  <span>
                    <i className="swatch open" /> Open
                  </span>
                  <span>
                    <i className="swatch taken" /> Taken
                  </span>
                </div>
                <DayStrip
                  days={days}
                  activeDateKey={activeDay.dateKey}
                  onSelect={setDayKey}
                />
                <div
                  role="tabpanel"
                  id="slot-panel"
                  aria-labelledby={`day-${activeDay.dateKey}`}
                  className="slot-panel"
                >
                  <h3>{activeDay.longLabel}</h3>
                  {activeDay.slots.length === 0 ? (
                    <p>{activeDay.closed ? "The studio is closed this day." : "No times left this day."}</p>
                  ) : (
                    <div className="slot-grid">
                      {activeDay.slots.map((slot) => {
                        const clock = formatClock(studioMinutes(new Date(slot.start)));
                        const selected = values.slotStart === slot.start;
                        return (
                          <button
                            key={slot.start}
                            type="button"
                            className={selected ? "slot selected" : slot.available ? "slot" : "slot taken"}
                            disabled={!slot.available}
                            aria-pressed={selected}
                            aria-label={slot.available ? `${clock} available` : `${clock} taken`}
                            onClick={() => update({ slotStart: slot.start })}
                          >
                            <span>{clock}</span>
                            {!slot.available ? <span className="slot-tag">Taken</span> : null}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : null}
            {errors.slotStart ? (
              <p id="slot-error" className="field-error" role="alert">
                {errors.slotStart}
              </p>
            ) : null}
          </section>

          <form className="booking-form" noValidate onSubmit={onSubmit} aria-label="Booking details">
            <div className="section-head">
              <h2>Your details</h2>
              <p>Name, mobile, email, the dog's name and size, service, and time are required. Notes can be left blank.</p>
            </div>
            {selectedService && values.slotStart ? (
              <p className="selection">
                {selectedService.name}
                {values.dogName.trim() ? ` · ${values.dogName.trim()}` : ""}
                {values.dogSize ? ` · ${values.dogSize}` : ""} · {formatSlotLong(values.slotStart)} ·{" "}
                {formatAud(selectedService.priceCents)}
              </p>
            ) : null}
            <div className="form-grid">
              <Field id="name" label="Name" error={errors.name}>
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    name="name"
                    autoComplete="name"
                    value={values.name}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                    onChange={(event) => update({ name: event.target.value })}
                  />
                )}
              </Field>
              <Field
                id="mobile"
                label="Mobile"
                error={errors.mobile}
                hint="An Australian mobile, such as 0412 345 678."
              >
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    name="mobile"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={values.mobile}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                    onChange={(event) => update({ mobile: event.target.value })}
                  />
                )}
              </Field>
              <Field id="email" label="Email" error={errors.email} className="wide">
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={values.email}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                    onChange={(event) => update({ email: event.target.value })}
                  />
                )}
              </Field>
              <Field id="dog-name" label="Dog's name" error={errors.dogName}>
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    name="dog-name"
                    autoComplete="off"
                    value={values.dogName}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                    onChange={(event) => update({ dogName: event.target.value })}
                  />
                )}
              </Field>
              <Field id="dog-size" label="Size" error={errors.dogSize}>
                {({ id, describedBy, invalid }) => (
                  <select
                    id={id}
                    name="dog-size"
                    value={values.dogSize}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                    onChange={(event) => update({ dogSize: isDogSize(event.target.value) ? event.target.value : "" })}
                  >
                    <option value="">Choose a size</option>
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                    <option value="Giant">Giant</option>
                  </select>
                )}
              </Field>
              <Field id="notes" label="Notes" error={errors.notes} className="wide">
                {({ id, describedBy, invalid }) => (
                  <textarea
                    id={id}
                    name="notes"
                    rows={4}
                    value={values.notes}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                    onChange={(event) => update({ notes: event.target.value })}
                  />
                )}
              </Field>
            </div>
            {formError ? (
              <p className="field-error" role="alert">
                {formError}
              </p>
            ) : null}
            <button className="button" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Request this time"}
            </button>
            <p className="meta">The code in the next step is shown on screen and is never emailed.</p>
          </form>
        </>
      ) : null}
    </>
  );
}
