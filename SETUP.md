# Running BookFlow

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. In **Settings → API**, copy the Project URL, `anon` public key, and `service_role` key into `.env.local` (copy `.env.example` first).
3. Push the schema: `npx supabase link --project-ref <your-ref>` then `npx supabase db push` — or paste the contents of `supabase/migrations/0001_init.sql` into the SQL Editor and run it.
4. In **Authentication → Providers → Email**, turn off "Confirm email" while testing locally so sign-up logs you straight in (re-enable it before going live).
5. Regenerate types against the real project (optional but recommended once it's live):
   `npx supabase gen types typescript --project-id <your-ref> > src/lib/supabase/types.ts`

## 2. Stripe

1. Grab your **test mode** keys from the Stripe Dashboard → Developers → API keys: publishable + secret key into `.env.local`.
2. Forward webhooks to your local server: `stripe listen --forward-to localhost:3000/api/stripe/webhook` — it prints a `whsec_...` signing secret, put that in `STRIPE_WEBHOOK_SECRET`.
3. Test cards: `4242 4242 4242 4242`, any future expiry, any CVC.

Booking and POS card sales only get written to the database once Stripe confirms the charge via webhook — the create-intent API route never writes to the DB directly. Cash sales in the POS still record instantly (no card to confirm).

## 3. Run it

```
npm install
npm run dev
```

- Sign up as a business owner → you'll land on `/onboarding` to create your business, then `/dashboard`.
- Sign up (in another browser/incognito window) as a customer → `/app/home` to browse and book.
- A booking made on the customer side shows up in the business owner's dashboard immediately (same Postgres row, RLS-scoped).

## What's real vs. what's a known gap

**Real and working:** auth, RLS-scoped multi-tenant data, business onboarding, services/staff/business-profile CRUD, customer browse + booking + Stripe checkout, admin Overview/Bookings/Calendar/Clients/Analytics against live data, POS with Stripe PaymentIntents (tap/reader) and instant cash sales.

**Not yet built** (noted here rather than silently skipped): chat between customer and business, notifications feed, reviews UI (schema exists, no screens yet), staff assigned to specific bookings/shifts, multi-location businesses, real Stripe Terminal hardware pairing (tap/reader currently collect a card via Stripe's Payment Element rather than a physical reader), native mobile app (this is the web app; the Supabase backend is ready for a future Expo client to reuse directly).
