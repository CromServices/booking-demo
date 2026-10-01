import type { ReactNode } from "react";
import { HashLink } from "../hashRouter";
import { Mark } from "./Mark";

const BANNER =
  "Demo site by Crom Services. Not a real business. Sample data only. Emails are simulated.";

export function Layout({ children }: { children: ReactNode }) {
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
            <Mark />
            <span>
              <strong>Saltbush</strong>
              <small>Dog Grooming · Fremantle</small>
            </span>
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
          <p>Crom Services · Perth WA · Remote across Australia</p>
          <p>
            <a href="mailto:cromservices@gmail.com">cromservices@gmail.com</a>
          </p>
          <p>Portfolio demo. Saltbush Dog Grooming is not a real business.</p>
        </div>
      </footer>
    </>
  );
}
