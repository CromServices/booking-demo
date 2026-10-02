import { createContext, useContext, type ReactNode } from "react";
import { siteConfig } from "../site.config";
import type { SiteConfig } from "./types";

const SiteConfigContext = createContext<SiteConfig>(siteConfig);

export function SiteProvider({ config, children }: { config: SiteConfig; children: ReactNode }) {
  return <SiteConfigContext.Provider value={config}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig(): SiteConfig {
  return useContext(SiteConfigContext);
}
