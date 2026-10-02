![Saltbush Dog Grooming](public/saltbush-lockup-light.svg)

# Booking demo

A public demo booking site and admin desk for **Saltbush Dog Grooming**, an invented Australian salon. It is a Crom Services portfolio piece. It is not a real business. Prices, customers, and appointments are sample data. Confirmation emails are simulated on screen and are never sent.

Live demo (after this repo is on `main` and GitHub Pages has deployed):

https://cromservices.github.io/booking-demo/

Built with React, TypeScript, and Vite. It is not a Next.js app.

## Run, test, and build

```bash
npm install
npm test
npm run dev
npm run build
npm run preview
```

The dev server uses the GitHub Pages base path, so open `http://localhost:5173/booking-demo/`.

Hash routes keep deep links working on GitHub Pages:

- `#/` home
- `#/book` calendar and booking form
- `#/admin` demo desk (no login)

## Swappable store

Pages never read `localStorage` themselves. They call a `BookingStore` (`src/store/types.ts`):

- `listServices`, `listBookings`
- `createBooking`, `confirmBooking`, `updateBooking`
- `saveService`, `removeService`
- `resetDemoData`
- `subscribe` so the UI refreshes after a change

`App` passes `createLocalStorageBookingStore()` into `BookingStoreProvider`. That adapter keeps one JSON snapshot in this browser under `saltbush-booking-demo-v1`. Tests use `MemoryBookingStore` instead. A Supabase adapter can implement the same interface and replace the provider value without changing the pages. This demo does not add Supabase, a backend, or analytics.

`Reset demo data` on the demo desk restores the sample services and bookings for the current studio date.

## Deploy

`.github/workflows/pages.yml` runs tests and a production build on pull requests. A push to `main` uploads the `dist` folder and deploys it with GitHub Pages (`actions/deploy-pages`). The Vite `base` is `/booking-demo/`.
