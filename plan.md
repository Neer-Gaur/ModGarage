# Mod Syndicate — plan.md

## 1) Objectives
- Deliver an Awwwards-grade dark-mode customer web app for Mod Syndicate with neon **crimson + electric blue** accents, premium motion (Lenis + Framer Motion), and responsive UI.
- Implement a working **full-stack MVP**: FastAPI + MongoDB (motor) + React/Tailwind/shadcn with **JWT email/password** auth.
- Cover core user flows end-to-end: browse marketplace/community publicly, gated “Add to Garage”, onboarding, garage → booking flow with **mock payment**, dashboard overview.

## 2) Implementation Steps

### Phase 1 — Core Flow POC (SKIP)
- Not required (standard CRUD + JWT; payment is mocked; no external integrations).

### Phase 2 — V1 App Development (MVP, polished UI)
**Backend (FastAPI + MongoDB)**
- Project setup: FastAPI app, motor client, env config, CORS, structured logging.
- Auth: register/login, password hashing (passlib/bcrypt), JWT access token, `/me`.
- Data models + CRUD:
  - Users/Profile: onboarding fields (name, phone, car model, car photo URL, specs).
  - Products: seed catalog (wheels/wraps/performance) + filters/search.
  - Garage items: add/remove/list per user.
  - Bookings: create/list/detail; states (`pending`,`confirmed`,`completed`,`cancelled`); mock payment status.
  - Community posts: create/list (public read).
  - Events: list (seed), optional create (admin/dev only).
  - Reviews: list + create.
  - Contact: submit form → store in DB.
- API shape: REST JSON, pagination where needed, consistent error responses.

**Frontend (React + Tailwind + shadcn/ui)**
- App shell: React Router routes, persistent nav (Marketplace/Community always visible), auth-aware CTA.
- Design system:
  - Dark carbon-fiber texture layers, matte blacks/charcoal, metallic silver text.
  - Neon accents: red primary glow, blue secondary edge highlights.
  - Typography: heading font (Clash Display-like), body sans.
  - Components: buttons (glow/metal sheen), cards, modal, drawer, tabs, badges, skeletons, toasts.
- Motion:
  - Lenis smooth scroll (homepage), parallax hero + section dividers.
  - Route/page transitions (“gear shift”), hover glows on cards/buttons.
  - “My Garage” layered reveal.
- Pages:
  - **Home (public):** hero video placeholder, Services/Process/Featured Reviews, “Enter Your Garage” CTA, footer contact form.
  - **Marketplace (public):** filter/search/sort grid; product card hover reveals “Add to Garage” (gated).
  - **Product Detail (public):** gallery, specs, add-to-garage CTA; “Buy/Install” prompts login if needed.
  - **Community (public):** feed masonry, events list/calendar-lite, reviews section.
  - **Auth (modal + page fallback):** login/signup; redirect back after success.
  - **Onboarding (post-signup):** profile + car details form.
  - **Dashboard (authed):** car summary, active booking status, booking history.
  - **My Garage (authed):** list items, remove, “Buy Now” / “Install With Us”.
  - **Booking Flow (authed):** drawer/modal: calendar → review quote → mock payment → receipt.
- State management:
  - API client (fetch/axios), token in localStorage, guarded routes for dashboard/garage.
  - Gated action handler for “Add to Garage” (open auth modal, resume action after login).

**V1 End-to-End testing (1 round)**
- Run app locally, seed DB, validate key flows, fix blockers before moving on.

**Phase 2 User Stories (at least 5)**
1. As a visitor, I can scroll the homepage with smooth parallax hero video and understand services/process quickly.
2. As a visitor, I can browse Marketplace and view product details without creating an account.
3. As a visitor, when I click “Add to Garage”, I’m prompted to log in/sign up and returned to my action afterward.
4. As a new user, I can sign up, complete onboarding with car details, and land on a dashboard summary.
5. As a logged-in user, I can add items to My Garage and start a booking with a calendar + mock payment + receipt.

### Phase 3 — Expand Features + Production Hardening
- Marketplace upgrades: advanced filters (brand, vehicle fitment tags), better pagination, saved searches.
- Community upgrades: post detail page, likes/comments (optional), richer events UI.
- Booking upgrades: editable booking, cancellation, clearer quotation breakdown; status timeline.
- Media: curated stock imagery/video defaults + lazy loading; optional user car photo upload later.
- Quality:
  - Input validation (Pydantic), rate limiting basics, improved error UX.
  - API tests (pytest minimal) and frontend smoke tests.
  - Accessibility pass (focus traps for modals, contrast, keyboard nav).

**Phase 3 Testing (1 round)**
- Regression test all core flows + new features; fix UI breakpoints and edge states.

**Phase 3 User Stories (at least 5)**
1. As a user, I can filter products by category/brand/fitment so I find compatible mods faster.
2. As a user, I can view booking status as a timeline so I always know what’s happening.
3. As a user, I can cancel or reschedule a booking so plans stay flexible.
4. As a user, I can publish a community build post and see it appear immediately in the feed.
5. As a visitor, I can browse events and reviews with fast loading and polished transitions.

### Phase 4 — Auth & Security Enhancements (still JWT-based)
- Refresh tokens (optional), token expiry handling, logout everywhere.
- Role hooks for admin seeding/management (minimal).
- Audit fields + safer CORS/env handling.

**Phase 4 Testing (1 round)**
- Validate session persistence, expiry behavior, and gated flows.

**Phase 4 User Stories (at least 5)**
1. As a user, I stay signed in across refreshes until my token expires.
2. As a user, I’m gracefully prompted to re-auth when my session expires.
3. As a user, I can log out and know my private pages are no longer accessible.
4. As an admin/dev, I can reseed products/events safely without breaking user data.
5. As a user, my profile updates are validated so bad data doesn’t corrupt my dashboard.

## 3) Phase 2 Status — COMPLETE ✅
- Backend: 8 routers (auth, products, garage, bookings, community, events, reviews, contact). 20/20 tests passing.
- Frontend: 8 pages with full motion (Lenis smooth scroll, parallax hero, gear-shift route transitions, layered Garage reveals, hover glows). 100% of critical user flows passing.
- Auth: JWT email/password with 14-day expiry, AuthModal with pending-action replay for gated "Add to Garage".
- Payment: Mocked card UI in booking drawer (payment_status="paid_mock").

## 4) Next Actions (Phase 3 candidates)
- Booking timeline + cancel/reschedule
- Like + comment threads on community posts
- Saved searches and advanced fitment filters
- User avatar upload + dedicated profile/settings page

## 4) Success Criteria
- Public users can browse Home/Marketplace/Community with premium motion and fast responsive UI.
- “Add to Garage” is correctly gated; auth modal works; post-login action resumes.
- Onboarding persists to MongoDB and drives Dashboard content.
- Garage → Booking (calendar → review → mock payment → receipt) works end-to-end and persists bookings.
- No major console errors, broken routes, or blocking UI issues across mobile/tablet/desktop.