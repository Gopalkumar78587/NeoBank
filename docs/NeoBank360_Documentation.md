# NeoBank360 — Project Documentation

> A full-stack digital banking platform with separate Customer and Admin portals, built on Angular 21 (SPA) and Spring Boot 3 with MySQL and JWT authentication.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Objectives](#2-objectives)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Project Structure](#5-project-structure)
6. [Modules & Features](#6-modules--features)
7. [Authentication & Security](#7-authentication--security)
8. [Database Design](#8-database-design)
9. [API Reference](#9-api-reference)
10. [Frontend Conventions](#10-frontend-conventions)
11. [Backend Conventions](#11-backend-conventions)
12. [Real-Time Behavior](#12-real-time-behavior)
13. [Setup & Run Instructions](#13-setup--run-instructions)
14. [Known Gotchas & Design Decisions](#14-known-gotchas--design-decisions)
15. [Testing](#15-testing)
16. [Future Enhancements](#16-future-enhancements)

---

## 1. Introduction

**NeoBank360** is a unified digital banking platform that offers a complete online banking experience for customers and a powerful management console for administrators. It consolidates account management, transactions, bill payments, budgeting, loans, rewards, and analytics into a single secure web application.

The system is split into two role-based portals:

- **Customer Portal** — for end users to manage their banking activities.
- **Admin Portal** — for staff to oversee users, accounts, loans, and system health.

---

## 2. Objectives

- Provide a **single-portal, real-time** banking experience.
- Enforce strict **role-based access control** between customers and admins.
- Offer **atomic, traceable** money movement (transfers linked by reference IDs).
- Centralize **audit, analytics, and approval** workflows for admins.
- Maintain a clean, scalable codebase with clear separation of concerns.

---

## 3. Tech Stack

| Layer        | Technology                                                  |
|--------------|-------------------------------------------------------------|
| Frontend     | Angular 21 (standalone components), TypeScript, SCSS, RxJS  |
| Backend      | Spring Boot 3, Spring Security, Spring Data JPA, Hibernate  |
| Database     | MySQL 8                                                     |
| Auth         | JWT (HS256) + BCrypt                                        |
| Build / Dev  | Maven (BE), Angular CLI / esbuild (FE), Dev proxy           |

---

## 4. System Architecture

```
   ┌────────────────────────┐         ┌──────────────────────────┐         ┌──────────┐
   │   Angular 21 SPA       │  HTTPS  │   Spring Boot REST API   │   JPA   │  MySQL   │
   │  (Customer + Admin)    │ ──────► │  Controllers / Services  │ ──────► │          │
   │  auth.interceptor      │ ◄────── │  JwtAuthFilter + Security│ ◄────── │          │
   │  error.interceptor     │  JSON   │  @PreAuthorize roles     │         │          │
   └────────────────────────┘         └──────────────────────────┘         └──────────┘
            ▲                                    ▲
            │ proxy.conf.json (/api → :8080)     │ Stateless JWT (sessionStorage)
            └────────────────────────────────────┘
```

- The **frontend is pure CSR** (SSR fully disabled — see [Gotchas](#14-known-gotchas--design-decisions)).
- All API calls go through `core/config/api.config.ts`; **no hardcoded URLs**.
- Authentication is **stateless**: every request carries a JWT in `Authorization: Bearer <token>`.

---

## 5. Project Structure

### Repository Layout

```
NeoBank360/
├── Neo_bank_360_app/          # Spring Boot backend
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd
│   └── src/main/java/com/neobank/...
│       ├── controller/        # REST controllers
│       ├── service/           # Business logic
│       ├── repository/        # Spring Data JPA repos
│       ├── entity/            # JPA entities
│       ├── security/          # JwtAuthFilter, SecurityConfig
│       └── config/            # Initializers (e.g. LoanProductInitializer)
│
└── NeoBankF/                  # Angular 21 frontend
    ├── angular.json
    ├── proxy.conf.json
    ├── package.json
    └── src/app/
        ├── core/
        │   ├── config/        # api.config.ts (centralized endpoints)
        │   ├── services/      # auth, account, transaction, bill, ...
        │   ├── guards/        # roleGuard factory
        │   └── layouts/       # shells for customer/admin
        ├── auth/              # login, register, interceptors
        ├── dashboard/         # customer dashboard
        ├── account/           # accounts module
        ├── transaction/       # transfers + history
        ├── bills/             # bill pay + auto-pay
        ├── budget/            # budgeting
        ├── loans/             # loan products, applications
        ├── rewards/           # rewards engine
        ├── analytics/         # customer analytics
        └── admin/             # admin dashboard, approvals, logs, ...
```

---

## 6. Modules & Features

### 6.1 Customer Portal

| Module        | Capabilities                                                                 |
|---------------|------------------------------------------------------------------------------|
| Dashboard     | Overview of balances, recent transactions, quick actions                     |
| Accounts      | Create, freeze, activate, close, request closure, statements, balance history, per-transaction & daily limits |
| Transactions  | Credit / debit / **atomic transfers** between accounts                       |
| Bills         | Pay, schedule, auto-pay, recurring (weekly/monthly/quarterly/yearly), analytics |
| Budgets       | Per-category budgets with computed `spent`, icons, colors, periods           |
| Loans         | Browse products, apply, view applications + repayment schedule               |
| Rewards       | Earn and redeem rewards                                                      |
| Analytics     | Monthly and category-wise spending insights                                  |
| Profile       | View / update profile (full name)                                            |

### 6.2 Admin Portal

| Module             | Capabilities                                                                                      |
|--------------------|---------------------------------------------------------------------------------------------------|
| Admin Dashboard    | System-wide stats (users, accounts, transactions, etc.)                                           |
| User Management    | Browse and manage users                                                                           |
| Account Actions    | Freeze, activate, close, approve / reject closure requests                                        |
| Pending Approvals  | Closure requests + loan applications                                                              |
| Loan Decisions     | Approve / reject loan applications                                                                |
| Loan Products      | CRUD on loan products (Home, Car, Education, Personal auto-seeded by `LoanProductInitializer`)    |
| Advanced Analytics | System trends and aggregations                                                                    |
| Audit Logs         | Paginated system audit trail                                                                      |

---

## 7. Authentication & Security

### 7.1 Flow

1. User submits credentials to `POST /api/auth/login`.
2. Backend validates via `UserDetailsServiceImpl` + BCrypt.
3. On success, a JWT is issued with claims:
   - `sub` = email
   - `role` = `CUSTOMER` or `ADMIN`
   - `fullName`
4. Response: `{ token, role, fullName, email }`.
5. Frontend stores the token in **sessionStorage**.
6. `auth.interceptor.ts` attaches `Authorization: Bearer <token>` to every API request.
7. `JwtAuthFilter` validates the token, populates the `SecurityContext`.
8. Method/URL-level rules enforce role access.

### 7.2 Access Rules

| Path                | Rule                                                       |
|---------------------|------------------------------------------------------------|
| `/api/auth/**`      | `permitAll`                                                |
| `/api/customer/**`  | `authenticated()` + `@PreAuthorize("isAuthenticated()")`   |
| `/api/admin/**`     | `hasRole('ADMIN')` (strict)                                |
| `OPTIONS *`         | `permitAll` (CORS preflight)                               |

### 7.3 Frontend Guards

- `roleGuard('CUSTOMER')` and `roleGuard('ADMIN')` factory in `core/guards/auth-guard.ts`.
- Login response role is compared with the selected role to detect **role mismatch** (e.g., admin trying to log into customer portal).

### 7.4 Error Handling

`error.interceptor.ts` globally handles:

- **401 Unauthorized** → clears session, redirects to `/login`.
- **403 Forbidden** → redirects to the correct dashboard for the current role.

### 7.5 Defensive Defaults

- `JwtAuthFilter` defaults the `role` claim to `CUSTOMER` if missing/blank (handles stale tokens issued before the claim was added).
- `UserDetailsServiceImpl` defaults a user's role to `CUSTOMER` if null in DB (handles legacy records).

---

## 8. Database Design

> `application.properties` is gitignored. Assume **Hibernate `ddl-auto=update`** in development; manual migration scripts live in `src/main/resources/schema/`.

### 8.1 Core Tables

- **users** — `id`, `fullName`, `email` (unique), `passwordHash`, `role`
- **accounts** — `id`, `userId`, `accountNumber`, `balance`, `status`, `perTransactionLimit`, `dailyLimit`
- **transactions** — `id`, `accountId`, `type` (`CREDIT|DEBIT`), `amount`, `description`, `referenceId`, `timestamp`
- **bills** — `id`, `userId`, `accountId`, `category`, `amount`, `dueDate`, `paidAt`, `status`, `isRecurring`, `recurringFrequency`, `autoPayEnabled`, `referenceNumber`
- **budgets** — `id`, `userId`, `name` (col `budget_name`), `icon`, `color`, `period` (col `period_type`), legacy `category` (nullable)
- **loan_products** — `id`, `name`, `interestRate`, `allowedTenures` (CSV string e.g. `"12,24,36"`)
- **loan_applications** — `id`, `userId`, `productId`, `amount`, `tenure`, `status`
- **loan_accounts** — disbursed loans
- **loan_repayments** — schedule per loan account
- **audit_logs** — `id`, `actorEmail`, `action`, `target`, `timestamp`

### 8.2 Enums

- `BillStatus` — `PENDING`, `PAID`, `OVERDUE`, `SCHEDULED`, `FAILED`, `CANCELLED`
- `RecurringFrequency` — `WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`
- `TransactionType` — `CREDIT`, `DEBIT`

---

## 9. API Reference

### 9.1 Auth (`permitAll`)

- `POST /api/auth/register`
- `POST /api/auth/login` → `{ token, role, fullName, email }`

### 9.2 Customer (`/api/customer/**`)

**Profile**
- `GET  /api/customer/profile`
- `PUT  /api/customer/profile` *(updates fullName)*

**Accounts**
- `GET    /api/customer/accounts`
- `POST   /api/customer/accounts`
- `POST   /api/customer/accounts/{id}/freeze | /activate | /close | /request-closure`
- `GET    /api/customer/accounts/{id}/balance-history`
- `PUT    /api/customer/accounts/{id}/credit-limit | /debit-limit`
- `GET    /api/customer/accounts/{id}/statement?month=&year=`

**Transactions**
- `GET  /api/customer/accounts/{id}/transactions`
- `POST /api/customer/accounts/{id}/transactions?type=&amount=&description=` *(OTP fully removed)*
- `POST /api/customer/accounts/{accountId}/transactions/transfer?toAccountNumber=&amount=&note=`
  *(atomic: debits source, credits destination by account number, linked via `referenceId`)*

**Bills**
- `GET  /api/customer/bills?status=`
- `POST /api/customer/bills`
- `POST /api/customer/bills/{id}/pay?accountId=`
- `PUT  /api/customer/bills/{id}/auto-pay?enabled=`
- `PUT  /api/customer/bills/{id}/status?status=`
- `GET  /api/customer/bills/analytics`

**Budgets**
- `GET    /api/customer/budgets` *(returns FE-shaped objects with computed `spent`)*
- `POST   /api/customer/budgets`
- `PUT    /api/customer/budgets/{id}`
- `DELETE /api/customer/budgets/{id}`

**Analytics**
- `GET /api/customer/analytics/monthly`
- `GET /api/customer/analytics/category`

### 9.3 Admin (`/api/admin/**`, `hasRole('ADMIN')`)

- `GET  /api/admin/stats`
- `GET  /api/admin/audit-logs?page=&size=` *(paginated envelope)*
- `GET  /api/admin/accounts`
- `POST /api/admin/accounts/{id}/freeze | /activate | /close | /approve-closure | /reject-closure`
- `GET  /api/admin/accounts/pending-closures`

---

## 10. Frontend Conventions

- **Standalone components only** — no NgModules.
- **All HTTP calls** go through `core/config/api.config.ts`:
  - `API.customer.*`, `API.admin.*`, `API.auth.*`
  - **Never** hardcode `http://localhost:8080`.
- `environment.apiUrl = '/api'` — proxied to `:8080` in dev; same-origin in prod.
- **Auth interceptor** attaches JWT from `sessionStorage`.
- **Error interceptor** centralizes 401/403 handling.
- **Routing** uses `roleGuard('CUSTOMER' | 'ADMIN')` factory.
- **Real-time** modules: `interval(10000).pipe(switchMap(...))`.

---

## 11. Backend Conventions

- Layered architecture: `Controller → Service → Repository → Entity`.
- `@PreAuthorize` for method-level rules; `SecurityConfig` for URL-level rules.
- `JwtAuthFilter` parses the token once per request; defaults role to `CUSTOMER` if missing.
- `UserDetailsServiceImpl` defaults a null DB role to `CUSTOMER`.
- `LoanProductInitializer` seeds default products (Home, Car, Education, Personal) on startup if missing.
- `OPTIONS` preflight is explicitly permitted.

---

## 12. Real-Time Behavior

| Component       | Strategy                            |
|-----------------|-------------------------------------|
| Bills           | 10-second polling                   |
| Budget          | 10-second polling                   |
| Rewards         | 10-second polling                   |
| Transactions    | 10-second polling on selected account |
| Dashboard       | Load on init                        |
| Accounts        | Load on init                        |
| Admin pages     | Load on init                        |
| Analytics       | Load on init                        |

Implemented as:

```ts
interval(10_000)
  .pipe(switchMap(() => this.service.getData()))
  .subscribe(data => this.data = data);
```

---

## 13. Setup & Run Instructions

### 13.1 Prerequisites

- Node.js 20+ and npm
- Java 17+ and Maven (or use the bundled `mvnw`)
- MySQL 8 running locally on `:3306`

### 13.2 Backend

```powershell
cd Neo_bank_360_app
# create application.properties with your DB creds, e.g.:
#   spring.datasource.url=jdbc:mysql://localhost:3306/neobank360
#   spring.datasource.username=root
#   spring.datasource.password=...
#   spring.jpa.hibernate.ddl-auto=update
#   jwt.secret=...
./mvnw spring-boot:run    # Windows: .\mvnw.cmd spring-boot:run
```

Backend runs on **http://localhost:8080**.

### 13.3 Frontend

```powershell
cd NeoBankF
npm install
npm start                  # ng serve --proxy-config proxy.conf.json
```

Frontend runs on **http://localhost:4200** and proxies `/api/*` to `:8080`.

### 13.4 First Use

1. Register a customer at `/register`.
2. Log in.
3. To create an admin, insert a user in `users` with `role='ADMIN'` and a BCrypt-hashed password, or promote an existing user.

---

## 14. Known Gotchas & Design Decisions

- **SSR fully disabled.** `angular.json` no longer has `server`, `outputMode`, or `ssr` keys, and `provideClientHydration` was removed from `app.config.ts`. SSR was caching responses (with no JWT) via `TransferState`, causing dashboards to render empty until a second navigation. App is now full-CSR.
- **OTP fully removed** from both FE flows and BE checks. `TransactionService.createTransaction` no longer calls `otpService.isOtpVerified`. `BillController.pay` no longer requires `otp`. `OtpController` / `OtpService` remain in the codebase but are unused.
- **Atomic transfers** — `POST /api/customer/accounts/{accountId}/transactions/transfer?toAccountNumber=&amount=&note=` debits the source, credits the destination (looked up by account number), and links both legs via a shared `referenceId`. Frontend uses `txService.transfer()`.
- **Loan tenures** stored as CSV strings (`"12,24,36"`) on the entity; `loan.service.ts.getProducts()` normalizes them into `number[]` on the FE.
- **Stale JWTs** missing the `role` claim are tolerated — `JwtAuthFilter` defaults to `CUSTOMER`.
- **Legacy users** with null `role` in DB are tolerated — `UserDetailsServiceImpl` defaults to `CUSTOMER`.
- **`application.properties` is gitignored** — DB creds and JWT secret must be configured locally.

---

## 15. Testing

- Backend tests: `Neo_bank_360_app/src/test/java/...` — run with `./mvnw test`.
- Frontend tests: `NeoBankF/src/**/*.spec.ts` — run with `npm test`.

---

## 16. Future Enhancements

- Replace polling with **WebSockets / SSE** for true push updates.
- **Refresh-token rotation** + short-lived access tokens.
- **2FA** via TOTP or WebAuthn.
- **Dockerize** backend + frontend; CI/CD pipeline (GitHub Actions).
- **Mobile app** (Angular + Capacitor or React Native).
- **AI-powered** spending insights and fraud detection.
- **i18n** (multi-language) and refined dark mode.
- **Rate limiting** and API gateway in front of the backend.

---

*End of document.*
