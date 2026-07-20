# Running BookFlow

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. In **Settings → API**, copy the Project URL, `anon` public key, and `service_role` key into `.env.local` (copy `.env.example` first).
3. Push the schema: `npx supabase link --project-ref <your-ref>` then `npx supabase db push` — or paste the contents of `supabase/migrations/0001_init.sql`, then `0002_notifications.sql`, then `0003_harden_rls.sql` (in that order) into the SQL Editor and run them.
4. In **Authentication → Providers → Email**, turn off "Confirm email" while testing locally so sign-up logs you straight in (re-enable it before going live).
5. Regenerate types against the real project (optional but recommended once it's live):
   `npx supabase gen types typescript --project-id <your-ref> > src/lib/supabase/types.ts`

## 2. Stripe

1. Grab your **test mode** keys from the Stripe Dashboard → Developers → API keys: publishable + secret key into `.env.local`.
2. Forward webhooks to your local server: `stripe listen --forward-to localhost:3000/api/stripe/webhook` — it prints a `whsec_...` signing secret, put that in `STRIPE_WEBHOOK_SECRET`.
3. Test cards: `4242 4242 4242 4242`, any future expiry, any CVC.

Booking and POS card sales only get written to the database once Stripe confirms the charge via webhook — the create-intent API route never writes to the DB directly. Cash sales in the POS still record instantly (no card to confirm).

## 3. Seed demo data (optional but recommended)

Once your `.env.local` has real Supabase keys:

```
npm run seed
```

Creates two logins (password `demo123456` for both): `owner@fademastersdemo.com` (Fade Masters Barbershop, with services/staff/a review) and `customer@fademastersdemo.com` (with booking history). Safe to re-run — it skips anything that already exists.

## 4. Run it

```
npm install
npm run dev
```

- Sign up as a business owner → you'll land on `/onboarding` to create your business, then `/dashboard`.
- Sign up (in another browser/incognito window) as a customer → `/app/home` to browse and book.
- A booking made on the customer side shows up in the business owner's dashboard immediately (same Postgres row, RLS-scoped).

## What's real vs. what's a known gap

**Real and working:** auth, RLS-scoped multi-tenant data (tested against real cross-tenant attack scenarios — 28 assertions in the RLS test suite, see below), business onboarding, services/staff/business-profile CRUD, customer browse + booking + Stripe checkout, admin Overview/Bookings/Calendar/Clients/Analytics against live data, POS with Stripe PaymentIntents (tap/reader) and instant cash sales, reviews (write from a completed booking, average rating + list on the business page), notifications (DB-trigger-driven — fires on booking created/cancelled and on a business chat reply, so they can never be spoofed client-side), two-way chat (customer thread at `/app/chat/[businessId]`, business inbox + reply at `/dashboard/messages`).

**Not yet built** (noted here rather than silently skipped): staff assigned to specific bookings/shifts, multi-location businesses, real Stripe Terminal hardware pairing (tap/reader currently collect a card via Stripe's Payment Element rather than a physical reader). A native iOS app exists separately (SwiftUI, both customer and business-owner sides, talking to this same Supabase project + calling `/api/stripe/create-intent` with a bearer token) — see the `BookFlow.swiftpm` package delivered alongside this repo, not checked into it.

**Known gap, by design:** if two customers pay for the exact same business/date/time slot at nearly the same moment, a database constraint (added in `0003_harden_rls.sql`) guarantees only one booking gets written — but the *other* customer's Stripe charge has already succeeded. The webhook detects this, logs it loudly (`console.error`, grep your server logs for "needs a manual refund"), and still returns 200 to Stripe. There's no automatic refund yet; a production version would want one.

## RLS test suite

`supabase/tests/` isn't set up as a formal pgTAP suite yet, but the schema has been verified against a plain local Postgres standing in for Supabase (stub `auth.users` + `auth.uid()`, a non-superuser role so RLS actually applies) covering: cross-customer booking isolation, cross-business data isolation (services/staff/POS/bookings), public read access to businesses/services/reviews, participant-only chat, unspoofable notifications, and the booking/chat notification triggers. `0003_harden_rls.sql`'s policies/triggers were verified the same way, both for the attack each one closes (direct-API payment-status forgery, fake reviews, forged chat messages, role self-escalation, duplicate businesses, double-booked slots) and for the legitimate paths (business-owner updates, the service-role webhook, a second owner creating their own business) that must keep working. Re-run similar checks after any RLS policy change before trusting it in production.
