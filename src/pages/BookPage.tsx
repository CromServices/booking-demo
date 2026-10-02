import { useEffect, useState, type FormEvent } from "react";
import { useSiteConfig } from "../config/context";
import type { ExtraField } from "../config/types";
import { fillTemplate } from "../config/template";
import { DayStrip } from "../components/DayStrip";
import { Field } from "../components/Field";
import { useDocumentTitle } from "../components/useDocumentTitle";
import { formatAud, formatClock, formatDuration, formatSlotLong } from "../domain/format";
import { calendarWindow } from "../domain/hours";
import { buildCalendar } from "../domain/slots";
import { studioMinutes } from "../domain/time";
import {
  hasErrors,
  validateBookingForm,
  type BookingFormErrors,
  type BookingFormValues,
} from "../domain/validation";
import { HashLink, useHashLocation } from "../hashRouter";
import { useBookingStore, useSnapshot } from "../store/context";
import type { Booking } from "../store/types";

function emptyValues(fields: readonly ExtraField[]): BookingFormValues {
  return {
    name: "",
    mobile: "",
    email: "",
    serviceId: "",
    slotStart: "",
    notes: "",
    extras: Object.fromEntries(fields.map((field) => [field.id, ""])),
  };
}

export function BookPage() {
  const config = useSiteConfig();
  const store = useBookingStore();
  const { ready, services, bookings } = useSnapshot();
  const { search } = useHashLocation();
  const requested = search.get("service") ?? "";
  useDocumentTitle(config.titles.book);
  const copy = config.book;
  const schedule = calendarWindow(config);

  const [values, setValues] = useState<BookingFormValues>(() => emptyValues(config.extraFields));
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
    const next = {
      ...values,
      ...partial,
      extras: partial.extras ? { ...values.extras, ...partial.extras } : values.extras,
    };
    setValues(next);
    if (showErrors) setErrors(validateBookingForm(next, config.extraFields));
  }

  const activeServices = services.filter((service) => service.active);
  const selectedService = activeServices.find((service) => service.id === values.serviceId);
  const days = selectedService
    ? buildCalendar({
        now: store.now(),
        durationMinutes: selectedService.durationMinutes,
        bookings,
        ...schedule,
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
        ...schedule,
      }).some((day) => day.slots.some((slot) => slot.available && slot.start === slotStart));
      if (!stillOpen) slotStart = "";
    }
    update({ serviceId: id, slotStart });
  }

  function fieldError(id: string): string | undefined {
    if (config.extraFields.some((field) => field.id === id)) return errors.extras?.[id];
    return errors[id as keyof Omit<BookingFormErrors, "extras">] as string | undefined;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateBookingForm(values, config.extraFields);
    setErrors(nextErrors);
    setShowErrors(true);
    setFormError("");
    if (hasErrors(nextErrors)) {
      const order = ["name", "mobile", "email", ...config.extraFields.map((field) => field.id), "serviceId", "slotStart", "notes"];
      const first = order.find((key) => (key in (nextErrors.extras ?? {}) ? nextErrors.extras?.[key] : nextErrors[key as keyof BookingFormErrors]));
      const focusId = first === "serviceId" ? "service-choice" : first === "slotStart" ? "open-times" : first;
      const showDetails =
        first === "name" ||
        first === "mobile" ||
        first === "email" ||
        config.extraFields.some((field) => field.id === first);
      window.setTimeout(() => {
        const target = document.getElementById(focusId ?? "");
        const anchor = showDetails ? document.querySelector<HTMLElement>(".booking-form") ?? target : target;
        anchor?.scrollIntoView?.({ block: "start" });
        target?.focus({ preventScroll: true });
      }, 0);
      return;
    }
    setBusy(true);
    try {
      const booking = await store.createBooking({
        customerName: values.name,
        extras: Object.fromEntries(config.extraFields.map((field) => [field.id, values.extras[field.id] ?? ""])),
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
    setValues(emptyValues(config.extraFields));
    setErrors({});
    setShowErrors(false);
    setServiceTouched(false);
    setDayKey(null);
  }

  const pendingVars = pending
    ? {
        customerName: pending.customerName,
        serviceName: pending.serviceName,
        when: formatSlotLong(pending.slotStart),
        price: formatAud(pending.priceCents),
        duration: formatDuration(pending.durationMinutes),
        ...pending.extras,
      }
    : null;

  const selectionBits = [
    selectedService?.name,
    ...config.extraFields.map((field) => values.extras[field.id]?.trim()).filter(Boolean),
    values.slotStart ? formatSlotLong(values.slotStart) : "",
    selectedService ? formatAud(selectedService.priceCents) : "",
  ].filter(Boolean);

  return (
    <>
      <section className="page-intro">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
      </section>

      {!ready ? <p role="status">{config.loading}</p> : null}

      {pending && !confirmed && pendingVars ? (
        <section className="confirm-layout" aria-labelledby="email-heading">
          <div>
            <h2 id="email-heading">{copy.emailHeading}</h2>
            <p>{copy.emailIntro}</p>
          </div>
          <article className="email-sheet" aria-label={copy.emailArticleLabel}>
            <p className="email-kicker">{copy.emailKicker}</p>
            <p>
              <span className="meta">From</span> {copy.emailFrom}
            </p>
            <p>
              <span className="meta">To</span> {pending.email}
            </p>
            <p>
              <span className="meta">Subject</span> {copy.emailSubject}
            </p>
            <hr />
            <p>{fillTemplate(copy.emailHello, pendingVars)}</p>
            <p>{fillTemplate(copy.emailBody, pendingVars)}</p>
            <p className="meta">{copy.codeLabel}</p>
            <output className="code-digits" aria-label={copy.codeLabel}>
              {pending.confirmationCode}
            </output>
          </article>
          <form className="stack-form" noValidate onSubmit={onConfirm} aria-label={copy.confirmFormLabel}>
            <Field id="confirm-code" label={copy.confirmLabel} error={confirmError} hint={copy.confirmHint}>
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
              {busy ? copy.confirmBusy : copy.confirmButton}
            </button>
          </form>
        </section>
      ) : null}

      {confirmed && pending && pendingVars ? (
        <section className="success-card" aria-labelledby="lodged-heading">
          <p className="eyebrow">{copy.successEyebrow}</p>
          <h2 id="lodged-heading">{copy.successHeading}</h2>
          <p>{fillTemplate(copy.successBody, pendingVars)}</p>
          <div className="hero-actions">
            <HashLink to="/admin" className="button">
              {copy.deskCta}
            </HashLink>
            <button className="button button-ghost" type="button" onClick={startAnother}>
              {copy.anotherCta}
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
              {copy.serviceLegend}
            </legend>
            {ready && activeServices.length === 0 ? (
              <p>{config.emptyServices}</p>
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
              <h2 id="times-heading">{copy.timesHeading}</h2>
              <p>{copy.timesNote}</p>
            </div>
            {!selectedService ? <p>{copy.chooseService}</p> : null}
            {selectedService && activeDay ? (
              <>
                <div className="legend">
                  <span>
                    <i className="swatch open" /> {copy.openLabel}
                  </span>
                  <span>
                    <i className="swatch taken" /> {copy.takenLabel}
                  </span>
                </div>
                <DayStrip days={days} activeDateKey={activeDay.dateKey} onSelect={setDayKey} />
                <div role="tabpanel" id="slot-panel" aria-labelledby={`day-${activeDay.dateKey}`} className="slot-panel">
                  <h3>{activeDay.longLabel}</h3>
                  {activeDay.slots.length === 0 ? (
                    <p>{activeDay.closed ? copy.closedDay : copy.noTimes}</p>
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
                            {!slot.available ? <span className="slot-tag">{copy.takenLabel}</span> : null}
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

          <form className="booking-form" noValidate onSubmit={onSubmit} aria-label={copy.formLabel}>
            <div className="section-head">
              <h2>{copy.detailsHeading}</h2>
              <p>{copy.detailsNote}</p>
            </div>
            {selectedService && values.slotStart ? <p className="selection">{selectionBits.join(" · ")}</p> : null}
            <p className="demo-hint">
              <svg className="demo-hint-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.75" />
                <path d="M12 11.2v5.3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                <circle cx="12" cy="8" r="1" fill="currentColor" />
              </svg>
              <span>{copy.formHint}</span>
            </p>
            <div className="form-grid">
              <Field id="name" label={config.fields.name.label} error={errors.name}>
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
                label={config.fields.mobile.label}
                error={errors.mobile}
                hint={config.fields.mobile.hint}
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
              <Field id="email" label={config.fields.email.label} error={errors.email} className="wide">
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
              {config.extraFields.map((field) => (
                <ExtraInput
                  key={field.id}
                  field={field}
                  value={values.extras[field.id] ?? ""}
                  error={fieldError(field.id)}
                  onChange={(value) => update({ extras: { [field.id]: value } })}
                />
              ))}
              <Field id="notes" label={config.fields.notes.label} error={errors.notes} className="wide">
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
              {busy ? copy.submitBusy : copy.submit}
            </button>
            <p className="meta">{copy.afterNote}</p>
          </form>
        </>
      ) : null}
    </>
  );
}

function ExtraInput({
  field,
  value,
  error,
  onChange,
}: {
  field: ExtraField;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field id={field.id} label={field.label} error={error} hint={field.hint} className={field.wide ? "wide" : undefined}>
      {({ id, describedBy, invalid }) =>
        field.kind === "select" ? (
          <select
            id={id}
            name={field.id}
            value={value}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onChange={(event) => onChange(event.target.value)}
          >
            <option value="">{field.emptyLabel ?? ""}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            name={field.id}
            autoComplete={field.autoComplete}
            value={value}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            onChange={(event) => onChange(event.target.value)}
          />
        )
      }
    </Field>
  );
}
