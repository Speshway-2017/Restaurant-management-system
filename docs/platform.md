# Platform & Roles Document
## Restaurant Management Platform — India Market

**Document Version:** 1.0
**Date:** 2026-08-05

This document defines all user roles in the system, their purpose and permissions, and the target platform/device for each role and module.

---

## 1. Roles Overview

### 1.1 Super Admin (Speshway / Platform Operator)
**Purpose:** Manages the overall SaaS platform across all restaurant tenants (not restaurant-specific). Used by the software vendor's internal ops team.
**Permissions:**
- Onboard/offboard restaurant accounts (tenants)
- Configure platform-level billing/subscription plans
- Monitor system health and usage across tenants
- Access support/troubleshooting tools
- No access to individual restaurant's transactional data beyond support scope

### 1.2 Admin (Restaurant Owner)
**Purpose:** Owns and administers one or more restaurant branches. The top-level business decision-maker within a tenant account.
**Permissions:**
- Full CRUD on restaurant profile, branches, menu, pricing, and tax configuration
- Manage all staff accounts and role assignments
- View all financial reports and dashboards across branches
- Configure payment gateways, loyalty programs, and offers
- Approve high-value refunds/discounts (or delegate to Manager)
- View audit logs

### 1.3 Manager
**Purpose:** Operates day-to-day at a branch level on behalf of the Admin.
**Permissions:**
- View live operational dashboard (tables, kitchen queue, staff)
- Approve discounts/cancellations within delegated authority
- Manage staff shift rosters and attendance
- Access branch-level reports
- Cannot alter global tax/GST configuration or payment gateway credentials

### 1.4 Receptionist / Host
**Purpose:** Manages the front-of-house guest experience: seating, queueing, and reservations.
**Permissions:**
- View and update floor plan/table status
- Issue and manage wait tokens
- Create, modify, cancel table bookings
- Send booking confirmations
- No access to financial reports or menu/pricing configuration

### 1.5 Customer (Diner)
**Purpose:** End guest ordering food via table QR code, tracking status, and paying.
**Permissions:**
- View table-specific digital menu
- Place and modify own orders
- View own order status and bill
- Make payments and view own invoices
- Submit feedback and manage own loyalty account
- No access to any staff-side data

### 1.6 Chef / Kitchen Staff
**Purpose:** Prepares food based on incoming digital orders shown on the Kitchen Display System.
**Permissions:**
- View incoming orders and item details (table-tagged)
- Update order/item preparation status
- Mark items out of stock
- No access to billing, payments, or customer PII beyond table number

### 1.7 Waiter / Service Staff
**Purpose:** Delivers food to tables, manages guest requests, and settles payment at the table.
**Permissions:**
- View assigned tables and order status
- Mark orders as served
- Generate bills and process payment settlement
- Apply limited discounts/coupons
- Initiate cancellations (subject to approval) and table transfers
- No access to menu/pricing configuration or other branches' data

### 1.8 Delivery Staff (optional, in-house delivery module)
**Purpose:** Fulfils takeaway/delivery orders outside dine-in service.
**Permissions:**
- View assigned delivery orders and customer address/contact
- Update delivery status
- Capture proof of delivery
- No access to dine-in table management or kitchen configuration

---

## 2. Platform Targets by Role

| Role | Platform(s) | Primary Device | Notes |
|------|-------------|-----------------|-------|
| Super Admin | Web dashboard | Desktop/Laptop | Internal ops tool, restricted access |
| Admin (Owner) | Web dashboard + Mobile app (Flutter) | Desktop/Laptop primary, Mobile for on-the-go monitoring | Full-featured web dashboard; mobile app for summary dashboards/alerts |
| Manager | Web dashboard + Mobile app (Flutter) | Tablet/Desktop | Similar to Admin but scoped to branch |
| Receptionist | Web app / Tablet app | Tablet (front-desk mounted or handheld) | Optimized for touch, floor-plan visual interaction |
| Customer | Mobile web (PWA via QR scan, no install) + optional native app (Flutter) | Customer's own smartphone | PWA is primary MVP channel; native app for loyalty/repeat customers in later phase |
| Chef / Kitchen | Tablet / KDS screen app (Flutter or web-based KDS) | Wall-mounted or countertop tablet/monitor | High-contrast, large-touch-target UI; dark mode default |
| Waiter | Mobile app (Flutter, Android-first) | Android smartphone | Optimized for one-handed use while moving between tables |
| Delivery Staff | Mobile app (Flutter, Android-first) | Android smartphone | Includes navigation/maps integration |

---

## 3. Role-to-Module Access Matrix

| Module | Super Admin | Admin | Manager | Receptionist | Customer | Chef | Waiter | Delivery |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Tenant/Platform Config | Yes | No | No | No | No | No | No | No |
| Restaurant/Branch Setup | No | Yes | Limited | No | No | No | No | No |
| Menu Management | No | Yes | View | No | View only | View only | View only | No |
| Pricing/GST Config | No | Yes | No | No | No | No | No | No |
| Staff Management | No | Yes | Limited | No | No | No | No | No |
| Floor Plan / Table Mgmt | No | Yes | View | Yes | No | No | View | No |
| Reservations/Tokens | No | View | View | Yes | Self-booking | No | No | No |
| Ordering | No | No | No | No | Yes | No | Assist | No |
| Kitchen Display (KDS) | No | No | View | No | No | Yes | No | No |
| Billing/Payments | No | View | View | No | Self | No | Yes | No |
| Delivery Management | No | View | View | No | Track own | No | No | Yes |
| Reports/Analytics | No | Yes | Branch-level | No | No | No | No | No |
| Loyalty/Offers Config | No | Yes | View | No | Redeem | No | Apply | No |
| Audit Logs | No | Yes | View | No | No | No | No | No |

---

## 4. Device & Environment Considerations (India-specific)

- **Android-first strategy:** Given India's Android market dominance (~95%+ smartphone share), all native mobile apps (Waiter, Delivery, and optional Customer app) prioritize Android; iOS support follows via Flutter's cross-platform build once Android is stable.
- **Customer PWA over native app:** Minimizes friction — no install/download required for a one-time or occasional diner, critical for QR-first adoption in India's fast-casual dining scene.
- **Tablet durability for Chef/Receptionist stations:** Recommend ruggedized or budget Android tablets (commonly available locally) rather than assuming iPad-class hardware.
- **Low-bandwidth resilience:** All role apps should support graceful reconnect and local caching given variable connectivity in tier-2/3 cities.
- **Offline KOT printing:** Printer integration should work over local network/Bluetooth even if cloud connectivity briefly drops, ensuring kitchen operations aren't blocked.
