import { useLayoutEffect, type ReactNode } from "react";
import { HashLink } from "../hashRouter";

const BANNER =
  "Demo site by Crom Services. Not a real business. Sample data only. Emails are simulated.";

export function Layout({ children }: { children: ReactNode }) {
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
        <p className="wrap">{BANNER}</p>
      </div>
      <header className="site-header">
        <div className="wrap header-row">
          <a className="brand" href="#/">
            <img
              className="brand-lockup"
              src={`${import.meta.env.BASE_URL}saltbush-header-light.svg`}
              alt="Saltbush Dog Grooming"
              width={327}
              height={76}
            />
          </a>
          <nav className="primary-nav" aria-label="Primary">
            <HashLink to="/">Home</HashLink>
            <HashLink to="/book">Book</HashLink>
            <HashLink to="/admin" className="nav-demo">
              Demo admin
            </HashLink>
          </nav>
        </div>
      </header>
      <main id="content" className="wrap page">
        {children}
      </main>
      <footer className="site-footer">
        <div className="wrap footer-grid">
          <p>Crom Services · Australia</p>
          <p>
            <a href="mailto:cromservices@gmail.com">cromservices@gmail.com</a>
          </p>
          <p>Portfolio demo. Saltbush Dog Grooming is not a real business.</p>
        </div>
      </footer>
    </>
  );
}
