# Product Requirements Document (PRD)
## Restaurant Management Platform — India Market

**Document Version:** 1.0
**Date:** 2026-08-05

---

## 1. Product Overview

The Restaurant Management Platform is a multi-role, cloud-based system that digitizes the full dine-in lifecycle: seating and queue management, QR-based self-ordering, kitchen order execution, service delivery, and GST/UPI-compliant billing. It is composed of a web-based Admin dashboard, tablet/web apps for Receptionist and Chef (KDS), a mobile app for Waiters, and a no-install mobile-web (PWA) experience for Customers accessed via table QR codes.

The product is designed for the Indian food-service market, supporting GST invoicing, UPI payments, FSSAI compliance metadata, and multi-language menus.

---

## 2. Goals

- Enable customers to self-order via QR scan with zero app installation.
- Give kitchen staff a real-time, prioritized, table-tagged order queue.
- Give waiters instant visibility into order-ready events and enable fast billing/settlement.
- Give receptionists tools to manage seating capacity, walk-in queues (tokens), and advance bookings.
- Give owners/admins full operational and financial visibility across one or many branches.

---

## 3. User Personas

| Persona | Description | Primary Goals |
|---------|-------------|----------------|
| **Ravi — Restaurant Owner (Admin)** | Owns a 2-branch casual dining restaurant in Pune. Not deeply technical but wants clear dashboards. | Track daily sales, manage menu/pricing, monitor staff, ensure GST compliance. |
| **Anjali — Receptionist** | Manages the front desk during peak hours at a busy restaurant. | Seat guests quickly, manage the wait queue fairly, handle phone/online bookings. |
| **Suresh — Chef (Kitchen)** | Head chef managing 3 kitchen stations during rush hours. | See orders instantly, prioritize by wait time, mark items ready without confusion. |
| **Meena — Waiter** | Handles 6-8 tables per shift. | Know instantly when food is ready, avoid serving delays, settle bills quickly. |
| **Karan — Customer** | Dines out with family on weekends. | Order quickly without waiting for staff, track order progress, pay easily via UPI. |
| **Divya — Manager** | Oversees daily operations, reports to owner. | Monitor staff shifts, inventory levels, and daily performance metrics. |

---

## 4. Functional Requirements by Role

### 4.1 Admin (Owner)

| ID | Requirement |
|----|-------------|
| FR-A1 | Create and manage restaurant profile(s): name, address, GSTIN, FSSAI license number, branches. |
| FR-A2 | Manage digital menu: categories, items, prices, images, availability, multi-language labels. |
| FR-A3 | Configure GST tax rates per item/category (5%, 18%, etc.) and generate compliant invoices. |
| FR-A4 | View real-time sales dashboard: revenue, orders, average order value, best-sellers. |
| FR-A5 | Manage staff accounts and role-based access (create/deactivate Receptionist, Chef, Waiter, Manager). |
| FR-A6 | Configure table layout / floor plan per branch. |
| FR-A7 | View and manage inventory/stock levels; set low-stock alerts. |
| FR-A8 | Create and manage loyalty programs, discount coupons, and promotional offers. |
| FR-A9 | View customer feedback and ratings; respond where applicable. |
| FR-A10 | Access consolidated multi-branch reports (sales, inventory, staff performance). |
| FR-A11 | View audit logs of critical actions (price changes, order voids, refunds). |
| FR-A12 | Configure payment gateway credentials (Razorpay/PhonePe/Paytm). |
| FR-A13 | Manage staff shift schedules and view attendance summaries. |

### 4.2 Receptionist

| ID | Requirement |
|----|-------------|
| FR-R1 | View real-time floor plan with table status (vacant, occupied, reserved, billing). |
| FR-R2 | Seat walk-in customers by assigning an available table. |
| FR-R3 | Issue a wait token with estimated wait time when no tables are available. |
| FR-R4 | Display/announce current token being served (queue display). |
| FR-R5 | Accept and manage table bookings/reservations (date, time, party size, contact number). |
| FR-R6 | Send booking confirmation via SMS/WhatsApp automatically. |
| FR-R7 | Modify or cancel a reservation. |
| FR-R8 | Merge or split tables based on party size. |
| FR-R9 | Transfer a seated party from one table to another. |
| FR-R10 | View daily reservation calendar. |

### 4.3 Customer

| ID | Requirement |
|----|-------------|
| FR-C1 | Scan table QR code to open the digital menu specific to that table (no login required for browsing). |
| FR-C2 | View menu with categories, images, descriptions, price, veg/non-veg indicators, allergen info. |
| FR-C3 | Switch menu language (English/Hindi/regional). |
| FR-C4 | Add items to cart, customize (spice level, add-ons, quantity), and submit order. |
| FR-C5 | View real-time order status (Placed → Accepted → Preparing → Ready → Served). |
| FR-C6 | Call waiter / request assistance via in-app button. |
| FR-C7 | Add additional items to an existing open order. |
| FR-C8 | View running bill total at any time before payment. |
| FR-C9 | Pay via UPI/QR, card, or request pay-at-counter; receive digital GST invoice. |
| FR-C10 | Split bill among multiple people. |
| FR-C11 | Rate the meal and service, and leave feedback post-payment. |
| FR-C12 | View and redeem loyalty points or coupon codes. |
| FR-C13 | Optionally book a table in advance via link/app. |

### 4.4 Chef (Kitchen / KDS)

| ID | Requirement |
|----|-------------|
| FR-CH1 | View incoming orders in real time, grouped/tagged by table number. |
| FR-CH2 | View order items with customizations and special instructions clearly. |
| FR-CH3 | Update item/order status: Accepted → In Preparation → Ready. |
| FR-CH4 | Mark an item as "Out of Stock" instantly, removing it from the live customer menu. |
| FR-CH5 | Prioritize/sort orders by wait time or order type (dine-in/takeaway/delivery). |
| FR-CH6 | Print KOT (Kitchen Order Ticket) automatically on order acceptance, where hardware present. |
| FR-CH7 | Flag delays and notify waiter/receptionist of exceptional wait times. |

### 4.5 Waiter

| ID | Requirement |
|----|-------------|
| FR-W1 | Receive real-time alert when an order is marked "Ready" for a specific table. |
| FR-W2 | Mark order as "Served" upon delivery to table. |
| FR-W3 | View all active tables assigned to them with order status summary. |
| FR-W4 | Generate and present the final GST-compliant bill to the customer. |
| FR-W5 | Process payment settlement (UPI/card/cash) and mark table as billed. |
| FR-W6 | Apply manual discounts/coupons at the table (with permission level). |
| FR-W7 | Handle split billing across multiple guests. |
| FR-W8 | Initiate a table transfer or merge request. |
| FR-W9 | Cancel an item/order with a reason code (subject to approval rules). |

### 4.6 Manager (extended role)

| ID | Requirement |
|----|-------------|
| FR-M1 | View live operational dashboard across all active tables and kitchen queue. |
| FR-M2 | Approve high-value discounts, refunds, or order cancellations. |
| FR-M3 | Manage staff shift rosters and attendance. |
| FR-M4 | Access daily/weekly performance reports. |

---

## 5. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Order placement round-trip (customer submit → kitchen display) under 2 seconds on 4G. Page load for customer menu under 3 seconds on 4G. |
| **Scalability** | Support 500+ concurrent customer sessions per branch during peak hours; horizontally scalable backend for multi-branch load. |
| **Security** | All traffic over HTTPS/TLS 1.2+; role-based access control (RBAC); encrypted storage of PII and payment references; no raw card data stored (PCI DSS via gateway tokenization). |
| **Availability** | 99.5% uptime during restaurant operating hours; graceful degradation to cached menu on connectivity loss. |
| **Data Integrity** | Order and payment transactions must be atomic; no dual-charge or lost-order scenarios. |
| **Usability** | Customer ordering flow completable within 5 taps from QR scan to cart; kitchen/waiter UI legible at arm's length on tablets. |
| **Localization** | Full UI/menu string localization framework (English, Hindi, extensible to Tamil/Telugu/Kannada/Marathi etc.). |
| **Auditability** | All price changes, cancellations, refunds, and role changes logged with timestamp and actor identity. |
| **Compatibility** | Customer PWA must work on Android Chrome and iOS Safari without installation; Waiter/Chef apps target Android tablets/phones (majority market share in India). |
| **Compliance** | GST invoice fields per CBIC format; data handling aligned with India's Digital Personal Data Protection (DPDP) Act. |

---

## 6. User Flows

### 6.1 Customer: QR Scan → Menu → Order → Kitchen → Waiter → Payment

1. Customer is seated at a table with a printed QR code unique to that table ID.
2. Customer scans the QR code using their phone camera; mobile browser opens the digital menu web app pre-loaded with the correct table context (no manual table entry).
3. Customer browses menu by category, filters (veg/non-veg), and switches language if desired.
4. Customer adds items to cart, applies customizations (spice level, add-ons, notes).
5. Customer reviews cart and taps "Place Order."
6. Order is transmitted instantly to the Kitchen Display System (KDS), tagged with the table number, and simultaneously appears on the assigned Waiter's app as "Order Placed."
7. Chef reviews the order on KDS, taps "Accept," and status updates to "Preparing" (visible to customer in real time). KOT prints automatically if a printer is configured.
8. Chef marks items/order as "Ready" once prepared.
9. Waiter receives a real-time "Ready — Table X" alert on their app.
10. Waiter collects the order from the kitchen pass and delivers it to the table, then marks it "Served" in the app.
11. Customer may continue adding items (repeats steps 4-10) or request the bill.
12. Customer/waiter generates the final bill; customer chooses payment method: UPI/QR scan-to-pay, card, or pay-at-counter.
13. On successful payment, a GST-compliant digital invoice is generated and shared (SMS/WhatsApp/on-screen) to the customer; table status resets to "Available" once cleared by staff/receptionist.
14. Customer is prompted to rate the meal and service.

### 6.2 Receptionist: Token/Queue Flow

1. Walk-in customer approaches the reception desk.
2. Receptionist checks the live floor plan for available tables matching party size.
3. If a suitable table is available, receptionist assigns and seats the customer directly; table status updates to "Occupied."
4. If no table is available, receptionist issues a digital wait token (number + estimated wait time) to the customer, optionally sent via SMS.
5. The queue display (screen or customer's phone) shows current token being seated and estimated wait.
6. As tables become free, the system suggests the next eligible token based on party size and queue order.
7. Receptionist calls the token, seats the customer, and marks the table "Occupied," removing the token from the active queue.
8. If a token holder does not respond within a configurable grace period, the token expires and moves to the back of the queue or is cancelled.

### 6.3 Booking / Reservation Flow

1. Customer requests a table booking via phone, website widget, or in-app link, providing date, time, party size, and contact details.
2. Receptionist (or the customer directly, if self-service booking is enabled) checks table availability for the requested slot on the floor plan calendar.
3. Booking is confirmed and recorded against a specific table or table-type.
4. System automatically sends a confirmation message via SMS/WhatsApp with booking reference, date/time, and restaurant details.
5. A reminder notification is sent a few hours before the reservation time.
6. On the reservation day, the reserved table is marked "Reserved" on the floor plan ahead of the slot and blocked from walk-in assignment.
7. On guest arrival, receptionist checks in the booking, converting the table status to "Occupied."
8. No-shows past a grace period automatically release the table back to available inventory, optionally flagging the customer profile.

---

## 7. Edge Cases

| Edge Case | Expected Behavior |
|-----------|--------------------|
| **Order cancellation** | Customer/waiter can request cancellation before kitchen accepts (auto-approved); after acceptance, cancellation requires Manager/Admin approval with a reason code logged in the audit trail. |
| **Item out of stock mid-service** | Chef marks item unavailable; it is immediately hidden/disabled on all active and new customer menu sessions; customers with the item already in an unsent cart are notified before submission. |
| **Split billing** | Waiter or customer can split the total bill by item, by equal shares, or by custom amount across multiple payment instances (each generating its own GST invoice line reference tied to the master bill). |
| **Table transfer** | Waiter/Receptionist can move an active order session to a new table; all open orders, KDS tags, and bill state transfer to the new table number, old table is released as "Available." |
| **Partial order readiness** | Waiter is notified per item/course if kitchen marks partial readiness (e.g., starters ready before mains), allowing staggered service. |
| **Payment failure (UPI)** | System retries/reflects failure status instantly; customer is prompted to retry or choose an alternate payment method; order/table is not marked paid until gateway confirms success. |
| **Duplicate QR scans (multiple devices at one table)** | All devices scanning the same table QR share one live session/cart view so orders aren't duplicated or lost. |
| **Network drop during order submission** | Order is queued locally on the customer device and auto-retried on reconnect; customer sees a "Sending..." state rather than a silent failure. |
| **No-show after wait token issued** | Token auto-expires after a configurable timeout and moves to the back of the queue or is voided. |
| **Overbooked reservation slot** | System blocks double-booking of the same table/time slot and suggests alternate time or table. |

---

## 8. Release Phasing (Indicative)

| Phase | Scope |
|-------|-------|
| MVP | QR ordering, KDS, waiter app, receptionist token/booking, GST billing, UPI payment (Razorpay), basic Admin dashboard. |
| Phase 2 | Loyalty/coupons, feedback system, inventory management, multi-branch reporting, WhatsApp notifications. |
| Phase 3 | Delivery/takeaway integration, advanced analytics, multi-language expansion, shift management. |
