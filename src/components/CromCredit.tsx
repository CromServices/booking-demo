/**
 * "Built by Crom Services" footer credit.
 * Canonical snippet and hosted assets: https://cromservices.com.au/brand/credit/
 * Use variant "light" on light or cream footers and "dark" on dark footers.
 */
const BASE = "https://cromservices.com.au/brand/credit/crom-credit-mark";

type Props = { variant?: "light" | "dark" };

export function CromCredit({ variant = "light" }: Props) {
  const tone = variant === "dark" ? "white" : "ink";
  const color = variant === "dark" ? "#cdd6d1" : "#4a5752";
  return (
    <a
      className="crom-credit"
      href="https://cromservices.com.au"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Built by Crom Services"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        textDecoration: "none",
        color,
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 1,
      }}
    >
      <img
        src={`${BASE}-${tone}@1x.png`}
        srcSet={`${BASE}-${tone}@1x.png 1x, ${BASE}-${tone}@2x.png 2x, ${BASE}-${tone}@3x.png 3x`}
        width={34}
        height={18}
        alt=""
        style={{ display: "block", height: 18, width: "auto" }}
      />
      <span>Built by Crom Services</span>
    </a>
  );
}
