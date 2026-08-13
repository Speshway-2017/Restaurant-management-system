# Knowledge Base — Flavora Kitchen Restaurant Management Platform

Welcome to the central Knowledge Base for **Flavora Kitchen**, a 360° Indian Restaurant Management Platform. This document consolidates system architecture, role-based workflows, design system standards, technology stack specifications, compliance rules, and frontend application structure into a single canonical reference.

---

## Table of Contents

1. [Platform Overview & Vision](#1-platform-overview--vision)
2. [Design System & Branding](#2-design-system--branding)
   - [Design Principles](#design-principles)
   - [Color Palette Tokens](#color-palette-tokens)
   - [Typography & Scaling](#typography--scaling)
   - [Component & Status Conventions](#component--status-conventions)
3. [Information Architecture by Role](#3-information-architecture-by-role)
   - [Admin / Owner](#31-admin--owner)
   - [Receptionist / Host](#32-receptionist--host)
   - [Customer PWA](#33-customer-pwa)
   - [Chef / KDS](#34-chef--kds)
   - [Waiter Mobile POS](#35-waiter-mobile-pos)
4. [Technology Stack & System Architecture](#4-technology-stack--system-architecture)
   - [MERN + Redis + Flutter Architecture](#mern--redis--flutter-architecture)
   - [Real-Time Socket.io & Redis Pub-Sub](#real-time-socketio--redis-pub-sub)
   - [Payments & GST Compliance](#payments--gst-compliance)
5. [Security, Governance & Compliance](#5-security-governance--compliance)
   - [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
   - [DPDP Act & FSSAI Guidelines](#dpdp-act--fssai-guidelines)
   - [Audit Trail & Tax Invoicing](#audit-trail--tax-invoicing)
6. [Frontend Landing Pages Suite](#6-frontend-landing-pages-suite)
   - [Page Directory Structure](#page-directory-structure)
   - [Interactive Widgets](#interactive-widgets)
7. [Developer Setup & Quick Start](#7-developer-setup--quick-start)

---

## 1. Platform Overview & Vision

**Flavora Kitchen** is engineered specifically for the Indian food service and hospitality market. Unlike generic Western POS tools, Flavora Kitchen addresses Indian dining realities:
- **High-volume QR Dine-in Ordering:** Fast, 5-tap order confirmation without mandatory app installation or account creation.
- **Indian Spice & Cultural Warmth:** Design rooted in deep forest green, turmeric orange, marigold gold, and soft warm cream.
- **Dual Taxation & GST Compliance:** Automatic CGST/SGST 5%, 12%, and 18% splits, HSN/SAC code mapping, and FSSAI license numbers printed on every bill and receipt.
- **Razorpay & UPI Instant Settlement:** Table-side dynamic UPI QR code payments with real-time settlement webhooks.
- **Kitchen Heat & Glare Tolerance:** High-contrast dark-mode KDS for chefs, with sub-50ms Socket.io order propagation.

---

## 2. Design System & Branding

### Design Principles
1. **Mobile-first for Customer Surface:** QR ordering is designed for one-handed smartphone use in portrait mode.
2. **Minimal Taps to Order:** Target: browse → add to cart → confirm order in 5 taps or fewer.
3. **High-Contrast Glanceable Kitchen UI:** KDS screens designed for distance viewing (8+ feet) in bright or dim kitchens.
4. **Role-Appropriate Density:** High data density for executive Admin desktops; sparse action-oriented touch layouts for Waiters and Receptionists.
5. **Localization-Ready Layout:** Flexible containers supporting Hindi and regional script length variations without breaking layouts.

### Color Palette Tokens

| Token | Hex Code | Purpose & Usage |
|-------|----------|-----------------|
| **Primary** | `#1E4636` | Deep forest-green — Primary brand accent, active nav, primary buttons |
| **Primary Dark** | `#142F24` | Hover/pressed states for primary actions, footer background |
| **Secondary** | `#E07A3C` | Turmeric-orange — Secondary actions, highlights, badges |
| **Accent** | `#F2C14E` | Marigold-gold — Accents, veg indicator, warning states |
| **Background** | `#FFF6E8` | Warm cream — App background (light mode) |
| **Surface** | `#FFFFFF` | Cards, sheets, modal overlays |
| **Surface Dark** | `#1C2A22` | Cards/surfaces in KDS dark mode |
| **Background Dark** | `#14201A` | App background in KDS dark mode |
| **Success** | `#3F8F5B` | Order ready, payment success, veg dot indicator |
| **Warning** | `#F2C14E` | Low stock, pending actions |
| **Error** | `#C0392B` | Cancellations, failures, non-veg dot indicator |
| **Neutral 900** | `#2B2B2B` | Primary body text on light surfaces |
| **Neutral 700** | `#5C5C5C` | Secondary text, captions |
| **Neutral 200** | `#E5DBC8` | Borders, dividers |
| **Neutral 100** | `#FFF6E8` | Input backgrounds, subtle cards |

### Typography & Scaling

- **Headings / Display:** **Poppins** (Semibold 600 / Bold 700) — Friendly, warm, geometric weights.
- **Body / UI Text:** **Inter** (Regular 400 / Medium 500 / Bold 700) — Crisp legibility at small sizes.
- **Regional Fallback:** **Noto Sans Devanagari** — Matching x-height for Hindi rendering.

| Token | Size | Weight | Target Usage |
|-------|------|--------|--------------|
| **Display** | 32px - 52px | Bold (700) | Landing page hero titles, dashboard display |
| **H1** | 24px - 36px | Semibold (600) | Page section headers |
| **H2** | 20px - 28px | Semibold (600) | Card titles, category names |
| **Body Large** | 16px - 18px | Regular (400) | Primary body text, item names |
| **Body** | 14px - 16px | Regular (400) | Secondary body text, descriptions |
| **Caption** | 12px - 14px | Medium (500) | Labels, meta info, timestamps |
| **KDS Item Text** | 20px+ | Bold (700) | Oversized kitchen display labels |

### Component & Status Conventions

#### Semantic Order Badges
- **Placed:** `#4A7FB5` (Info Blue)
- **Accepted:** `#E07A3C` (Turmeric-orange)
- **Preparing:** `#C4632C` (Deep Turmeric)
- **Ready:** `#3F8F5B` (Success Green)
- **Served:** `#5C5C5C` (Neutral 700)
- **Cancelled:** `#C0392B` (Error Red)

#### Indian Regulatory Veg / Non-Veg Badges
- **Vegetarian:** Square border with filled circle in `#3F8F5B` Green.
- **Non-Vegetarian:** Square border with filled triangle in `#C0392B` Red/Brown.

---

## 3. Information Architecture by Role

### 3.1 Admin / Owner (Web Dashboard)
- Sales Overview & Revenue Heatmaps
- Multi-Branch Onboarding & Settings
- Menu & Category Setup (Modifiers, Spice levels, Allergens)
- Recipe Stock Auto-Deduction & Supplier Purchase Orders
- Staff Accounts, Shift Rosters & Role-Based Permissions
- GST Tax Reports (5%/12%/18%) & CA Export

### 3.2 Receptionist / Host (Tablet / Web)
- Interactive Floor Plan View (Vacant, Occupied, Reserved, Billing, Cleaning)
- Walk-in Guest Seating Assignment
- Digital Wait-List Token Issuance & Estimated Wait Calculation
- WhatsApp / SMS Table-Ready Alerts
- Reservation Calendar & Guest Profile Lookup

### 3.3 Customer PWA (Mobile Web QR)
- QR Scan Table-Specific Digital Menu (No app install required)
- Multi-Language Toggle (English, Hindi, Regional)
- 5-Tap Order Workflow (Browse → Customization → Add → Confirm → KDS)
- Real-Time Order Status Tracker
- Call-Waiter & Request Assistance Button
- Table-Side Razorpay UPI Scan & Pay + Digital Invoice Download

### 3.4 Chef / Kitchen Display (KDS Tablet)
- High-Contrast Glanceable Dark Mode Interface (`#14201A`)
- Real-Time Incoming Order Queue Grouped by Table
- Station-Wise Routing (Grill, Tandoor, Mains, Desserts, Beverages)
- One-Tap "Out of Stock" Item Toggle (Instantly updates live QR menus)
- Staggered Course Delivery & Delay Escalation Alerts

### 3.5 Waiter Mobile POS (Android & iOS App)
- Real-Time "Order Ready" Pass Alerts (Sound + Vibration)
- Handheld Table Order Addition & Modification
- Split-Billing (Equal / Custom / By Item)
- Table Merging and Transfer Requests
- Manual Discount Application with Manager PIN Override

---

## 4. Technology Stack & System Architecture

### MERN + Redis + Flutter Architecture

```
[ Customer QR PWA ]    [ Admin Web / Receptionist ]    [ Chef KDS / Waiter App ]
   (React / PWA)             (React Dashboard)               (Flutter App)
         │                           │                             │
         └───────────────────────────┼─────────────────────────────┘
                                     ▼
                          [ Nginx Reverse Proxy ]
                                     │
                        [ Node.js + Express API ]
                         (JWT Auth, RBAC, REST)
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
  [ MongoDB Atlas ]                                      [ Redis Cloud ]
(Menus, Orders, Users)                                 (Session, PubSub, Queue)
         │                                                       │
         └───────────────────────────┬───────────────────────────┘
                                     ▼
                     [ Razorpay & Socket.io Gateway ]
```

- **Frontend Web:** React 18, Vite, Vanilla CSS design tokens, Lucide icons.
- **Mobile Apps:** Flutter (Dart) with Riverpod / Bloc for Waiter and Chef KDS tablets.
- **Backend API:** Node.js (LTS), Express.js, TypeScript.
- **Database:** MongoDB Atlas with Mongoose ODM (Flexible menu & nested order documents).
- **Caching & Real-Time Queue:** Redis (Session cache, table state, Socket.io horizontal scaling adapter).
- **Real-Time Channel:** Socket.io bi-directional WebSocket connections.
- **Payment Processing:** Razorpay API, Dynamic UPI QR Deep Links, PhonePe/Paytm adapters.

---

## 5. Security, Governance & Compliance

### Role-Based Access Control (RBAC)

| Role | Scoped Permissions |
|------|--------------------|
| **Admin / Owner** | Full Access: Financials, Pricing Edits, Staff Setup, Audit Logs, Branch Overrides |
| **Manager** | Operational Oversight, High-Value Discount Approvals, Refund Workflows, Shift Rosters |
| **Receptionist** | Floor Plan Management, Wait-Tokens, Guest Reservations |
| **Chef / KDS** | Kitchen Order Queue, Course Marking, Out-of-Stock Item Toggles |
| **Waiter** | Assigned Table Orders, Bill Presentation, Call Assistance Response |
| **Delivery Staff** | Delivery Queue, Route Navigation, COD Settlement |

### DPDP Act & FSSAI Guidelines
- Aligned with India's **Digital Personal Data Protection (DPDP) Act**: Guest phone numbers and dining histories are encrypted with explicit consent and opt-out options.
- Mandatory FSSAI License Number display printed on physical thermal receipts and digital invoices.

### Audit Trail & Tax Invoicing
- Immutable audit log of all bill cancellations, item voids, price adjustments, and manual discounts.
- Strict sequential GST tax invoice numbering per Indian tax regulations.

---

## 6. Frontend Landing Pages Suite

The frontend application (`frontend/`) contains an interactive 8-page landing page platform:

### Page Directory Structure

```
frontend/src/
├── App.jsx                  # Main shell, page router & active state
├── index.css                # Design system tokens, variables & resets
├── main.jsx                 # React root entry point
├── components/
│   ├── Navbar.jsx           # Top navigation with logo & active tab links
│   ├── Footer.jsx           # Comprehensive footer with GSTIN/FSSAI tags
│   └── DemoModal.jsx        # Interactive "Book Demo" modal dialog
└── pages/
    ├── HomePage.jsx         # Hero, POS feed preview, Role Explorer, ROI calculator
    ├── AboutUsPage.jsx      # Brand story, logo design principles, 4 regional hubs
    ├── FeaturesPage.jsx     # 135+ feature inventory breakdown across modules
    ├── PerformancePage.jsx  # Latency benchmarks, Redis hit rates, tech stack specs
    ├── SecurityPage.jsx     # RBAC matrix, DPDP Act compliance, audit logging
    ├── BlogsPage.jsx        # F&B industry articles & modal reader
    ├── ContactUsPage.jsx    # Inquiry form, office addresses, FAQ accordion
    └── LoginPage.jsx        # Multi-role login portal with 1-Click demo switcher
```

### Interactive Widgets
- **Live POS Order Feed Preview:** Simulates real-time order states (`PLACED`, `PREPARING`, `READY`).
- **Interactive Role Explorer:** Switch between Admin, Receptionist, Customer QR, Chef KDS, and Waiter interfaces.
- **ROI Revenue & Labor Savings Calculator:** Range sliders for monthly order volume and average ticket size.
- **Blog Article Reader Modal:** Interactive full-text reader for industry guides.
- **Staff 1-Click Quick Demo Login:** Pre-fills role credentials and simulates authenticated dashboard sessions.

---

## 7. Developer Setup & Quick Start

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher

### Step-by-step Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Run Development Server:**
   ```bash
   npm run dev
   ```
   *Access the web application at `http://localhost:5173`*

4. **Build Production Bundle:**
   ```bash
   npm run build
   ```
   *Output artifacts generated in `frontend/dist/`*

---

*Flavora Kitchen — Good food. Great moments.*
