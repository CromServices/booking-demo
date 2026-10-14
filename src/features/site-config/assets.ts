/** Resolves a config asset: absolute URLs pass through, other paths sit under the Vite base. */
export function assetSrc(src: string): string {
  if (/^https?:\/\//.test(src)) return src;
  return `${import.meta.env.BASE_URL}${src.replace(/^\//, "")}`;
}

/** MIME type for a picture source, from the file extension. */
export function imageType(src: string): string | undefined {
  const ext = src.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
  switch (ext) {
    case "svg":
      return "image/svg+xml";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    default:
      return undefined;
  }
}
