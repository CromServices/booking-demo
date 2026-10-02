import { useLayoutEffect, type ReactNode } from "react";
import { useSiteConfig } from "../config/context";
import { HashLink } from "../hashRouter";
import { defaultLogo } from "../theme/firm";
import { CromCredit } from "./CromCredit";

function assetSrc(src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  return `${import.meta.env.BASE_URL}${src.replace(/^\//, "")}`;
}

function BrandMark() {
  const config = useSiteConfig();
  if (config.headerArt) {
    const art = config.headerArt;
    return (
      <img
        className="brand-lockup"
        src={assetSrc(art.src)}
        alt={art.alt}
        width={art.width}
        height={art.height}
      />
    );
  }
  const logo = config.logo ?? defaultLogo;
  const image = (
    <img className="brand-logo" src={logo.light} alt={logo.alt} width={logo.width} height={logo.height} />
  );
  if (config.theme?.dark === false) return image;
  return (
    <picture>
      <source media="(prefers-color-scheme: dark)" srcSet={logo.dark} />
      {image}
    </picture>
  );
}

function FooterCredit() {
  const config = useSiteConfig();
  if (config.credit === "light" || config.credit === "dark") {
    return <CromCredit variant={config.credit} />;
  }
  return (
    <span className="credit-system">
      <span className="credit-when-light">
        <CromCredit variant="light" />
      </span>
      <span className="credit-when-dark">
        <CromCredit variant="dark" />
      </span>
    </span>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const config = useSiteConfig();
  useLayoutEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return;
    const apply = () => {
      const height = Math.ceil(header.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--header-offset", `${height + 16}px`);
    };
    apply();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(apply);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <div className="demo-banner" role="note">
        <p className="wrap">{config.banner}</p>
      </div>
      <header className="site-header">
        <div className="wrap header-row">
          <a className="brand" href="#/">
            <BrandMark />
          </a>
          <nav className="primary-nav" aria-label="Primary">
            <HashLink to="/">{config.nav.home}</HashLink>
            <HashLink to="/book">{config.nav.book}</HashLink>
            <HashLink to="/admin" className="nav-demo">
              {config.nav.admin}
            </HashLink>
          </nav>
        </div>
      </header>
      <main id="content" className="wrap page">
        {children}
      </main>
      <footer className="site-footer">
        <div className="wrap footer-grid">
          <p>
            <FooterCredit />
          </p>
          <p>
            <a href={`mailto:${config.footerEmail}`}>{config.footerEmail}</a>
          </p>
          <p>{config.footerNote}</p>
        </div>
      </footer>
    </>
  );
}
