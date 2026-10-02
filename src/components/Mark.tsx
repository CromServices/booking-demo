export function Mark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <clipPath id="sb-mark-tile">
          <rect width="64" height="64" rx="14" />
        </clipPath>
      </defs>
      <rect width="64" height="64" rx="14" fill="#1b3f34" />
      <g clipPath="url(#sb-mark-tile)">
        <path fill="#f4efe6" d="M14.5 66 C13.6 52 14.6 39 18.6 31 C22.6 23 29.6 18.4 36.8 18.8 C40.8 19.1 43.4 21.2 45 24.3 L53.4 26.8 C56.6 27.7 57.7 30.7 56.1 32.9 C54.7 34.9 51.6 35.5 48.6 35.6 C45.6 35.8 43.2 37.4 41.8 40 C40.2 43.6 40.2 52 41.2 66 Z" />
        <path fill="#c4a882" d="M28.6 21.4 C22.8 21.9 19.8 28.8 21 36.2 C21.7 40.6 26.5 41.3 28.2 37.6 C30.3 32.8 31.9 26.5 28.6 21.4 Z" />
        <circle cx="39.4" cy="26.6" r="2" fill="#1c2824" />
        <path fill="#1c2824" d="M53.4 26.9 C55.9 27.1 57.7 28.8 57.3 31 C57 32.4 55.4 32.8 54 32 C52.5 31.1 51.8 28.8 53.4 26.9 Z" />
        <path fill="#c4613a" d="M14.2 45.6 C22.6 47.4 32 47.4 40.6 45.6 L40.8 51 C32 52.8 22.6 52.8 14.3 51 Z" />
        <path fill="#8fbfa4" d="M31 51.6 C27.4 54.2 27.2 59 31 61.4 C34.8 59 34.6 54.2 31 51.6 Z" />
        <path d="M31 54.2 L31 59.4" stroke="#6e9a78" strokeWidth="1" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function StudioScene() {
  return (
    <svg className="scene" viewBox="0 0 360 420" role="img" aria-label="Drawn dog beside a saltbush">
      <rect width="360" height="420" rx="28" fill="#1b3f34" />
      <circle cx="286" cy="78" r="36" fill="#e7c27a" />
      <path d="M40 250c30-70 50-90 70-70" stroke="#8fbfa4" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="48" cy="188" rx="22" ry="10" transform="rotate(-40 48 188)" fill="#8fbfa4" />
      <ellipse cx="78" cy="168" rx="22" ry="10" transform="rotate(-15 78 168)" fill="#6e9a78" />
      <ellipse cx="92" cy="206" rx="18" ry="8" transform="rotate(20 92 206)" fill="#b7d0b4" />
      <ellipse cx="180" cy="318" rx="120" ry="28" fill="#c4a882" />
      <g transform="translate(148 108) scale(2.85)">
        <path fill="#f4efe6" d="M14.5 66 C13.6 52 14.6 39 18.6 31 C22.6 23 29.6 18.4 36.8 18.8 C40.8 19.1 43.4 21.2 45 24.3 L53.4 26.8 C56.6 27.7 57.7 30.7 56.1 32.9 C54.7 34.9 51.6 35.5 48.6 35.6 C45.6 35.8 43.2 37.4 41.8 40 C40.2 43.6 40.2 52 41.2 66 Z" />
        <path fill="#c4a882" d="M28.6 21.4 C22.8 21.9 19.8 28.8 21 36.2 C21.7 40.6 26.5 41.3 28.2 37.6 C30.3 32.8 31.9 26.5 28.6 21.4 Z" />
        <circle cx="39.4" cy="26.6" r="2" fill="#1c2824" />
        <path fill="#1c2824" d="M53.4 26.9 C55.9 27.1 57.7 28.8 57.3 31 C57 32.4 55.4 32.8 54 32 C52.5 31.1 51.8 28.8 53.4 26.9 Z" />
        <path fill="#c4613a" d="M14.2 45.6 C22.6 47.4 32 47.4 40.6 45.6 L40.8 51 C32 52.8 22.6 52.8 14.3 51 Z" />
        <path fill="#8fbfa4" d="M31 51.6 C27.4 54.2 27.2 59 31 61.4 C34.8 59 34.6 54.2 31 51.6 Z" />
        <path d="M31 54.2 L31 59.4" stroke="#6e9a78" strokeWidth="1" strokeLinecap="round" />
      </g>
    </svg>
  );
}
