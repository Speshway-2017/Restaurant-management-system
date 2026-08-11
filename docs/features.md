# Feature List
## Restaurant Management Platform — India Market

**Document Version:** 1.0
**Date:** 2026-08-05

This document provides an exhaustive, module-wise feature inventory for a full-scale Indian restaurant management platform, expanding on the core roles (Admin, Receptionist, Customer, Chef, Waiter) with realistic market-driven capabilities.

---

## 1. Admin / Owner Module

### 1.1 Restaurant & Branch Setup
- Restaurant profile management (name, logo, address, contact, GSTIN, FSSAI license number)
- Multi-branch onboarding and management under one owner account
- Branch-level configuration overrides (menu, pricing, tax, hours)
- Business hours and holiday schedule configuration

### 1.2 Menu Management
- Category and sub-category management
- Item creation with images, description, pricing, veg/non-veg/egg tags
- Multi-language item names and descriptions (English, Hindi, regional languages)
- Item variants (size, portion) and add-ons/customizations
- Allergen and spice-level tagging
- Combo/meal deal creation
- Seasonal/limited-time menu scheduling
- Menu availability by day-part (breakfast/lunch/dinner)
- Bulk menu import/export (CSV/Excel)

### 1.3 Pricing & Taxation
- GST rate configuration per item/category (5%, 12%, 18%)
- HSN/SAC code mapping per item
- CGST/SGST/IGST auto-calculation based on transaction type
- Service charge configuration (optional, per legal guidelines)
- Discount and offer rule engine

### 1.4 Staff & Access Management
- Role-based access control (Admin, Manager, Receptionist, Chef, Waiter, Delivery Staff)
- Staff onboarding, deactivation, and permission assignment
- Staff shift scheduling and roster management
- Attendance tracking (check-in/check-out)
- Staff performance metrics (orders served, average table turnaround)

### 1.5 Financial & Reporting Dashboards
- Real-time sales dashboard (daily/weekly/monthly)
- Revenue breakdown by category, item, branch, time-of-day
- Best-seller and slow-mover item analytics
- Payment mode breakdown (UPI/card/cash)
- GST report export for filing
- Profit margin insights (linked to inventory cost data)
- Multi-branch comparative reporting
- Discount/coupon usage reports
- Customer footfall and repeat-visit analytics

### 1.6 Inventory & Stock Management
- Ingredient/raw material stock tracking
- Auto stock deduction linked to item sales (recipe-based)
- Low-stock alerts and reorder suggestions
- Supplier/vendor management
- Purchase order creation and tracking
- Wastage logging

### 1.7 Marketing & Loyalty
- Loyalty points program configuration
- Coupon/promo code creation with rules (min order, item-specific, time-bound)
- Push/SMS/WhatsApp campaign creation for offers
- Referral program setup

### 1.8 Compliance & Governance
- FSSAI license display configuration on menu/invoice
- Audit log of critical actions (price edits, cancellations, refunds, role changes)
- Data export for regulatory/tax audits
- Configurable invoice numbering series per GST rules

### 1.9 Payment Configuration
- Payment gateway integration setup (Razorpay/PhonePe/Paytm)
- UPI QR code generation per branch/table
- Settlement and payout tracking
- Refund initiation and tracking

---

## 2. Receptionist / Host Module

- Live floor plan view with table status (vacant/occupied/reserved/billing/cleaning)
- Walk-in seating assignment based on party size
- Wait-token issuance with estimated wait time
- Digital queue display (screen/customer SMS) with live position updates
- Token call/notify (SMS/WhatsApp alert when table ready)
- Token expiry and no-show handling
- Table booking/reservation creation, modification, and cancellation
- Reservation calendar (day/week view)
- Booking confirmation via SMS/WhatsApp
- Booking reminder notifications
- Table merge/split for large parties
- Table transfer between sections
- Guest profile lookup (repeat customer recognition, preferences)
- Special occasion tagging (birthday/anniversary) for service teams
- Walk-in vs. reservation conflict resolution

---

## 3. Customer Module (QR / Mobile Web / App)

### 3.1 Ordering
- QR scan to load table-specific digital menu (PWA, no install)
- Multi-language menu browsing
- Search and filter (veg/non-veg, category, price, spice level)
- Item detail view with images, description, allergens, customization options
- Add to cart, edit quantity, add special instructions
- Real-time order status tracking (Placed → Accepted → Preparing → Ready → Served)
- Add items to an existing open order
- Call-waiter / request-assistance button
- Order history view (past visits, reorder shortcut)

### 3.2 Payments & Billing
- View live running bill
- UPI/QR pay, card payment, wallet payment
- Pay-at-counter option
- Split bill (equal/by item/custom)
- Digital GST-compliant invoice generation and download/share
- Tip/gratuity option

### 3.3 Engagement
- Loyalty points balance and redemption
- Apply coupon/promo codes
- Post-meal rating and feedback (food, service, ambience)
- Advance table booking via link/app
- Referral sharing

### 3.4 Delivery & Takeaway (optional module)
- Switch to takeaway/delivery ordering mode from same platform
- Delivery address and contact management
- Order tracking for takeaway/delivery status
- Integration adapters for third-party aggregators (Swiggy/Zomato-style) or in-house delivery fleet management

---

## 4. Chef / Kitchen Module (KDS)

- Real-time incoming order feed grouped by table number
- Order item detail with customizations/special instructions highlighted
- Status update controls: Accepted → Preparing → Ready (per item and per order)
- Course-wise/staggered preparation marking (starters vs. mains)
- Mark item "Out of Stock" instantly (auto-removed from live customer menus)
- Priority sorting (by wait time, order type: dine-in/takeaway/delivery)
- Automatic KOT (Kitchen Order Ticket) printing on order acceptance
- Station-wise order routing (grill, tandoor, dessert, beverage stations)
- Delay flagging and escalation alert to waiter/manager
- Dark-mode, high-contrast display optimized for kitchen environment

---

## 5. Waiter Module

- Real-time "Order Ready" alerts per table
- Table assignment view with live order status summary
- Mark order as "Served"
- Generate and present GST-compliant final bill
- Process payment settlement (UPI/card/cash) at table
- Apply manual discounts/coupons (within permission limits)
- Split billing across guests
- Initiate table transfer/merge requests
- Cancel item/order with reason code (subject to approval workflow)
- Call-assistance response handling (from customer requests)
- Upsell prompts (suggested add-ons based on order)

---

## 6. Manager Module

- Live cross-table and kitchen queue operational dashboard
- Approval workflow for high-value discounts, refunds, cancellations
- Staff shift roster creation and attendance oversight
- Daily/weekly performance report access
- Escalation handling for delayed orders or customer complaints
- Inventory variance review

---

## 7. Delivery Staff Module (optional, in-house delivery)

- Assigned delivery order queue
- Navigation/route link to customer address
- Delivery status updates (Picked Up → In Transit → Delivered)
- Cash-on-delivery / prepaid order flagging
- Proof-of-delivery capture (optional photo/signature)

---

## 8. Platform-Wide / Cross-Cutting Features

### 8.1 Notifications
- SMS notifications (booking confirmation, order ready, offers)
- WhatsApp Business API notifications (receipts, reminders, promotions)
- Push notifications (mobile apps — order status, offers)
- In-app real-time alerts (Socket-based) for staff roles

### 8.2 Table & Floor Management
- Visual drag-and-drop floor plan editor (Admin)
- Table status lifecycle: Available → Reserved → Occupied → Billing → Cleaning → Available
- Section/zone management (AC/non-AC, indoor/outdoor, rooftop)

### 8.3 Printer & Hardware Integration
- KOT thermal printer integration
- Bill/receipt printer integration
- QR code generation and printing per table

### 8.4 Reporting & Analytics
- Sales trends (daily/weekly/monthly/yearly)
- Peak-hour heatmaps
- Staff productivity metrics
- Customer retention and repeat-visit rate
- Menu engineering reports (high-margin, high-popularity matrix)

### 8.5 Security & Compliance
- Role-based access control (RBAC) across all modules
- Audit logs for sensitive actions
- Data encryption at rest and in transit
- DPDP Act (India) aligned data handling and consent management
- Session management and device-level access control

### 8.6 Multi-Branch & Franchise Support
- Centralized owner dashboard across branches
- Branch-level staff and menu autonomy within global brand settings
- Consolidated and per-branch financial reporting

### 8.7 Feedback & Reputation
- In-app post-order feedback capture
- Aggregate rating dashboard for Admin
- Optional integration hooks for Google Reviews prompts

---

## 9. Feature Summary Table

| Module | Key Feature Count (approx.) |
|--------|------------------------------|
| Admin | 45+ |
| Receptionist | 14 |
| Customer | 24 |
| Chef / KDS | 10 |
| Waiter | 11 |
| Manager | 6 |
| Delivery Staff | 5 |
| Cross-cutting (Notifications, Security, Reporting, Hardware) | 20+ |
