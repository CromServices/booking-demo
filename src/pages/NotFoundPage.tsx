import { useSiteConfig } from "../config/context";
import { HashLink } from "../hashRouter";
import { useDocumentTitle } from "../components/useDocumentTitle";

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
