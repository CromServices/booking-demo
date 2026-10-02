import { describeHours } from "../domain/hours";
import { formatAud, formatDuration } from "../domain/format";
import { HashLink } from "../hashRouter";
import { StudioScene } from "../components/Mark";
import { useDocumentTitle } from "../components/useDocumentTitle";
import { useSnapshot } from "../store/context";

export function HomePage() {
  const { ready, services } = useSnapshot();
  useDocumentTitle("Saltbush Dog Grooming · Demo");
  const active = services.filter((service) => service.active);
  const hours = describeHours();

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Dog grooming · By appointment</p>
          <h1>A calm groom for dogs who would rather be at the beach.</h1>
          <p className="lede">
            Gentle baths, tidy clips and nail trims in a quiet studio, one dog at a time. Pick a
            service, choose an open time and you're booked in under a minute.
          </p>
          <div className="hero-actions">
            <HashLink to="/book?service=svc-bath" className="button">
              Check open times
            </HashLink>
            <HashLink to="/admin" className="button button-ghost">
              Demo desk
            </HashLink>
          </div>
        </div>
        <div className="hero-panel">
          <StudioScene />
          <p>Quiet studio · one dog at a time</p>
        </div>
      </section>

      <section className="section" aria-labelledby="services-heading">
        <div className="section-head">
          <h2 id="services-heading">Services</h2>
          <p>Prices in Australian dollars.</p>
        </div>
        {!ready ? <p role="status">Loading sample data…</p> : null}
        {ready && active.length === 0 ? (
          <p>The sample menu is empty. Restore it from the demo desk.</p>
        ) : null}
        <ul className="service-grid">
          {active.map((service) => (
            <li key={service.id} className="service-card">
              <h3>{service.name}</h3>
              <p>{service.summary}</p>
              <p className="price">{formatAud(service.priceCents)}</p>
              <p className="meta">{formatDuration(service.durationMinutes)}</p>
              <HashLink to={`/book?service=${service.id}`} className="text-link">
                See times for {service.name}
              </HashLink>
            </li>
          ))}
        </ul>
      </section>

      <section className="info-grid">
        <article className="info-card">
          <h2>Hours</h2>
          <dl className="hours">
            {hours.map((line) => (
              <div key={line.label}>
                <dt>{line.label}</dt>
                <dd>{line.value}</dd>
              </div>
            ))}
          </dl>
          <p className="meta">Times are studio time. The calendar shows the next 14 days.</p>
        </article>
        <article className="info-card">
          <h2>How a booking works</h2>
          <ol className="steps">
            <li>Choose a service and an open time.</li>
            <li>Leave your name, the dog's name and size, an Australian mobile, and an email.</li>
            <li>Read the confirmation code on the sample email. Nothing is sent.</li>
            <li>The demo desk approves, moves, or cancels the request.</li>
          </ol>
        </article>
      </section>

      <section className="visit">
        <h2>The studio</h2>
        <p>12 Demonstration Lane. This address is fictional.</p>
      </section>
    </>
  );
}
