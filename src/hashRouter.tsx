import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type HashLocation = {
  path: string;
  search: URLSearchParams;
};

export function parseHash(hash: string): HashLocation {
  const raw = hash.replace(/^#/, "");
  const queryIndex = raw.indexOf("?");
  const pathPart = (queryIndex === -1 ? raw : raw.slice(0, queryIndex)) || "/";
  const query = queryIndex === -1 ? "" : raw.slice(queryIndex + 1);
  const withSlash = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
  const path = withSlash.length > 1 && withSlash.endsWith("/") ? withSlash.slice(0, -1) : withSlash;
  return { path, search: new URLSearchParams(query) };
}

const HashContext = createContext<HashLocation | null>(null);

export function HashRouter({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    const sync = () => setLocation(parseHash(window.location.hash));
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return <HashContext.Provider value={location}>{children}</HashContext.Provider>;
}

export function useHashLocation(): HashLocation {
  const location = useContext(HashContext);
  if (!location) throw new Error("useHashLocation must be used within HashRouter");
  return location;
}

export function HashLink({
  to,
  className,
  children,
}: {
  to: string;
  className?: string;
  children: ReactNode;
}) {
  const { path } = useHashLocation();
  const pathname = to.split("?")[0] || "/";
  const current = path === pathname;
  const classes = [className, current ? "active" : ""].filter(Boolean).join(" ") || undefined;
  return (
    <a href={`#${to}`} className={classes} aria-current={current ? "page" : undefined}>
      {children}
    </a>
  );
}
