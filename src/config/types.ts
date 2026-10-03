import type { BookingStatus, Service } from "../store/types";

/** A question the booking form asks in addition to name, mobile, email, and notes. */
export type ExtraField = {
  id: string;
  label: string;
  kind: "text" | "select";
  required: boolean;
  hint?: string;
  autoComplete?: string;
  /** First option label for a select, stored as an empty value. */
  emptyLabel?: string;
  options?: readonly string[];
  /** Tested against the trimmed value. */
  pattern?: string;
  patternFlags?: string;
  wide?: boolean;
  messages: {
    required: string;
    invalid: string;
  };
};

export type ThemeTokens = Record<`--${string}`, string>;

export type HeaderArt = {
  src: string;
  /** Optional art for the firm dark scheme. Unused when theme.dark is false. */
  dark?: string;
  /** Intrinsic size, used only to reserve the aspect ratio. CSS sets the height. */
  width: number;
  height: number;
  alt: string;
};

/** Illustration in the home hero panel. */
export type HeroArt = {
  src: string;
  /** Raster used when the browser cannot show src (for example an SVG). */
  fallback?: string;
  width: number;
  height: number;
  alt: string;
};

/** One icon link in the document head. */
export type IconLink = {
  rel: "icon" | "apple-touch-icon";
  /** A file in public/ or an absolute URL. */
  href: string;
  type?: string;
  sizes?: string;
};

/** Browser tab and home-screen icons. Omit to use the Crom demo icon (demos and previews only). */
export type SiteIcons = readonly IconLink[];

/** A local() fallback face, metric-matched so the web font swap barely moves text. */
export type FallbackFontFace = {
  family: string;
  /** Font names for local(), tried in order. */
  local: readonly string[];
  weight?: string;
  sizeAdjust?: string;
  ascentOverride?: string;
  descentOverride?: string;
  lineGapOverride?: string;
};

/** Light and dark lockups. The dark file is used only when the firm dark scheme is on. */
export type HeaderLogo = {
  light: string;
  dark: string;
  alt: string;
  width: number;
  height: number;
};

export type DayWindow = { openMin: number; closeMin: number } | null;

export type HoursLine = { label: string; value: string };

export type SampleBooking = {
  id: string;
  customerName: string;
  extras: Record<string, string>;
  mobile: string;
  email: string;
  serviceId: string;
  notes: string;
  status: BookingStatus;
  confirmationCode: string;
  emailVerified?: boolean;
  minuteOfDay: number;
  /** Index among days that have an open slot at minuteOfDay. */
  dayIndex: number;
};

export type SiteConfig = {
  id: string;
  businessName: string;
  storage: { key: string; version: number };
  /**
   * light or dark pins the footer credit.
   * system follows the firm dark scheme.
   */
  credit: "light" | "dark" | "system";
  theme?: {
    /** Light-scheme overrides. Missing keys keep the firm defaults. */
    light?: ThemeTokens;
    /**
     * Extra dark-scheme overrides, or false to keep the light look
     * when the visitor's system is dark.
     * Omit to use the firm dark colours unchanged.
     */
    dark?: ThemeTokens | false;
  };
  /** Replaces the default firm logo. */
  headerArt?: HeaderArt;
  /** Replaces the default firm light/dark logo pair. Ignored when headerArt is set. */
  logo?: HeaderLogo;
  /** Optional illustrated hero. Omit for a plain panel. */
  heroArt?: HeroArt;
  /**
   * Head icon links. Defaults to the hosted Crom icon, which is for demos and
   * previews only. A real client site ships its own icon before go-live.
   */
  icons?: SiteIcons;
  fontHref: string;
  /** Extra @font-face rules, for example a metric-matched fallback for --font-display. */
  fallbackFonts?: readonly FallbackFontFace[];
  themeColor: string;
  metaDescription: string;
  titles: {
    home: string;
    book: string;
    admin: string;
    notFound: string;
  };
  banner: string;
  nav: { home: string; book: string; admin: string };
  footerEmail: string;
  footerNote: string;
  schedule: {
    /** Index 0 is Sunday. */
    days: readonly [DayWindow, DayWindow, DayWindow, DayWindow, DayWindow, DayWindow, DayWindow];
    horizonDays: number;
    slotStepMinutes: number;
    lines: readonly HoursLine[];
  };
  services: readonly Service[];
  sampleBookings: readonly SampleBooking[];
  extraFields: readonly ExtraField[];
  extras: {
    heading: string;
    empty: string;
    separator: string;
  };
  fields: {
    name: { label: string };
    mobile: { label: string; hint: string };
    email: { label: string };
    notes: { label: string };
  };
  home: {
    eyebrow: string;
    headline: string;
    lede: string;
    primaryCta: string;
    primaryHref: string;
    secondaryCta: string;
    secondaryHref: string;
    heroNote: string;
    servicesHeading: string;
    servicesNote: string;
    seeTimes: string;
    hoursHeading: string;
    hoursNote: string;
    howHeading: string;
    steps: readonly string[];
    visitHeading: string;
    visitBody: string;
  };
  book: {
    eyebrow: string;
    title: string;
    intro: string;
    emailHeading: string;
    emailIntro: string;
    emailKicker: string;
    emailFrom: string;
    emailSubject: string;
    emailHello: string;
    emailBody: string;
    codeLabel: string;
    confirmLabel: string;
    confirmHint: string;
    confirmButton: string;
    confirmBusy: string;
    successEyebrow: string;
    successHeading: string;
    successBody: string;
    deskCta: string;
    anotherCta: string;
    serviceLegend: string;
    timesHeading: string;
    timesNote: string;
    chooseService: string;
    closedDay: string;
    noTimes: string;
    detailsHeading: string;
    detailsNote: string;
    formHint: string;
    submit: string;
    submitBusy: string;
    afterNote: string;
    formLabel: string;
    confirmFormLabel: string;
    emailArticleLabel: string;
    openLabel: string;
    takenLabel: string;
  };
  admin: {
    eyebrow: string;
    title: string;
    intro: string;
  };
  notFound: {
    title: string;
    body: string;
    cta: string;
  };
  loading: string;
  emptyServices: string;
};
