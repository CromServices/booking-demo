<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/saltbush-v2-readme-dark.svg">
  <img alt="Saltbush Dog Grooming" src="public/saltbush-v2-readme-light.svg" width="316">
</picture>

# Booking demo

This repo proves a booking site can be retargeted by editing one typed config. Business name, copy, theme, services, hours, extra questions, and the browser storage key all live in that file. **Saltbush Dog Grooming**, an invented Australian salon, is the sample. It is a Crom Services portfolio piece, not a real business. Prices, customers, and appointments are sample data. Confirmation emails are simulated on screen and are never sent.

The default skin is the Crom Services light theme, with a dark firm theme when the visitor's system asks for it. Saltbush turns that dark theme off and keeps its own light look.

Live demo:

https://cromservices.github.io/booking-demo/

Built with React, TypeScript, and Vite. It is not a Next.js app.

## Run it

```bash
npm install
npm test
npm run dev
```

The dev server uses the GitHub Pages base path, so open `http://localhost:5173/booking-demo/`.

## Reuse for a new job

Copy `src/config/saltbush.ts`, or start from `src/config/examples/harbour-press.ts` if you want the firm skin. Edit the business, services, hours, and extra fields. Brand art and type are config too: `headerArt`, `heroArt`, `icons`, `fontHref`, `fallbackFonts`, and the theme tokens (`--font-display`, heading weights, `--lockup-height`). Put the files in `public/`. Point the export in `src/site.config.ts` at your file, then push to `main`. The page head (title, description, theme colour, font link, icons) follows the same export.

Icons: a config without `icons` gets the hosted Crom Services icon. That icon is for demos and preview builds only. A real client site must ship its own icon before go-live. If the client has no logo, Brand can make an initial-letter icon.

The firm tokens come from crom-shared v1 (https://cromservices.github.io/crom-shared/theme.css) and should be re-synced from there.

Harbour Press is a second fictional sample. It is not the deployed site. It leaves the theme unset, so the firm light and dark skins, and the firm logo, apply.

`npm run build` writes the production bundle. `npm run preview` serves it.

Hash routes keep deep links working on GitHub Pages:

- `#/` home
- `#/book` calendar and booking form
- `#/admin` demo desk (no login)

## Swappable store

Pages never read `localStorage` themselves. They call a `BookingStore` (`src/store/types.ts`):

- `listServices`, `listBookings`
- `createBooking`, `confirmBooking`, `updateBooking`, `deleteBooking`
- `saveService`, `removeService`
- `resetDemoData`
- `subscribe` so the UI refreshes after a change

`App` passes `createLocalStorageBookingStore()` into `BookingStoreProvider`. That adapter keeps one JSON snapshot in this browser. The key and snapshot version come from the active config. Saltbush uses `saltbush-booking-demo-v1` at version 1. A saved snapshot from another version is replaced with the sample seed. Tests use `MemoryBookingStore` instead. A Supabase adapter can implement the same interface and replace the provider value without changing the pages. This demo does not add Supabase, a backend, or analytics.

`Reset demo data` on the demo desk restores the sample services and bookings for the current studio date.

## Deploy

`.github/workflows/pages.yml` runs tests and a production build on pull requests. A push to `main` uploads the `dist` folder and deploys it with GitHub Pages (`actions/deploy-pages`). The Vite `base` is `/booking-demo/`.
