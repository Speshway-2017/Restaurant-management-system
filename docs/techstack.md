# Technology Stack Document
## Restaurant Management Platform — MERN + Flutter Architecture

**Document Version:** 1.0
**Date:** 2026-08-05

This document defines the end-to-end technology stack for the Restaurant Management Platform, built on the **MERN stack (MongoDB, Express.js, React.js, Node.js)** for web/backend and **Flutter** for cross-platform mobile applications (Waiter, Chef/KDS, and optional Customer native app).

---

## 1. Architecture Layer Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Web Frontend (Admin Dashboard, Receptionist Web, Customer PWA) | React.js, Redux Toolkit / Zustand, TailwindCSS | Responsive, component-driven UI for dashboards and the customer ordering PWA |
| Mobile Apps (Waiter, Chef/KDS, Customer optional) | Flutter (Dart), Riverpod / Bloc | Single codebase for Android + iOS native apps with high performance |
| Backend API | Node.js, Express.js | RESTful API server handling business logic, auth, orchestration |
| Database | MongoDB, Mongoose (ODM) | Flexible document store suited to menu/order variability across restaurants |
| Caching / Real-time Queue State | Redis | Session storage, token/queue state, pub-sub backing for Socket.io scaling |
| Real-time Communication | Socket.io | Live order status updates, KDS push, queue/token updates, waiter alerts |
| Payments | Razorpay (primary), UPI Deep Links, PhonePe/Paytm Business APIs | GST-ready, India-first payment collection |
| Notifications | Firebase Cloud Messaging (push), Twilio / WhatsApp Business API (SMS/WhatsApp) | Multi-channel guest and staff notifications |
| Authentication & Authorization | JWT (access + refresh tokens), RBAC middleware | Secure, stateless auth across web and mobile clients |
| QR Code Generation | `qrcode` (npm package) | Table-specific QR code generation for menu access |
| Charts & Analytics (Admin Dashboard) | Recharts / Chart.js | Visual sales, inventory, and staff performance dashboards |
| File Storage | AWS S3 / Cloudinary | Menu images, restaurant logos, KOT/invoice PDFs |
| API Architecture | REST (versioned: `/api/v1/...`) | Predictable, cacheable, well-understood integration surface |
| Infrastructure / DevOps | Docker, Nginx, AWS (EC2/ECS) or GCP, GitHub Actions (CI/CD) | Containerized, reproducible deployments with automated pipelines |

---

## 2. Frontend (Web) — React.js Ecosystem

**Used for:** Admin Dashboard, Receptionist Web/Tablet App, Customer PWA (mobile web ordering)

| Technology | Rationale |
|-----------|-----------|
| React.js | Component reusability across Admin, Receptionist, and Customer web surfaces; large ecosystem and hiring pool in India. |
| Redux Toolkit / Zustand | Redux Toolkit for complex Admin dashboard state (multi-branch, reports); lighter Zustand for simpler Customer PWA cart/session state where boilerplate isn't justified. |
| TailwindCSS | Utility-first styling enables fast, consistent, responsive UI development matching the design system across multiple role-specific interfaces. |
| React Router | Client-side routing for dashboard and PWA navigation. |
| PWA tooling (Workbox / Vite PWA plugin) | Enables installable, offline-tolerant customer menu experience without app-store friction. |
| React Query / TanStack Query | Server-state caching and synchronization for dashboard data fetching, reducing redundant API calls. |

---

## 3. Mobile — Flutter Ecosystem

**Used for:** Waiter App, Chef/KDS Tablet App, optional Customer native app, Delivery Staff App

| Technology | Rationale |
|-----------|-----------|
| Flutter (Dart) | Single codebase for Android + iOS; strong performance for real-time UI updates (order alerts) critical for Waiter/Chef workflows; strong Android support matching India's device landscape. |
| Riverpod / Bloc | Predictable, testable state management for real-time order/queue state synced via Socket.io; Riverpod for simpler reactive screens, Bloc for complex multi-step flows (e.g., billing/split-bill). |
| flutter_socket_io / socket_io_client (Dart) | Real-time channel client matching backend Socket.io server. |
| firebase_messaging (FCM) | Push notification delivery to Waiter/Chef/Delivery apps. |
| Local notifications plugin | In-app alert sounds/vibration for "Order Ready" and new-order events, essential for noisy kitchen environments. |
| flutter_secure_storage | Secure storage of JWT tokens on device. |

---

## 4. Backend — Node.js + Express.js

| Component | Rationale |
|-----------|-----------|
| Node.js (LTS) | Non-blocking I/O well-suited to high-concurrency real-time order flows; single language (JavaScript/TypeScript) across frontend and backend eases team velocity. |
| Express.js | Lightweight, well-understood framework for structuring REST APIs, middleware (auth, validation, rate-limiting). |
| TypeScript (recommended) | Type safety across a multi-role, multi-schema domain (orders, menus, users, payments) reduces runtime errors in a business-critical billing system. |
| Middleware: Helmet, CORS, express-rate-limit | Baseline security hardening for public-facing customer ordering endpoints. |
| Validation: Joi / Zod | Request payload validation, especially critical for order submission and payment endpoints. |

---

## 5. Database Layer

| Component | Rationale |
|-----------|-----------|
| MongoDB | Document model naturally fits variable menu structures (items with differing customization schemas), order documents with nested line items, and multi-branch/multi-tenant partitioning via branch/tenant IDs. |
| Mongoose (ODM) | Schema validation and modeling discipline on top of MongoDB's flexibility; supports hooks for audit logging. |
| Redis | (1) Caching frequently-read menu data to reduce DB load during peak ordering; (2) storing live queue/token state and table status for fast reads/writes; (3) Socket.io adapter for horizontal scaling of real-time connections across multiple server instances. |
| MongoDB Atlas (managed hosting, recommended) | Reduces operational overhead, built-in backups, and multi-region support for scaling across Indian cities. |

---

## 6. Real-Time Layer

| Component | Rationale |
|-----------|-----------|
| Socket.io (server + client) | Bi-directional, low-latency communication for: order status updates (customer), new-order push (KDS), order-ready alerts (waiter), queue/token position updates (receptionist/customer). Fallback to long-polling ensures reliability on weaker connections. |
| Redis Adapter for Socket.io | Enables Socket.io to scale across multiple Node.js instances/containers in production, essential for multi-branch, multi-instance deployment. |

---

## 7. Payments

| Component | Rationale |
|-----------|-----------|
| Razorpay (primary gateway) | Leading India-focused payment gateway with strong UPI, card, and wallet support, and developer-friendly APIs; supports dynamic QR generation for table-side UPI payments. |
| PhonePe Business / Paytm for Business (secondary/alternative) | Redundancy and merchant preference flexibility; some restaurant owners have existing relationships with specific providers. |
| UPI Deep Links / Dynamic QR | Enables direct scan-and-pay flows without redirect friction, matching Indian consumer payment habits. |
| Webhook-based settlement confirmation | Ensures order/table billing status only updates on verified payment confirmation, avoiding race conditions. |

---

## 8. Notifications

| Component | Rationale |
|-----------|-----------|
| Firebase Cloud Messaging (FCM) | Cross-platform push notifications for Flutter apps (Waiter, Chef, Delivery, optional Customer app). |
| Twilio / WhatsApp Business API | SMS and WhatsApp are the dominant confirmation/reminder channels in India for bookings, order-ready alerts, and promotional offers — higher open rates than email. |
| Email (SendGrid, optional) | Secondary channel for Admin-level reports and invoices where applicable. |

---

## 9. Authentication & Security

| Component | Rationale |
|-----------|-----------|
| JWT (Access + Refresh Tokens) | Stateless auth suited to distributed web + mobile clients; short-lived access tokens with refresh rotation reduce compromise window. |
| RBAC Middleware | Central enforcement of the Role-to-Module Access Matrix (see `platform.md`) at the API layer, not just UI. |
| bcrypt / argon2 | Password hashing for staff accounts. |
| HTTPS/TLS everywhere | Mandatory for all API traffic, especially payment and PII-related endpoints. |
| Rate limiting & input sanitization | Protects public customer-facing ordering endpoints from abuse. |

---

## 10. QR Code Generation

| Component | Rationale |
|-----------|-----------|
| `qrcode` (npm package) | Server-side generation of table-specific QR codes encoding a signed table/session identifier, printable for physical table placement; regenerable if compromised. |

---

## 11. Admin Dashboard Visualization

| Component | Rationale |
|-----------|-----------|
| Recharts | React-native charting library, good fit with the React dashboard for sales trends, category breakdowns. |
| Chart.js (alternative/supplement) | Useful for specific chart types (heatmaps, gauges) not natively well-suited to Recharts. |

---

## 12. API Architecture

| Principle | Detail |
|-----------|--------|
| REST-based | `/api/v1/...` resource-oriented endpoints (menus, orders, tables, bookings, users, payments). |
| Versioning | URL-based versioning (`/v1`, `/v2`) to allow non-breaking evolution as mobile app clients update on different schedules. |
| Consistent response envelope | Standardized `{ success, data, error }` shape across all endpoints for predictable client handling. |
| Pagination & filtering | Cursor/offset-based pagination on list endpoints (orders, reports) to handle high-volume branches. |

---

## 13. File Storage

| Component | Rationale |
|-----------|-----------|
| AWS S3 / Cloudinary | Stores menu item images, restaurant logos, generated invoice/KOT PDFs. Cloudinary additionally offers on-the-fly image optimization/transformation, useful for serving appropriately sized images to varying device/network conditions across India. |

---

## 14. Infrastructure & DevOps

| Component | Rationale |
|-----------|-----------|
| Docker | Containerizes Node.js API, ensuring consistent environments across dev/staging/production. |
| Nginx | Reverse proxy, TLS termination, load balancing across API instances, static asset serving for the React web apps. |
| AWS (EC2/ECS/RDS-equivalent) or GCP | Cloud infrastructure with Mumbai/India region availability (AWS ap-south-1) for low-latency access to Indian users. |
| GitHub Actions (CI/CD) | Automated build, test, and deployment pipelines for backend, web frontend, and Flutter app builds. |
| MongoDB Atlas | Managed database with automated backups and monitoring. |
| Redis Cloud / self-hosted Redis on ECS | Managed or containerized caching/pub-sub layer. |
| Monitoring: Prometheus/Grafana or a hosted APM (e.g., New Relic) | Operational visibility into API latency, error rates, and real-time connection health. |
| Logging: Winston/Pino + centralized log aggregation (e.g., ELK or hosted equivalent) | Structured logs for debugging and audit trail support. |

---

## 15. Summary: Why MERN + Flutter

- **MERN** provides a unified JavaScript/TypeScript ecosystem across the web frontend and backend, accelerating development velocity for a small-to-mid-sized product team while remaining well-supported by the Indian developer talent pool.
- **MongoDB's** flexible schema suits the inherently variable nature of restaurant menus, customizations, and order structures better than a rigid relational schema, while still supporting structured reporting via aggregation pipelines.
- **Flutter** delivers native-quality, real-time-responsive mobile experiences for the latency-sensitive Waiter and Chef/KDS roles from a single codebase, reducing the cost of maintaining separate iOS/Android native apps — while matching India's Android-dominant device landscape.
- **Socket.io + Redis** together provide the real-time backbone (order status, KDS updates, queue/token updates) that is the core operational value proposition of the platform.
- **Razorpay/UPI-first payments** and **WhatsApp/SMS-first notifications** directly reflect Indian consumer and business payment/communication norms, rather than defaulting to card/email-first assumptions common in Western-market stacks.
