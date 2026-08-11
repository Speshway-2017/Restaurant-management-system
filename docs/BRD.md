# Business Requirements Document (BRD)
## Restaurant Management Platform — India Market

**Document Version:** 1.0
**Date:** 2026-08-05
**Status:** Draft for Review

---

## 1. Executive Summary

The Restaurant Management Platform is a digital solution designed to modernize dine-in, takeaway, and delivery operations for restaurants, cafes, and hotels operating in India. The platform digitizes the entire guest journey — from seat allocation and QR-based ordering to kitchen preparation, service, and GST-compliant billing with UPI payments — while giving owners real-time visibility and control across single or multiple branches.

This document defines the business rationale, scope, stakeholders, constraints, and success criteria for the project from a business (non-technical) perspective.

---

## 2. Business Objectives

| # | Objective | Description |
|---|-----------|-------------|
| 1 | Reduce order-to-service time | Eliminate manual order-taking delays via QR self-ordering and direct kitchen routing. |
| 2 | Improve table turnover | Faster ordering, billing, and queue management increase covers served per day. |
| 3 | Ensure billing compliance | 100% GST-compliant invoicing with accurate tax slabs (5%/18% as applicable) and HSN/SAC codes. |
| 4 | Increase digital payment adoption | Native UPI/QR payment support (Razorpay, PhonePe, Paytm) to reduce cash handling and reconciliation effort. |
| 5 | Reduce order errors | Direct digital order transmission from customer to kitchen removes verbal/handwritten miscommunication. |
| 6 | Enable data-driven decisions | Centralized reporting on sales, inventory, staff performance, and customer behavior. |
| 7 | Support multi-outlet growth | Single platform to onboard and manage multiple branches under one ownership group. |
| 8 | Improve customer experience | Self-service ordering, real-time order tracking, loyalty rewards, and easy digital payments. |

---

## 3. Business Context (India Market)

- **GST Invoicing:** Restaurants in India must issue GST-compliant invoices (CGST + SGST for intra-state, IGST for inter-state where applicable), with proper GSTIN, HSN/SAC codes, and invoice numbering series as per CBIC rules.
- **UPI Payments:** UPI is the dominant digital payment rail in India (NPCI-governed). The platform must support UPI collection via QR codes and payment gateway aggregators (Razorpay, PhonePe Business, Paytm for Business).
- **FSSAI Compliance:** Food Safety and Standards Authority of India (FSSAI) license number display is mandatory on menus/invoices for licensed food businesses. The platform should support storing and displaying the FSSAI registration number on digital menus and printed bills.
- **Multi-lingual Market:** India's diverse linguistic landscape necessitates menu and interface support for Hindi and regional languages alongside English.
- **Price Sensitivity & Connectivity:** Tier-2/3 city restaurants may have variable internet connectivity; the platform should degrade gracefully and support offline/low-bandwidth modes where feasible.

---

## 4. Stakeholders

| Stakeholder | Role / Interest |
|-------------|------------------|
| Restaurant Owner / Admin | Primary business sponsor; needs ROI, control, and reporting. |
| Restaurant Manager | Day-to-day operations oversight, staff management. |
| Receptionist / Host | Manages table occupancy, walk-in queue, and reservations. |
| Chef / Kitchen Staff | Needs clear, fast, accurate order visibility. |
| Waiter / Service Staff | Needs real-time order-ready alerts and billing tools. |
| Customers (Diners) | End users ordering via QR, expect speed, accuracy, and easy payment. |
| Delivery Partners (optional) | Fulfil takeaway/delivery orders where in-house delivery is used. |
| Investors / Franchise Partners | Interested in scalability and multi-branch reporting. |
| Regulatory Bodies (GST, FSSAI) | Indirect stakeholders requiring compliance. |
| Payment Gateway Providers | Razorpay/PhonePe/Paytm — technical/business partners. |
| Software Vendor / Development Team | Builds and maintains the platform (Speshway). |

---

## 5. Scope

### 5.1 In-Scope

- QR-code based table-specific digital menu and ordering for customers
- Role-based applications for Admin, Receptionist, Chef, Waiter, Manager
- Kitchen Display System (KDS) for order management
- Table management, floor plan, and reservation/booking system
- Wait-token/queue management for walk-in customers
- GST-compliant billing and invoice generation
- UPI/QR and card payment integration
- Inventory and stock tracking linked to menu availability
- Loyalty programs, offers, and coupons
- Customer feedback and ratings
- Reporting and analytics dashboards for Admin/Manager
- Staff shift and attendance management
- Multi-branch support with centralized ownership view
- SMS/WhatsApp notifications for bookings, order status, and offers
- Multi-language menu support (English, Hindi, and regional languages)
- Printer/KOT (Kitchen Order Ticket) integration

### 5.2 Out-of-Scope (Phase 1)

- Full-scale third-party delivery aggregator marketplace (Swiggy/Zomato) integration — only interface/adapter design in Phase 1, live integration in later phase
- Accounting/ERP system integration (e.g., Tally, Zoho Books) — planned for future phase
- AI-based demand forecasting and dynamic pricing
- Native biometric attendance hardware integration
- Multi-currency support (India-only launch)
- Franchise royalty/billing automation between franchisor and franchisee

---

## 6. Assumptions

1. Restaurants have stable Wi-Fi/internet connectivity at the outlet for real-time features.
2. Tables will be fitted with printed QR codes unique to each table/seating unit.
3. Staff (chefs, waiters, receptionists) will be issued tablets/smartphones or use existing devices.
4. Restaurant owners possess a valid GSTIN and FSSAI license where legally required.
5. Customers have smartphones capable of scanning QR codes and using mobile browsers or UPI apps.
6. Payment gateway merchant accounts (Razorpay/PhonePe/Paytm) will be set up independently by the restaurant business.
7. Initial rollout targets single and small multi-branch restaurants (2-10 outlets); enterprise-scale chains are a later phase.

---

## 7. Constraints

| Type | Constraint |
|------|------------|
| Regulatory | Must comply with GST invoicing rules and, where applicable, FSSAI display requirements. |
| Technical | Must function on low-to-mid-range Android tablets commonly used in Indian restaurants. |
| Budget | Solution must remain cost-effective for small and mid-sized restaurant owners (SaaS pricing model). |
| Timeline | Phase 1 MVP targeted for delivery within an agreed sprint roadmap (see PRD/project plan). |
| Connectivity | Must handle intermittent network gracefully (retry queues, offline order caching where feasible). |
| Language | UI/menu content must support at least English + Hindi at MVP; extensible to regional languages. |

---

## 8. Success Metrics (KPIs)

| KPI | Target |
|-----|--------|
| Average order placement time (QR scan to order submit) | Under 90 seconds |
| Order accuracy rate | 99%+ (digital transmission, no manual re-entry) |
| Table turnover time reduction | 15-20% improvement vs. manual process |
| Digital payment adoption rate | 70%+ of bills settled via UPI/digital within 6 months |
| GST invoice compliance | 100% of bills auto-generated with correct tax breakup |
| Customer satisfaction (post-meal feedback rating) | Average rating ≥ 4.2/5 |
| Receptionist queue wait-time visibility | Real-time token status available to 100% of waiting customers |
| System uptime | 99.5% during business hours |
| Onboarding time for a new restaurant branch | Under 3 business days |

---

## 9. Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Staff resistance to digital adoption | Medium | Medium | Simple UI, training materials, phased rollout, local-language support. |
| Poor internet connectivity at outlet | Medium | High | Offline-tolerant order queueing, local network (LAN) fallback for KDS. |
| Payment gateway downtime | Low | High | Multiple gateway support (Razorpay + PhonePe/Paytm), cash fallback. |
| GST/tax rule changes | Medium | Medium | Configurable tax engine, regular compliance updates. |
| Data security / customer data breach | Low | High | Encryption, RBAC, audit logs, compliance with IT Act 2000 & DPDP Act. |
| Hardware failure (printers, tablets) | Medium | Low | Vendor support agreements, redundant device support. |
| Multi-branch data inconsistency | Low | Medium | Centralized cloud database with branch-level partitioning. |

---

## 10. ROI Rationale

**Cost Savings:**
- Reduced manual order-taking staff dependency (potential reallocation of 1-2 waiter roles per shift toward service quality).
- Reduced billing errors and revenue leakage from manual calculation mistakes.
- Reduced paper/printing costs via digital menus and digital receipts (optional).

**Revenue Growth:**
- Faster table turnover directly increases the number of covers served per service window, particularly during peak hours.
- Loyalty and coupon features increase repeat visits and average order value (upsell prompts during ordering).
- Real-time inventory-menu sync prevents lost sales from unavailable items being ordered and cancelled.

**Compliance Value:**
- Automated GST-compliant invoicing reduces audit risk and penalty exposure.
- Centralized digital records simplify tax filing and reconciliation.

**Payback Estimate:**
For a mid-sized restaurant (80-120 covers/day), improved turnover (15%) and reduced billing leakage (2-3% of revenue) typically offset SaaS subscription costs within 4-6 months, with continued net-positive ROI thereafter through operational efficiency and repeat-customer growth via loyalty features.

---

## 11. Approval

| Name | Role | Signature | Date |
|------|------|-----------|------|
| | Business Sponsor / Owner | | |
| | Project Manager | | |
| | Technical Lead | | |
