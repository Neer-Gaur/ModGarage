# ModGarage — Product Requirements Document

## Original Problem Statement
Build ModGarage, a car modification platform with immersive scrollytelling homepage and service booking. Core requirements: GSAP ScrollTrigger scrollytelling homepage (40 frame images), user authentication, multi-step car profile onboarding, marketplace with "Add to Garage" functionality, virtual garage (cart), "Coming Soon" 3D configurator placeholder, full checkout flow for bookings (no payment processing yet), Instagram-style community feed.

**Tech Stack**: React + FastAPI + MongoDB (adapted from Next.js/Supabase)

## User Personas
- **Car Enthusiast**: Browses marketplace, adds parts to garage, books installation
- **Community Member**: Shares build posts, likes/comments on others' builds
- **Admin**: Manages products, bookings, users

## Core Requirements
1. Landing page with GSAP scrollytelling hero (40 Mahindra Thar frames + bouncing words)
2. Google Social Auth (Emergent-managed)
3. Car onboarding (make/model/year/variant)
4. Marketplace with categories, search, sort
5. Product detail pages with specs, gallery, installation option
6. Virtual Garage (cart) with build summary
7. Booking flow (3-step: vehicle profile, schedule, component audit)
8. Community feed with posts, likes, comments
9. 3D Configurator (Coming Soon placeholder)
10. Admin dashboard

## Design System
- **Theme**: Dark black/orange "Awwwards-quality" aesthetic
- **Primary**: #fa5d00 (vibrant orange)
- **Accent**: #ffb599 (light orange), #00daf3 (cyan)
- **Surface**: #131313 (dark bg)
- **Fonts**: Space Grotesk (headlines), Inter (body)
- **Border Radius**: 0px (sharp edges)

## What's Been Implemented (as of April 10, 2026)
- [x] Landing page with GSAP scrollytelling hero + 6 content sections + footer
- [x] Navbar with glass-morphism, orange theme, mobile responsive
- [x] Google Social Auth via Emergent
- [x] Car onboarding flow
- [x] Marketplace page (hero, sticky filters, 4-col product grid, newsletter CTA)
- [x] Product Detail page (gallery, specs, related products, installation option)
- [x] Virtual Garage page (items list + build summary sidebar)
- [x] Booking flow (3-step with sidebar HUD + confirmation modal)
- [x] Community feed (posts, likes, comments, floating FAB)
- [x] Auth redirect: unauthenticated "Add to Garage" and "My Garage" → login
- [x] Public routes: Marketplace, Product Detail, Community (no login required)
- [x] Protected routes: Garage, Booking, Dashboard, Profile, Admin
- [x] Backend API: Products, Garage, Bookings, Community, Auth
- [x] Seed data: 15 products, car makes, booking slots, sample posts

## Mocked/Placeholder Features
- 3D Configurator: "Coming Soon" placeholder page
- Payments: Checkout skips payment, goes straight to confirmation
- Image uploads: Community posts use URL-based images (no object storage yet)

## Architecture
```
/app/
├── backend/
│   ├── server.py (FastAPI + MongoDB + all routes + seed script)
│   └── requirements.txt
├── frontend/
│   ├── tailwind.config.js (mg-* color tokens, Space Grotesk/Inter fonts)
│   ├── src/
│   │   ├── App.js (Router with public/protected routes)
│   │   ├── index.css (CSS variables, font imports)
│   │   ├── App.css (Glass, glow effects, grain overlay, utilities)
│   │   ├── context/AuthContext.js
│   │   ├── components/Navbar.js, ProtectedRoute.js
│   │   ├── pages/LandingPage.js, Marketplace.js, ProductDetail.js,
│   │   │         Garage.js, Booking.js, Community.js, Dashboard.js,
│   │   │         Onboarding.js, Configurator.js, Profile.js, Admin.js
```

## Prioritized Backlog
### P0 (Critical)
- Comprehensive testing of all 5 redesigned pages

### P1 (High)
- Object Storage for real image uploads (Community, car profiles)
- Payment integration (Stripe/Razorpay) for checkout
- GSAP scrollytelling performance optimization

### P2 (Medium)
- Real 3D Configurator implementation
- Refactoring: modularize server.py into routes/models
- Mobile responsive polish for all pages

### P3 (Low)
- Wishlist functionality
- Reviews/ratings system
- Push notifications for booking updates
