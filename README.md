# Handoff: BookFlow — Marketplace & Appointment Booking Platform

## Overview
BookFlow is a two-sided marketplace: customers discover local service providers (barbers, salons, cleaners, car detailing, etc.), book appointments, pay, chat, and review; business owners manage services, staff, bookings, a Stripe-based POS, calendar, clients (CRM), and analytics.

This bundle contains **4 interactive HTML prototypes**, each a full click-through simulation of one platform surface:

| File | Surface | Frame |
|---|---|---|
| `BookFlow Prototype.dc.html` | Customer + Business (Admin) app, mobile | iOS device frame |
| `BookFlow - Web (Customer).dc.html` | Customer app | Browser window |
| `BookFlow Admin - Web.dc.html` | Business dashboard | Browser window |
| `BookFlow Admin - iPad.dc.html` | Business dashboard | iPad frame |

## About the Design Files
**These HTML files are design references, not production code.** They were built with a proprietary internal templating/component runtime (custom `<sc-if>`/`<sc-for>` template tags, inline styles, a `DCLogic` class for state) that only renders inside this design tool — **do not attempt to run, import, or copy this markup/JS directly into a real app.** The task is to **recreate the screens, flows, and visual language described below natively** in the target codebase (React Native/Expo per the product spec, with a future SwiftUI native client, and a backend of your choice) using that stack's own components, navigation, and state patterns.

## Fidelity
**High-fidelity.** Colors, type, spacing, and copy below are final — reproduce them pixel-close. Layout structure (flex/grid) is described precisely enough to rebuild 1:1. A few pages (Rota/Scheduling, POS hardware settings, Payment Settings, 2FA, social login) are described in the product spec but were **not yet built** in these prototypes — see "Known Gaps" at the end.

---

# Design Tokens

**Colors**
- Primary teal: `#17AEBF` — primary buttons, active nav/tab states, links
- Teal dark: `#0E8695` — icon accents on teal-soft backgrounds, secondary emphasis text
- Teal soft (bg): `#EAF7F9` — selected/active chip backgrounds, category icon circles
- Ink (text primary): `#151A1E`
- Gray (text secondary): `#6B7580`
- Border: `#E7EAEC`
- Neutral page background: `#EDEFF1`
- White: `#FFFFFF`
- Success: `#1E9E5A` / bg `#E9F8EF`
- Error/destructive: `#D64545` / bg `#FBEAEA`
- Warning/star rating: `#DE9A34` / bg `#FBF0DF`
- Stripe brand accent (payments only): `#635BFF`
- Disabled/placeholder gray: `#9AA5AC`, `#C3C9CE`, `#D5DADD`

**Typography**
- Font family: system sans-serif stack — `-apple-system, system-ui, sans-serif` (map to your platform's native system font: SF Pro on iOS, Roboto/system on Android, Inter or system-ui on web)
- Weights used: 600 (semibold), 700 (bold), 800 (extrabold) for headings/emphasis; 400/500 for body
- Scale: 11–12.5px (meta/labels, uppercase tracked captions), 13–15px (body/buttons), 16–19px (subheads), 20–28px (screen titles)
- Uppercase section labels use `letter-spacing: 0.04em`, weight 700, color gray, size 13px

**Radius**
- Small controls/inputs: 8–12px
- Cards: 14–16px
- Pills/chips/avatars: fully round (`border-radius: 50%` equivalent)
- Large containers (modals, calendar card): 20px

**Shadows**
- Subtle card lift: `0 1px 3px rgba(15,25,30,0.05–0.08)`
- Elevated card (calendar, popovers): `0 4px 24px rgba(15,25,30,0.05)`

**Logo**
- `bookflow-logo-cropped.png` — wordmark lockup, transparent background, ~2:1 aspect ratio. Always scale by height with width auto; never stretch to a fixed box.

---

# Platform 1 — Customer + Admin Mobile App (`BookFlow Prototype.dc.html`)

Single iOS-framed app with a role switch (customer ⇄ admin) for prototyping convenience — **in production these should be two separate apps or a role-gated single app**, per your call.

## Customer flow

**Sign In**
- Centered logo (130px wide), "Welcome Back" headline, email + password fields (icon-prefixed), show/hide password toggle, "Forgot Password?" link, primary Sign In button, "Sign Up" link, and a divider + "Sign in as Admin" link (prototype-only role switch — remove in production, replace with real business-login entry point).

**Sign Up**
- Back button, "Create Account" headline, Full Name / Email / Password fields, primary Create Account button, link back to Sign In.

**Forgot Password**
- Back button, headline, email field, "Send Reset Link" button → success toast → returns to Sign In.

**Home**
- Header: logo (left), user-initial avatar circle (right, opens Profile).
- Horizontal snap-scroll **promo carousel** (3 cards: welcome / discount code / referral), full-bleed gradient cards, eyebrow + title + subtitle text.
- Horizontal snap-scroll **category carousel** (Barbers/Salons/Cleaners/Car Detailing), circular icon + label, tapping opens Category screen.
- "Featured" section: horizontal snap-scroll provider cards (image placeholder, name, category, rating, price-from) + a "Map view" toggle link that swaps the "Nearby Providers" list below for a placeholder map with pinned provider markers.
- "Nearby Providers" vertical list: thumbnail, name, category, star rating, price-from; tap → Provider Detail.

**Category** — back button + category name header, vertical list of matching providers (thumbnail, name, address, rating+count, price-from).

**Provider Detail** — horizontal photo-gallery carousel with dot indicators, name/address/rating, "See reviews" link, vertical list of toggleable service rows (checkbox-style selection, price per row), sticky bottom CTA button (disabled copy "Select a service to continue" until ≥1 service picked, then "Continue · $X").

**Booking (Select Date & Time)** — premium Calendly-style scheduler:
- Provider summary card (avatar initial, name, combined service duration, "Central Time").
- Month calendar: prev/next month chevrons, month/year label, weekday header row, 7-col day grid — today has a teal outline ring, selected day is solid teal fill, past days are disabled/greyed, other-month filler cells are blank/hidden.
- "Available Times" list appears only after a date is picked (empty-state copy otherwise): vertical scrollable list of full-width time pill buttons, selected = solid teal.
- Sticky bottom "Continue to Checkout" button.

**Checkout** — order summary card (provider, date/time, line-item services, total), **Payment Method** section labeled "Payment Method · Stripe": radio rows for Credit/Debit Card, Apple Pay, Cash, each with a small card-brand icon in Stripe-purple (`#635BFF`) line art; a "Payments secured by Stripe" trust line with a lock icon above the sticky "Pay $X" button.

**Confirmation** — success checkmark badge (green), "Booking Confirmed" headline, summary card, "Add to Calendar" secondary button (toggles to "Added to Calendar ✓"), primary "Done" button → Home.

**Bookings (tab)** — segmented filter chips (All/Upcoming/Completed/Cancelled), list of booking cards (provider, service, date/time, status pill colored by state), empty state copy.

**Booking Detail** — status card, "Message Provider" button, conditional action button: Cancel (upcoming, red outline), Leave a Review (completed, teal fill), Book Again (cancelled, teal fill).

**Chat (tab)** — header with provider name, scrollable message thread (bubble left=them gray, right=me teal, timestamp under each), bottom input + round send button. Sending simulates a canned auto-reply ~1.1s later.

**Notifications (tab)** — vertical list, glyph badge + title + subtitle + relative time + unread-dot; tapping routes to the relevant screen (chat, booking detail, or write-review) and marks read.

**Reviews** — big average-rating number + star row + review count, list of individual reviews (author, date, stars, text).

**Write a Review** — 5-tap star selector, textarea, submit button (disabled/grey state until a star rating is chosen).

**Profile (tab)** — avatar + name/email card, menu list: My Bookings, Chat, Notifications, Payment Methods, Settings, Switch to Admin View (prototype-only), Sign Out (red).

**Payment Methods** — list of saved cards (brand badge abbreviation e.g. "VISA"/"MC", last 4 digits), "Make Default"/"Default" pill, "+ Add Payment Method".

**Settings** — three toggle rows (Push Notifications, Email Reminders, Promotional Offers) with label + sublabel + iOS-style switch.

**Bottom tab bar** (5 tabs, persistent on Home/Bookings/Chat/Notifications/Profile only): Home, Bookings, Chat, Alerts, Profile — icon + label, active tab colored teal.

## Business (Admin) flow — same mobile frame, reached via "Sign in as Admin"

**Admin Dashboard** — header + sign-out icon button; business summary card (name, subtitle, earnings pill) with status-filter chips (All/Upcoming/Completed/Cancelled); a 7-bar **weekly revenue chart** (bar height scaled to max, current day highlighted); filtered bookings list (customer, service · date/time, status pill); **Point of Sale** entry card; a 3-up quick-launch grid (Terminal / Cash / Pay Later) that jumps straight into POS with that method pre-selected; **Business Settings** list: Manage Services, Business Profile, Staff Management.

**Point of Sale (POS)** — 2-col grid of service buttons (tap to add to cart), Cart list (name × qty, subtotal, remove), "Payment Method · Stripe" chip row (Tap to Pay / Card Reader / Cash, active = Stripe-purple fill), Total row, "Charge $X" button, "Payments secured by Stripe" trust line.

**Manage Services** — editable rows (inline name/duration/price inputs), remove link, "+ Add Service".

**Staff Management** — editable rows (avatar initial, inline name/role inputs), remove link, "+ Invite Staff".

**Business Profile** — Business Name / Address / Hours text inputs, Save Changes button.

---

# Platform 2 — Customer Web (`BookFlow - Web (Customer).dc.html`)

Same customer product as the mobile app, reflowed for a 1440×900 desktop browser window (uses a browser-chrome frame with URL bar showing `bookflow.app`).

- **Top nav bar** (persistent once authenticated): logo (left), Browse / Bookings / Messages text links (active = teal-soft pill), notification bell (unread red dot) + avatar circle (right) → Profile.
- **Sign In / Sign Up / Forgot Password** — centered 400px-wide card, same fields/copy as mobile, no device chrome around it (just centered in the browser content area). Auth screens hide the top nav.
- **Home** — wider promo carousel (340px cards), 4-col category grid (icon+label rows, not circles — horizontal card style), horizontal "Featured" provider scroller, 2-col "Nearby Providers" grid.
- **Category** — 2-col provider grid.
- **Provider Detail** — 2-col layout: left column = photo gallery + info + service list; right column = **sticky** "Book an appointment" summary card with CTA button.
- **Booking** — full Calendly-style **3-column card**: left = provider summary (avatar, duration, timezone), center = month calendar, right = time-slot list — all inside one bordered, shadowed 980px-max card; "Continue to Checkout" full-width button below the card.
- **Checkout** — same Stripe-labeled payment section as mobile, centered 640px column.
- **Confirmation, Bookings, Booking Detail, Chat, Notifications, Reviews, Write Review** — same content/behavior as mobile, laid out in centered max-width columns (560–900px) instead of full-bleed mobile screens.
- **Profile** — same menu as mobile (My Bookings, Chat, Notifications, Payment Methods, Settings, Sign Out); Payment Methods and Settings pages mirror the mobile versions.

---

# Platform 3 — Business Dashboard Web (`BookFlow Admin - Web.dc.html`)

1440×900 browser-framed dashboard, persistent **left sidebar** (232px) + scrollable main content area.

**Sidebar nav (top to bottom):** Overview, Calendar, Bookings, Clients, Point of Sale, Manage Services, Staff, Analytics, Business Profile — icon + label rows, active = teal-soft background/teal-dark text. Bottom of sidebar: red "Sign Out" row.

**Auth gate:** Sign Out shows a centered **Business Sign In** screen (logo, "Sign in to manage {business name}", email/password, Sign In button) in place of the sidebar+content; signing in returns to the dashboard.

**Header (all pages):** page title (left), earnings-to-date pill + avatar initial (right).

**Overview** — 4-up stat cards (Today's Bookings, Revenue MTD, Avg Rating, Active Staff), 7-bar weekly revenue chart, "Recent Bookings" data table (Customer/Service/Date/Time/Price/Status columns, row hover highlight).

**Calendar** — week view: prev/next-week nav + date-range label, a grid (hour rows × 7 day columns) with booking blocks rendered as small teal-soft chips positioned in their hour/day cell.

**Bookings** — status filter chips, same data-table layout as Overview's recent list, empty state.

**Clients (CRM)** — data table: avatar+name, Visits, Lifetime Spend, Last Visit, Marketing (Opted In/Out, green/gray).

**Point of Sale** — 3-col service-button grid + cart panel (same content as mobile POS, wider layout), Stripe-labeled payment method row, trust line.

**Manage Services / Staff / Business Profile** — same inline-editable list/table patterns as mobile, styled for desktop table density.

**Analytics** — 4-up stat cards (Repeat Bookings, Cancellation Rate, Occupancy Rate, Customer Retention), horizontal bar list "Popular Services" (label + proportional bar + count), 3-up "Staff Performance" cards (name, bookings this month, revenue).

---

# Platform 4 — Business Dashboard iPad (`BookFlow Admin - iPad.dc.html`)

Same information architecture and pages as the Web dashboard, laid out inside a **1180×820 iPad-bezel frame** (dark bezel, home-indicator notch dot) rather than browser chrome — 220px sidebar, denser paddings, larger touch targets (44px min height on nav rows/tabs/buttons) for a tablet/touch context. Content grids reflow to 2-column instead of the web's wider multi-column layouts (e.g., Recent Bookings and Bookings-page cards are 2-up instead of a data table).

---

# Interactions & Behavior (all platforms)

- **Navigation model:** a simple screen-stack (`push`/`back`) per app instance — no deep-linking implemented in the prototype; use your framework's native navigator (React Navigation stack / SwiftUI NavigationStack / Next.js routes) and preserve the same push/pop feel including hardware/browser back behavior.
- **Toasts:** transient bottom-centered dark pill, auto-dismiss ~2s, used for validation errors ("Enter email and password", "Select a service first", "Pick a date and time", "Cart is empty") and success confirmations ("Payment received", "Review submitted", "Reset link sent to…").
- **Calendar:** past dates are disabled (not clickable, dimmed); selecting a new date clears any previously selected time; month navigation cannot go before the current month.
- **Service selection:** multi-select toggle rows; selecting/deselecting updates a running total shown on the CTA button copy in real time.
- **POS cart:** tapping a service increments its quantity if already in cart; remove is a full line removal, not decrement.
- **Chat:** sending a message appends it instantly (right-aligned, teal); a canned reply appears after ~1.1s (left-aligned, gray) to simulate the other party.
- **Notifications → deep actions:** tapping a notification navigates to and marks-read in one action (chat thread, booking detail, or pre-filled write-a-review).
- **Settings toggles:** standard iOS-style switch, instant state flip on tap (no confirmation step).
- **Payments:** this is a **visual treatment only** — no real Stripe Elements/SDK is wired up. Wire the real Stripe integration (Payment Element / Payment Sheet for mobile, Stripe.js for web) behind these same visual affordances; keep the "Payments secured by Stripe" trust line and the Stripe-purple (`#635BFF`) accent only on payment-specific controls (method chips, card icons) — never as a general brand color.

---

# State Management

Minimum state needed per surface (see each prototype's embedded logic class for the exact shape used — field names below match 1:1 so a developer can cross-reference):

- **Auth:** email/password/signup fields, forgot-password email, a simple `isAuthed` boolean/screen gate.
- **Navigation:** a screen stack (array) or equivalent router state.
- **Customer booking:** selected category, selected provider id, selected service ids (array), selected booking date (ISO) + time, payment method, last-completed booking (for the confirmation screen), calendar's currently-viewed month/year.
- **Bookings list:** array of booking records `{id, providerId, serviceName, dateTimeLabel, price, status: upcoming|completed|cancelled}`, active status-tab filter.
- **Chat:** messages keyed by conversation/provider id, each `{from: 'me'|'them', text, time}`, current input value.
- **Reviews:** reviews keyed by provider id `{author, rating, text, date}`, in-progress draft rating/text.
- **Notifications:** array with `read` boolean and a `target` (which screen/entity tapping it should open).
- **Profile:** payment methods (cards with brand/last4/isDefault), notification-preference toggles.
- **Admin:** current dashboard page, bookings-tab filter, earnings total, weekly revenue series (7 numbers), services array (name/duration/price), staff array (name/role), POS cart (serviceId→qty) + selected POS method, business profile fields, clients array (visits/spend/lastVisit/marketing), calendar week offset, sign-in gate state (web dashboard).

---

# Assets
- `bookflow-logo-cropped.png` — the only custom asset; a cropped, transparent-background version of the provided BookFlow wordmark (500×500 original had excess whitespace — this version is tightly cropped to the mark, ~448×224px, 2:1 ratio). Re-export from your real brand source file if a vector/master version exists.
- All photo/imagery placeholders (provider photos, storefront images, gallery shots) are **diagonal-striped placeholder blocks**, not real assets — replace with real photography/uploads.

# Known Gaps (in product spec, not yet in these prototypes)
- Social sign-in (Apple/Google), 2FA, biometric unlock, session/JWT/refresh-token handling
- Business registration flow (only sign-in is mocked)
- Staff-level rota/shift scheduling (drag-and-drop), staff working-hours/commission/leave requests
- POS hardware settings (receipt printer, barcode scanner, cash drawer), split payments, tips, gift cards, loyalty
- Payment Settings page (bank account, deposits, refund policy, taxes, invoice/payout config)
- Real Stripe SDK integration (current payment UI is visual-only, see Interactions above)
- Dark mode, multi-language, offline support
- Native SwiftUI client (mobile prototype here represents the target React Native/Expo customer+admin experience)

# Files in this bundle
- `BookFlow Prototype.dc.html` — Customer + Admin, mobile (iOS frame)
- `BookFlow - Web (Customer).dc.html` — Customer, web
- `BookFlow Admin - Web.dc.html` — Business dashboard, web
- `BookFlow Admin - iPad.dc.html` — Business dashboard, iPad
- `bookflow-logo-cropped.png` — logo asset
