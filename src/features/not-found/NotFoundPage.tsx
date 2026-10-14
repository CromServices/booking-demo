import { useSiteConfig } from "../site-config/context";
import { HashLink } from "../../shared/routing/hashRouter";
import { useDocumentTitle } from "../../shared/ui/useDocumentTitle";

export function NotFoundPage() {
  const config = useSiteConfig();
  useDocumentTitle(config.titles.notFound);
  return (
    <section className="page-intro">
      <h1>{config.notFound.title}</h1>
      <p>{config.notFound.body}</p>
      <HashLink to="/" className="button">
        {config.notFound.cta}
      </HashLink>
    </section>
  );
}
