# NeoBank360 — Presentation Outline

> Copy each slide's content into PowerPoint. Image placeholders are marked **[IMAGE: ...]** — add screenshots/diagrams there.

---

## Slide 1 — Title

**NeoBank360**
A Full-Stack Digital Banking Platform

- Presented by: *<Your Name>*
- Date: *<DD/MM/YYYY>*
- Tech Stack: Angular 21 • Spring Boot • MySQL • JWT

**[IMAGE: NeoBank360 logo / hero banner]**

---

## Slide 2 — Agenda

1. Problem & Motivation
2. Project Overview
3. Architecture
4. Tech Stack
5. Key Features (Customer + Admin)
6. Security Model
7. Database Design
8. Demo Walkthrough
9. Challenges & Learnings
10. Future Scope

---

## Slide 3 — Problem Statement

- Traditional banks rely on legacy UIs and siloed services.
- Customers need a single, real-time portal for accounts, payments, bills, loans, budgets, and rewards.
- Admins need centralized control over users, accounts, loan approvals, audit logs, and analytics.

**Goal:** Build a unified, secure, role-based digital banking experience — *NeoBank360*.

---

## Slide 4 — Project Overview

NeoBank360 is a **two-portal banking platform**:

- **Customer Portal** — manage accounts, transfer funds, pay bills, track budgets, apply for loans, earn rewards.
- **Admin Portal** — manage users, freeze/close accounts, approve loans, view analytics, audit system logs.

Single codebase, role-based routing, fully real-time dashboards.

**[IMAGE: High-level portal split diagram — Customer | Admin]**

---

## Slide 5 — System Architecture

```
┌──────────────┐     HTTPS / JWT     ┌──────────────────┐     JPA      ┌──────────┐
│ Angular 21   │  ─────────────────► │  Spring Boot API │ ───────────► │  MySQL   │
│ (SPA, CSR)   │ ◄───────────────── │  (REST, Security)│ ◄─────────── │          │
└──────────────┘     JSON / 200/4xx  └──────────────────┘              └──────────┘
       │                                       │
       │ proxy.conf.json (/api → :8080)        │ JwtAuthFilter + role-based @PreAuthorize
       ▼                                       ▼
   auth.interceptor          UserDetailsServiceImpl + BCrypt
```

**[IMAGE: Replace ASCII with a clean architecture diagram]**

---

## Slide 6 — Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Frontend     | Angular 21 (standalone components), TypeScript, SCSS |
| Backend      | Spring Boot 3, Spring Security, Spring Data JPA |
| Database     | MySQL 8                                         |
| Auth         | JWT (HS256), BCrypt password hashing            |
| Build        | Maven (BE), Angular CLI / esbuild (FE)          |
| Dev Proxy    | `proxy.conf.json` → `/api` → `localhost:8080`   |

---

## Slide 7 — Frontend Structure

- **Standalone components** (no NgModules)
- **Routing** with `roleGuard('CUSTOMER' | 'ADMIN')`
- **HTTP** via `auth.interceptor.ts` (attaches JWT) + `error.interceptor.ts` (401/403 handling)
- **Centralized API** in `core/config/api.config.ts` — no hardcoded URLs
- **Real-time** dashboards via RxJS `interval()` + `switchMap` (10s polling)
- **Pure SPA** — SSR fully disabled (fixes empty-data-on-first-render)

**[IMAGE: Angular folder tree screenshot from VS Code]**

---

## Slide 8 — Backend Structure

- Layered: **Controller → Service → Repository → Entity**
- `JwtAuthFilter` parses token, extracts email + role claim (defaults to CUSTOMER)
- `UserDetailsServiceImpl` loads user; role defaults to CUSTOMER if null (legacy safety)
- `LoanProductInitializer` seeds default loan products on startup
- `OPTIONS` preflight permitted explicitly in `SecurityConfig`

**[IMAGE: Spring Boot package diagram]**

---

## Slide 9 — Security Model

- **Stateless JWT** stored in `sessionStorage`
- **Role-based access**:
  - `/api/auth/**` → permitAll
  - `/api/customer/**` → `authenticated()` + `@PreAuthorize("isAuthenticated()")`
  - `/api/admin/**` → `hasRole('ADMIN')`
- **JWT payload**: `sub=email`, `role=CUSTOMER|ADMIN`, `fullName`
- **Frontend role-mismatch detection**: login validates `res.role === selectedRole`
- **Passwords**: BCrypt-hashed
- **Global 401/403 handler** clears session + redirects

**[IMAGE: Auth/JWT flow diagram — login → token → protected request]**

---

## Slide 10 — Customer Features

- **Dashboard** — balances, recent transactions, quick actions
- **Accounts** — create, freeze, activate, close, statements, balance history, limits
- **Transactions** — credit/debit + **atomic transfers** (debit source + credit dest, linked by `referenceId`)
- **Bills** — pay, schedule, auto-pay, recurring (weekly/monthly/quarterly/yearly), analytics
- **Budgets** — set per category with computed `spent`, icons, colors, periods
- **Loans** — browse products, apply, view applications + repayment schedule
- **Rewards** — earn/redeem
- **Analytics** — monthly & category spending

**[IMAGE: Customer dashboard screenshot]**

---

## Slide 11 — Admin Features

- **Admin Dashboard** — system-wide stats
- **User Management** — view/manage users
- **Account Actions** — freeze, activate, close, approve/reject closure requests
- **Pending Approvals** — closure requests, loan applications
- **Loan Decisions** — approve/reject loan applications
- **Loan Products** — create/manage products (default Home/Car/Education/Personal auto-seeded)
- **Advanced Analytics** — system trends
- **Audit Logs** — paginated, search/filter

**[IMAGE: Admin dashboard screenshot]**

---

## Slide 12 — Key API Endpoints

**Auth**
- `POST /api/auth/login` → `{token, role, fullName, email}`
- `POST /api/auth/register`

**Customer**
- `GET/PUT /api/customer/profile`
- `GET/POST /api/customer/accounts` + `/{id}/freeze|activate|close|statement`
- `POST /api/customer/accounts/{id}/transactions/transfer?toAccountNumber=&amount=&note=`
- `GET/POST /api/customer/bills` + `/{id}/pay`, `/{id}/auto-pay`
- `GET/POST/PUT/DELETE /api/customer/budgets`
- `GET /api/customer/analytics/monthly|category`

**Admin**
- `GET /api/admin/stats`
- `GET /api/admin/audit-logs?page=&size=`
- `GET /api/admin/accounts` + `/{id}/freeze|activate|close|approve-closure|reject-closure`

---

## Slide 13 — Database Schema (Core Tables)

- `users` — id, fullName, email, passwordHash, role
- `accounts` — accountNumber, balance, status, perTransactionLimit, dailyLimit
- `transactions` — type (CREDIT/DEBIT), amount, referenceId, timestamp
- `bills` — category, paidAt, isRecurring, recurringFrequency, autoPayEnabled
- `budgets` — name, icon, color, period, spent (computed)
- `loan_products`, `loan_applications`, `loan_accounts`, `loan_repayments`
- `audit_logs`

**[IMAGE: ER diagram]**

---

## Slide 14 — Real-Time Behavior

| Component       | Refresh Strategy        |
|-----------------|-------------------------|
| Bills           | 10s polling             |
| Budget          | 10s polling             |
| Rewards         | 10s polling             |
| Transactions    | 10s polling (selected account) |
| Dashboard       | Load on init            |
| Accounts/Admin  | Load on init            |

Implemented via RxJS `interval(10000).pipe(switchMap(...))`.

---

## Slide 15 — Demo Walkthrough

1. **Register** a customer → auto-login
2. **Create** an account → view balance
3. **Transfer** funds between accounts (atomic)
4. **Pay a bill** → enable auto-pay
5. **Set a budget** → see spent vs limit update
6. **Apply for a loan** → view in admin's *Pending Approvals*
7. **Admin login** → approve loan → freeze a flagged account
8. **Check audit logs** + analytics

**[IMAGE: Demo screenshots or GIFs]**

---

## Slide 16 — Challenges & Solutions

| Challenge                                          | Solution                                                      |
|----------------------------------------------------|---------------------------------------------------------------|
| Empty dashboards on first navigation (SSR cache)   | Removed `provideClientHydration`; disabled SSR entirely        |
| Stale JWTs missing `role` claim                    | `JwtAuthFilter` defaults to CUSTOMER if claim missing          |
| Legacy users with null DB role                     | `UserDetailsServiceImpl` defaults role to CUSTOMER             |
| Cross-account transfer atomicity                   | Single transactional endpoint debits + credits with `referenceId` linkage |
| Loan tenures stored as CSV string                  | `loan.service.ts.getProducts()` parses `"12,24,36"` → `number[]` |
| OTP friction in dev/demo                           | OTP fully removed from FE flows + BE checks                    |

---

## Slide 17 — What I Learned

- Designing **role-based, stateless** REST APIs with Spring Security.
- Managing **JWT lifecycle** end-to-end (issue, attach, refresh, expire).
- Building **standalone Angular** apps with interceptors, guards, and reactive polling.
- Handling **backward compatibility** for evolving schemas/tokens.
- Debugging **SSR vs CSR** trade-offs in Angular.

---

## Slide 18 — Future Scope

- WebSockets / SSE for true push updates (replace polling)
- Refresh-token rotation + short-lived access tokens
- 2FA (TOTP / WebAuthn)
- Dockerize backend + frontend, CI/CD pipeline
- Mobile app (Angular + Capacitor or React Native)
- AI-powered spending insights & fraud detection
- Internationalization (i18n) + dark mode polish

---

## Slide 19 — Tech Highlights / Stats

- **~XX** Angular components
- **~XX** REST endpoints
- **~XX** database tables
- **2** user roles (Customer / Admin)
- **100%** stateless JWT auth
- **Real-time** dashboards across 4+ modules

*(Fill in counts before presenting.)*

---

## Slide 20 — Thank You / Q&A

**NeoBank360**
*Built with Angular 21 + Spring Boot + MySQL*

- GitHub: *<repo link>*
- Email: *<your email>*

**Questions?**

**[IMAGE: Closing visual / logo]**
