import { HashLink } from "../hashRouter";
import { useDocumentTitle } from "../components/useDocumentTitle";

export function NotFoundPage() {
  useDocumentTitle("Page not found · Saltbush demo");
  return (
    <section className="page-intro">
      <h1>That page is not on this demo.</h1>
      <p>The sample site has a home page, a booking calendar, and a demo desk.</p>
      <HashLink to="/" className="button">
        Back to the salon
      </HashLink>
    </section>
  );
}
