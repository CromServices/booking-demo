import { assetSrc, imageType } from "../config/assets";
import { fillTemplate } from "../config/template";
import { useSiteConfig } from "../config/context";
import type { HeroArt } from "../config/types";
import { formatAud, formatDuration } from "../domain/format";
import { HashLink } from "../hashRouter";
import { useDocumentTitle } from "../components/useDocumentTitle";
import { useSnapshot } from "../store/context";

function HeroImage({ art }: { art: HeroArt }) {
  const image = (
    <img
      className="scene"
      src={assetSrc(art.fallback ?? art.src)}
      alt={art.alt}
      width={art.width}
      height={art.height}
      decoding="async"
    />
  );
  if (!art.fallback) return image;
  return (
    <picture>
      <source srcSet={assetSrc(art.src)} type={imageType(art.src)} />
      {image}
    </picture>
  );
}

export function HomePage() {
  const config = useSiteConfig();
  const { ready, services } = useSnapshot();
  useDocumentTitle(config.titles.home);
  const active = services.filter((service) => service.active);
  const hours = config.schedule.lines;
  const home = config.home;

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{home.eyebrow}</p>
          <h1>{home.headline}</h1>
          <p className="lede">{home.lede}</p>
          <div className="hero-actions">
            <HashLink to={home.primaryHref} className="button">
              {home.primaryCta}
            </HashLink>
            <HashLink to={home.secondaryHref} className="button button-ghost">
              {home.secondaryCta}
            </HashLink>
          </div>
        </div>
        <div className="hero-panel">
          {config.heroArt ? <HeroImage art={config.heroArt} /> : null}
          <p>{home.heroNote}</p>
        </div>
      </section>

      <section className="section" aria-labelledby="services-heading">
        <div className="section-head">
          <h2 id="services-heading">{home.servicesHeading}</h2>
          <p>{home.servicesNote}</p>
        </div>
        {!ready ? <p role="status">{config.loading}</p> : null}
        {ready && active.length === 0 ? <p>{config.emptyServices}</p> : null}
        <ul className="service-grid">
          {active.map((service) => (
            <li key={service.id} className="service-card">
              <h3>{service.name}</h3>
              <p>{service.summary}</p>
              <p className="price">{formatAud(service.priceCents)}</p>
              <p className="meta">{formatDuration(service.durationMinutes)}</p>
              <HashLink to={`/book?service=${service.id}`} className="text-link">
                {fillTemplate(home.seeTimes, { name: service.name })}
              </HashLink>
            </li>
          ))}
        </ul>
      </section>

      <section className="info-grid">
        <article className="info-card">
          <h2>{home.hoursHeading}</h2>
          <dl className="hours">
            {hours.map((line) => (
              <div key={line.label}>
                <dt>{line.label}</dt>
                <dd>{line.value}</dd>
              </div>
            ))}
          </dl>
          <p className="meta">{home.hoursNote}</p>
        </article>
        <article className="info-card">
          <h2>{home.howHeading}</h2>
          <ol className="steps">
            {home.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>
      </section>

      <section className="visit">
        <h2>{home.visitHeading}</h2>
        <p>{home.visitBody}</p>
      </section>
    </>
  );
}
