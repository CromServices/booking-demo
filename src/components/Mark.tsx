export function Mark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#1b3f34" />
      <ellipse cx="30" cy="40" rx="14" ry="10" fill="#f4efe6" />
      <circle cx="42" cy="31" r="8" fill="#f4efe6" />
      <ellipse cx="48" cy="25" rx="4" ry="7" fill="#e7d3bf" />
      <circle cx="44" cy="30" r="1.2" fill="#1b3f34" />
      <path d="M18 42c2-10 6-14 10-12" stroke="#8fbfa4" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="16" cy="32" rx="4" ry="2.2" transform="rotate(-30 16 32)" fill="#8fbfa4" />
      <ellipse cx="20" cy="27" rx="4" ry="2.2" transform="rotate(-10 20 27)" fill="#6e9a78" />
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
      <ellipse cx="168" cy="268" rx="78" ry="46" fill="#f4efe6" />
      <circle cx="230" cy="220" r="40" fill="#f4efe6" />
      <ellipse cx="258" cy="188" rx="16" ry="30" transform="rotate(18 258 188)" fill="#e7d3bf" />
      <ellipse cx="214" cy="196" rx="12" ry="22" transform="rotate(-20 214 196)" fill="#e7d3bf" />
      <circle cx="244" cy="216" r="4" fill="#1b3f34" />
      <ellipse cx="252" cy="232" rx="8" ry="5" fill="#1b3f34" />
      <path d="M112 250c-28-10-36 20-20 32" stroke="#f4efe6" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M150 250c40 8 70 8 96-6" stroke="#c4613a" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="196" cy="286" r="7" fill="#1b3f34" />
      <circle cx="228" cy="292" r="7" fill="#1b3f34" />
    </svg>
  );
}
