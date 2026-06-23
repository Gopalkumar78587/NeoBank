# 🏦 NeoBank360

> A full-stack **digital banking platform** with separate **Customer** and **Admin** portals — built on **Angular 21 (SPA)** and **Spring Boot 3** with **MySQL** and **JWT** authentication.

<p align="left">
  <img alt="Angular"     src="https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white">
  <img alt="SpringBoot"  src="https://img.shields.io/badge/Spring%20Boot-3-6DB33F?logo=springboot&logoColor=white">
  <img alt="Java"        src="https://img.shields.io/badge/Java-17%2B-007396?logo=openjdk&logoColor=white">
  <img alt="MySQL"       src="https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white">
  <img alt="TypeScript"  src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white">
  <img alt="License"     src="https://img.shields.io/badge/License-Educational-blueviolet">
</p>

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [System Architecture](#-system-architecture)
5. [Repository Structure](#-repository-structure)
6. [Prerequisites](#-prerequisites)
7. [Getting Started](#-getting-started)
8. [Configuration](#-configuration)
9. [Running the Apps](#-running-the-apps)
10. [API Overview](#-api-overview)
11. [Database Schema](#-database-schema)
12. [Security](#-security)
13. [Frontend Conventions](#-frontend-conventions)
14. [Backend Conventions](#-backend-conventions)
15. [Testing](#-testing)
16. [Troubleshooting](#-troubleshooting)
17. [Roadmap](#-roadmap)
18. [Documentation](#-documentation)
19. [Author](#-author)
20. [License](#-license)

---

## 🚀 Overview

**NeoBank360** is a unified online banking experience that consolidates account management, transactions, bill payments, budgeting, loans, rewards, and analytics into a single secure web app, with a powerful admin console for staff oversight.

- **Customer Portal** — manage accounts, transfer money, pay bills, set budgets, apply for loans, earn rewards, and view analytics.
- **Admin Portal** — manage users, approve account closures and loans, configure loan products, view system analytics and audit logs.

---

## ✨ Key Features

### 👤 Customer
- 🔐 Secure JWT authentication & registration
- 💳 Multi-account management (open, freeze, activate, close, request closure)
- 💸 **Atomic** transfers between accounts with reference IDs
- 📜 Transaction history, statements, balance history
- 🧾 Bill pay — one-time, scheduled, auto-pay & recurring (weekly/monthly/quarterly/yearly)
- 📊 Per-category budgets with computed spend
- 🏠 Loan products (Home / Car / Education / Personal), applications & repayment schedules
- 🎁 Rewards earning & redemption engine
- 📈 Spending analytics (monthly & category-wise)
- 👤 Profile management

### 🛡️ Admin
- 📊 System-wide dashboard (users, accounts, transactions, loans)
- 👥 User management
- ❄️ Account actions — freeze, activate, close, approve/reject closure requests
- ⏳ Pending approvals queue (closures + loan applications)
- ✅ Loan decisions (approve / reject)
- 🧮 Loan product CRUD (auto-seeded by `LoanProductInitializer`)
- 📉 Advanced analytics
- 🪵 Paginated audit logs

---

## 🧰 Tech Stack

| Layer        | Technology                                                            |
|--------------|-----------------------------------------------------------------------|
| Frontend     | **Angular 21** (standalone components), TypeScript 5.8, SCSS, RxJS, Chart.js / ng2-charts |
| Backend      | **Spring Boot 3**, Spring Security, Spring Data JPA, Hibernate        |
| Database     | **MySQL 8**                                                           |
| Auth         | **JWT (HS256)** + BCrypt password hashing                             |
| Build / Dev  | Maven (BE), Angular CLI / esbuild (FE), Dev proxy (`/api → :8080`)    |

---

## 🏗️ System Architecture

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

- **Pure CSR** frontend (SSR disabled by design).
- **Centralized** API endpoints in `core/config/api.config.ts` — no hardcoded URLs.
- **Stateless** auth — every request carries `Authorization: Bearer <token>`.

---

## 📁 Repository Structure

```
NeoBank360/
├── Neo_bank_360_app/           # Spring Boot backend
│   ├── pom.xml
│   ├── mvnw / mvnw.cmd
│   └── src/main/
│       ├── java/com/neobank/
│       │   ├── controller/     # REST controllers
│       │   ├── service/        # Business logic
│       │   ├── repository/     # Spring Data JPA repos
│       │   ├── entity/         # JPA entities
│       │   ├── security/       # JwtAuthFilter, SecurityConfig
│       │   └── config/         # Initializers (e.g. LoanProductInitializer)
│       └── resources/
│           └── schema/         # SQL migration scripts
│
├── NeoBankF/                   # Angular 21 frontend
│   ├── angular.json
│   ├── proxy.conf.json
│   ├── package.json
│   └── src/app/
│       ├── core/               # config, services, guards, layouts
│       ├── auth/               # login, register, interceptors
│       ├── landing/            # public landing page
│       ├── dashboard/          # customer dashboard
│       ├── account/            # accounts module
│       ├── transaction/        # transfers + history
│       ├── bills/              # bill pay + auto-pay
│       ├── budget/             # budgeting
│       ├── loans/              # loan products, applications
│       ├── rewards/            # rewards engine
│       ├── analytics/          # customer analytics
│       └── admin/              # admin dashboard, approvals, logs
│
└── docs/                       # Documentation & presentation
    ├── NeoBank360_Documentation.md
    └── NeoBank360_Presentation.md
```

---

## ✅ Prerequisites

| Tool          | Version    |
|---------------|------------|
| Node.js       | ≥ 20.x     |
| npm           | ≥ 10.x     |
| Angular CLI   | 21.x (`npm i -g @angular/cli`) |
| JDK           | 17+        |
| Maven         | 3.9+ (or use `mvnw`) |
| MySQL         | 8.x running locally |
| Git           | latest     |

---

## ⚙️ Getting Started

```bash
# 1) Clone
git clone <your-repo-url> NeoBank360
cd NeoBank360

# 2) Backend deps
cd Neo_bank_360_app
./mvnw clean install            # Linux / macOS
mvnw.cmd clean install          # Windows

# 3) Frontend deps
cd ../NeoBankF
npm install
```

---

## 🔧 Configuration

### Backend — `Neo_bank_360_app/src/main/resources/application.properties`

> This file is **gitignored**. Create it locally with values like below.

```properties
# Server
server.port=8080

# MySQL
spring.datasource.url=jdbc:mysql://localhost:3306/neobank360?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# JWT
app.jwt.secret=replace-with-a-long-random-secret-key-min-32-chars
app.jwt.expiration-ms=86400000
```

### Frontend — `NeoBankF/proxy.conf.json`

Already configured to forward `/api` to the backend on `http://localhost:8080`. Modify only if your backend port changes.

---

## ▶️ Running the Apps

Open **two terminals**:

### Terminal 1 — Backend (port `8080`)
```bash
cd Neo_bank_360_app
./mvnw spring-boot:run          # or: mvnw.cmd spring-boot:run
```

### Terminal 2 — Frontend (port `4200`)
```bash
cd NeoBankF
npm start                       # ng serve with proxy
```

Then open: **http://localhost:4200**

| Role     | How to access                                                 |
|----------|---------------------------------------------------------------|
| Customer | Register a new account on `/register`, then login on `/login` |
| Admin    | Use seeded admin credentials (see backend initializer) and select **Admin** on login |

---

## 🔌 API Overview

All endpoints are prefixed with `/api`.

| Group       | Base path             | Access                |
|-------------|-----------------------|-----------------------|
| Auth        | `/api/auth/**`        | `permitAll`           |
| Customer    | `/api/customer/**`    | Authenticated         |
| Admin       | `/api/admin/**`       | `ROLE_ADMIN` only     |

Representative endpoints:

```
POST   /api/auth/login                 # → { token, role, fullName, email }
POST   /api/auth/register

GET    /api/customer/accounts
POST   /api/customer/accounts
POST   /api/customer/transactions/transfer
GET    /api/customer/transactions
POST   /api/customer/bills/pay
GET    /api/customer/budgets
POST   /api/customer/loans/apply
GET    /api/customer/rewards
GET    /api/customer/analytics/spending

GET    /api/admin/users
POST   /api/admin/accounts/{id}/freeze
POST   /api/admin/loans/{id}/approve
GET    /api/admin/audit-logs?page=0&size=20
```

> The full request/response contract lives in [docs/NeoBank360_Documentation.md](docs/NeoBank360_Documentation.md).

---

## 🗄️ Database Schema

Schema scripts are at `Neo_bank_360_app/src/main/resources/schema/`:

| Script                                  | Purpose                          |
|-----------------------------------------|----------------------------------|
| `01_create_users_table.sql`             | Users (with role: CUSTOMER/ADMIN)|
| `02_create_accounts_table.sql`          | Bank accounts                    |
| `03_create_transactions_table.sql`      | Credits, debits, transfers       |
| `07_create_loan_products_table.sql`     | Loan product catalog             |
| `08_create_loan_applications_table.sql` | Loan applications                |
| `09_create_loan_accounts_table.sql`     | Disbursed loan accounts          |
| `10_create_loan_repayments_table.sql`   | Repayment schedule               |

With `ddl-auto=update`, Hibernate creates/updates tables automatically on startup — scripts above are the canonical reference.

---

## 🔐 Security

1. Credentials → `POST /api/auth/login` → BCrypt verification.
2. JWT issued with claims: `sub` (email), `role`, `fullName`.
3. Frontend stores token in **sessionStorage**.
4. `auth.interceptor.ts` attaches `Authorization: Bearer <token>` to every API call.
5. `JwtAuthFilter` validates the token & populates `SecurityContext`.
6. URL rules + `@PreAuthorize` enforce role access.
7. `error.interceptor.ts` globally handles **401** (clear session + redirect to login) and **403** (redirect to correct dashboard).

**Defensive defaults**: missing/blank `role` claim defaults to `CUSTOMER` (handles legacy tokens & legacy DB rows).

---

## 🧭 Frontend Conventions

- **Standalone components** (no NgModules).
- All endpoints come from `core/config/api.config.ts` — never hardcode URLs.
- Route guards use a `roleGuard('CUSTOMER' | 'ADMIN')` factory.
- Layouts: separate **customer shell** and **admin shell** in `core/layouts/`.
- HTTP interceptors registered globally — auth + error.
- SSR is **disabled** intentionally.

---

## 🧱 Backend Conventions

- Layered architecture: **Controller → Service → Repository → Entity**.
- Money movement is **atomic** (transactional transfers with reference IDs).
- Loan products are auto-seeded on startup by `LoanProductInitializer`.
- CORS preflight (`OPTIONS *`) is `permitAll`.

---

## 🧪 Testing

```bash
# Frontend (Karma / Jasmine)
cd NeoBankF
npm test

# Backend (JUnit / Spring Test)
cd Neo_bank_360_app
./mvnw test
```

---

## 🛠 Troubleshooting

| Symptom                                          | Fix                                                                 |
|--------------------------------------------------|---------------------------------------------------------------------|
| `401` on every request                           | Token expired — log out & log in again                              |
| `403` after login                                | Role mismatch — pick the correct portal (Customer vs Admin) on login|
| CORS error in browser                            | Ensure frontend hits `/api/...` via the dev proxy, not absolute URL |
| `Cannot connect to MySQL`                        | Verify MySQL is running and `application.properties` credentials    |
| Port `4200` or `8080` already in use             | Stop the conflicting process or change the port                     |
| Stale token after backend changes role claims    | Clear `sessionStorage` and log in again                             |

---

## 🗺️ Roadmap

- [ ] Email/SMS notifications for transactions
- [ ] Two-factor authentication (TOTP)
- [ ] Card management (virtual debit cards)
- [ ] Investment / mutual fund module
- [ ] Mobile app (Ionic / React Native)
- [ ] CI/CD pipeline + Docker compose

---

## 📚 Documentation

Detailed docs and the project presentation live in [`docs/`](docs/):

- [NeoBank360_Documentation.md](docs/NeoBank360_Documentation.md) — full architecture, modules, APIs, gotchas
- [NeoBank360_Presentation.md](docs/NeoBank360_Presentation.md) — slide-style project walkthrough

---

## 👨‍💻 Author

<table>
  <tr>
    <td align="center">
      <strong>Gopal Kumar</strong><br/>
      <sub>Full-Stack Developer · Designer · Maintainer</sub><br/><br/>
      <em>Crafted with ❤️ — Angular + Spring Boot + MySQL</em>
    </td>
  </tr>
</table>

> Have feedback, ideas, or want to contribute? Open an issue or reach out.

---

## 📄 License

This project is built for **educational and portfolio purposes**. All rights reserved by the author. For reuse or distribution, please contact the author.

---

<p align="center"><sub>© 2026 NeoBank360 · Designed &amp; developed by <strong>Gopal Kumar</strong></sub></p>
