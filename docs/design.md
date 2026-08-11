# Design Document
## Restaurant Management Platform — India Market

**Document Version:** 1.0
**Date:** 2026-08-05

---

## 1. Design Principles

1. **Mobile-first for the Customer surface.** The QR-scan ordering experience is the highest-traffic, lowest-patience touchpoint. Every screen must be designed for a one-handed smartphone in portrait orientation first, then scaled up.
2. **Minimal taps to order.** Target: browse → add to cart → confirm order in 5 taps or fewer. Avoid unnecessary intermediate screens, modals-within-modals, or mandatory account creation.
3. **High-contrast, glanceable kitchen UI.** Chef/KDS screens are viewed from a distance, often in a hot, bright, or dim kitchen environment with wet/gloved hands. Large type, bold status colors, minimal fine print.
4. **Role-appropriate density.** Admin dashboards can be information-dense (desktop-class users); Waiter and Receptionist tools should be sparse and action-oriented (mobile/tablet, fast decisions).
5. **Consistency across roles, distinct emphasis per role.** One shared design system (color, type, components) — but Customer-facing surfaces emphasize appetite appeal and warmth; staff-facing surfaces emphasize speed and clarity.
6. **Forgiving, not fragile.** Every destructive or high-stakes action (cancel order, apply discount, void bill) requires a confirmation step or permission gate, but common actions (accept order, mark ready) are single-tap.
7. **Localization-ready layout.** Text containers must accommodate longer strings in Hindi/regional scripts without breaking layout (avoid fixed-width text truncation on critical labels).

---

## 2. Information Architecture by Role

### 2.1 Admin (Web Dashboard)
```
Dashboard (Home)
├── Sales Overview
├── Orders
├── Menu Management
│   ├── Categories
│   ├── Items
│   └── Combos/Offers
├── Tables & Floor Plan
├── Reservations
├── Staff
│   ├── Accounts & Roles
│   └── Shifts & Attendance
├── Inventory
├── Loyalty & Coupons
├── Reports & Analytics
├── Payments & Settlements
└── Settings
    ├── Restaurant Profile / GST / FSSAI
    ├── Branches
    └── Audit Log
```

### 2.2 Receptionist (Tablet/Web)
```
Home (Floor Plan View)
├── Seat Walk-in
├── Wait Queue / Tokens
├── Reservations
│   ├── Today
│   └── New Booking
└── Table Actions (Merge/Split/Transfer)
```

### 2.3 Customer (Mobile Web PWA)
```
[QR Scan] → Menu Home
├── Categories / Search
├── Item Detail
├── Cart
├── Order Status
├── Bill / Payment
└── Feedback
```

### 2.4 Chef / KDS (Tablet)
```
Order Queue (default view)
├── New Orders
├── In Preparation
├── Ready
└── Item Stock Toggle
```

### 2.5 Waiter (Mobile App)
```
My Tables (Home)
├── Table Detail
│   ├── Order Status
│   ├── Add Item (assist)
│   └── Bill / Settle
├── Alerts (Ready / Assistance Requests)
└── Profile / Shift
```

---

## 3. Branding

**Logo:** `logo (1).png` (project root) — the **Flavora Kitchen** mark ("FLAVORA KITCHEN — Good food. Great moments."), pairing a forest-green fork/leaf monogram with a chef's-hat motif and turmeric-orange ring accent. Use this logo as the canonical brand mark across the Admin dashboard header, Customer PWA splash/nav, printed bills/KOTs, and marketing surfaces — do not substitute a generic placeholder. Its green/orange coloring is the direct source of this palette's Primary/Secondary hues below, so brand mark and UI stay visually unified.

## 4. Color Palette

**Concept:** A warm, appetizing palette rooted in Indian food culture — a deep forest-green anchor paired with turmeric-orange and marigold-gold against a soft cream background and grounded charcoal text (evoking freshness/veg cues and spice-market warmth, common in Indian restaurant visual language).

| Token | Hex | Usage |
|-------|-----|-------|
| **Primary** | `#1E4636` | Deep forest-green — primary buttons, active nav, brand accent |
| **Primary Dark** | `#142F24` | Hover/pressed states for primary |
| **Secondary** | `#E07A3C` | Turmeric-orange — secondary actions, highlights, badges |
| **Accent** | `#F2C14E` | Marigold-gold — accents, veg indicator, highlights on light bg |
| **Background** | `#FFF6E8` | Warm cream — app background (light mode) |
| **Surface** | `#FFFFFF` | Cards, modals, sheets (light mode) |
| **Surface Dark** | `#1C2A22` | Cards/surfaces in dark/KDS mode |
| **Background Dark** | `#14201A` | App background in dark/KDS mode |
| **Success** | `#3F8F5B` | Order ready, payment success, veg indicator dot |
| **Warning** | `#F2C14E` | Low stock, pending actions (shared with Accent for cohesion) |
| **Error** | `#C0392B` | Cancellations, failures, non-veg indicator dot (distinct from Primary by tone/context) |
| **Neutral 900** | `#2B2B2B` | Primary text on light surfaces |
| **Neutral 700** | `#5C5C5C` | Secondary text |
| **Neutral 400** | `#9A9A9A` | Disabled text, placeholders |
| **Neutral 200** | `#E5DBC8` | Borders, dividers (light mode) |
| **Neutral 100** | `#FFF6E8` | Subtle backgrounds, input fields |

**Brand core:** `#1E4636` (forest green), `#E07A3C` (turmeric orange), `#F2C14E` (marigold gold), `#FFF6E8` (cream), `#2B2B2B` (charcoal). Success/Warning/Error retain functional red/green tones for status legibility, tuned to sit harmoniously alongside the brand core.

**Justification:** Forest-green as the primary reads as fresh, natural, and food-safe (aligning with "veg"/freshness cues), while turmeric-orange and marigold-gold carry the spice-market warmth associated with Indian restaurant branding. The warm cream background (rather than stark white) feels hospitable rather than clinical, and charcoal text (`#2B2B2B`) keeps contrast crisp without the coldness of pure black. Deep green-based dark surfaces keep the palette warm even in dark/KDS mode, avoiding a cold, generic "tech" look.

### Semantic Status Colors (Order Badges)

| Status | Color | Hex |
|--------|-------|-----|
| Placed | Neutral / Info Blue | `#4A7FB5` |
| Accepted | Turmeric-orange | `#E07A3C` |
| Preparing | Turmeric-orange (deeper) | `#C4632C` |
| Ready | Success green | `#3F8F5B` |
| Served | Neutral 700 | `#5C5C5C` |
| Cancelled | Error red | `#C0392B` |

---

## 5. Typography

**Font Pairing:**

| Role | Font | Rationale |
|------|------|-----------|
| Headings / Display | **Poppins** (Semibold/Bold) | Geometric, warm, friendly weight — works well for menu category headers and dashboard titles; good Devanagari/Latin pairing availability via Noto companions. |
| Body / UI Text | **Inter** (Regular/Medium) | Highly legible at small sizes, excellent for dense dashboard UI and long menu descriptions; strong multi-script support. |
| Hindi / Regional Script Fallback | **Noto Sans Devanagari** (and Noto Sans [Tamil/Telugu/Kannada] as needed) | Ensures consistent rendering and matching x-height/weight when UI switches language, avoiding jarring font-substitution artifacts. |
| Kitchen/KDS Display | **Inter** (Bold, larger scale) | Prioritize legibility over personality at distance; avoid decorative fonts entirely on KDS. |

**Type Scale (base 16px):**

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| Display | 32px | Bold (700) | Dashboard page titles |
| H1 | 24px | Semibold (600) | Section headers |
| H2 | 20px | Semibold (600) | Card titles, menu category names |
| Body Large | 16px | Regular (400) | Primary body text, menu item names |
| Body | 14px | Regular (400) | Secondary text, descriptions |
| Caption | 12px | Medium (500) | Labels, timestamps, meta info |
| KDS Item Text | 20px+ | Bold (700) | Order items on kitchen display — deliberately oversized |

---

## 6. Spacing & Grid System

- **Base unit:** 4px grid (spacing tokens: 4, 8, 12, 16, 24, 32, 48, 64).
- **Web dashboard grid:** 12-column responsive grid, 24px gutters, max content width ~1440px with centered layout on larger screens.
- **Mobile/PWA grid:** Single-column flow, 16px horizontal page margin, 12px spacing between stacked cards.
- **Touch targets:** Minimum 44×44px for all interactive elements on tablet/mobile (Receptionist, Waiter, Chef, Customer).
- **Card corner radius:** 12px standard (16px for prominent customer-facing cards like menu items) — soft, approachable, avoids sharp/clinical feel.

---

## 7. Component Notes

### 7.1 Buttons
- **Primary button:** Filled, Primary green (`#1E4636`), white text, 12px radius, 44px min height.
- **Secondary button:** Outlined, Neutral 700 border and text, transparent fill.
- **Destructive button:** Filled Error red (`#C0392B`), used only for cancel/void actions with confirmation step.
- Disabled state: Neutral 200 fill, Neutral 400 text.

### 7.2 Cards
- **Menu item card (Customer):** Image (top, 4:3 ratio), item name (Body Large, Neutral 900), price (Body, Primary green), veg/non-veg dot indicator (top-left of image, green/red per FSSAI-style convention), quick "Add" button (bottom-right, circular, Primary).
- **Order card (Waiter/Chef):** Table number prominent (H2, top-left), status badge (top-right, semantic color), item list (Body, with quantity), timestamp (Caption, Neutral 400).
- **Dashboard stat card (Admin):** Label (Caption), value (Display or H1), trend indicator (small arrow + percentage, green/red).

### 7.3 Order Status Badges
- Pill-shaped, filled with semantic status color at 15% opacity background + full-opacity text/icon of same hue, ensuring accessible contrast while remaining visually light. Bold uppercase caption text (e.g., "PREPARING").

### 7.4 Forms & Inputs
- Input fields: Neutral 100 background, Neutral 200 border, 8px radius, 44px height minimum, clear label above (not placeholder-only, for accessibility).
- Validation errors: Error red border + caption text below field.

### 7.5 Floor Plan (Receptionist)
- Tables rendered as shape tokens (circle/square matching real seating) colored by status: Available (Neutral 200 outline), Reserved (Secondary/orange fill), Occupied (Primary green fill), Billing (Warning/gold striped), Cleaning (Neutral 400 fill).

---

## 8. Accessibility Notes

- Maintain WCAG 2.1 AA contrast ratios (minimum 4.5:1 for body text, 3:1 for large text/icons) across all semantic colors on their respective backgrounds — validated the palette above against both light and dark surfaces.
- Never rely on color alone for status: pair every status badge/veg-nonveg indicator with a text label or icon (e.g., filled circle icon shapes differ for veg/non-veg in addition to color, matching familiar Indian menu conventions).
- Minimum touch target 44×44px across all staff-facing tablet/mobile interfaces.
- Support dynamic text scaling (respect OS-level font size settings) on Flutter apps; avoid fixed-height text containers that clip scaled text.
- Ensure Hindi/regional script rendering has adequate line-height (at least 1.4×) to accommodate taller glyphs/matras compared to Latin script.
- KDS and Waiter apps should support audio + visual alerts together (not visual-only) for new order/ready events, accommodating noisy kitchen environments and staff who may not be looking at the screen.
- Keyboard navigability and screen-reader labeling required for the Admin web dashboard (desktop assistive tech users).

---

## 9. Dark Mode Consideration (Kitchen / KDS Screens)

- **Default to dark mode for Chef/KDS.** Kitchens are often bright with overhead lighting and stainless-steel glare; a dark UI reduces eye strain and glare reflection compared to a bright white dashboard, and improves perceived contrast of status-colored order cards.
- Dark mode palette uses `Background Dark (#14201A)` and `Surface Dark (#1C2A22)` with the same semantic status colors (Success/Warning/Error) boosted slightly in luminance for AA contrast against dark surfaces.
- Text on dark surfaces uses off-white (`#FFF6E8`, i.e., Neutral 100) rather than pure white, keeping continuity with the warm palette and reducing harsh contrast glare.
- Admin and Customer surfaces should also offer an optional dark mode (system-preference-aware) for evening use, but light/warm mode remains the default for Customer ordering to preserve the "appetizing" visual tone — food photography reads best on a light, warm background.
- Waiter app should default to system theme (light or dark) since it is used in varied lighting (dining floor vs. kitchen pass area).

---

## 10. Iconography & Imagery

- Use a consistent rounded icon set (e.g., outline-style, 2px stroke) across all roles for visual cohesion.
- Veg/non-veg indicators follow the standard Indian convention: green square/dot outline for vegetarian, red/brown square/dot outline for non-vegetarian — a widely recognized regulatory-adjacent visual cue in Indian food service.
- Menu photography should be warm-toned, well-lit, and consistently cropped (4:3 or 1:1) to maintain a cohesive, appetizing gallery feel across categories.
