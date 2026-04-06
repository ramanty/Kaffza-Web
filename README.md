# Kaffza (قفزة)

<div align="center">

**Kaffza | قفزة**

_The First Omani SaaS E-Commerce Platform_

_أول منصة تجارة إلكترونية عُمانية SaaS_

**جوهرة الشهباء الحديثة ش.م.م**

[![License: UNLICENSED](https://img.shields.io/badge/License-UNLICENSED-red.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9.0.0-orange)](https://pnpm.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-monorepo-blueviolet)](https://turbo.build/)

</div>

---

## About the Project

**Kaffza (قفزة)** is a fully integrated SaaS e-commerce platform built for Omani merchants. It empowers businesses to launch and manage their online stores with ease. The platform is bilingual (Arabic & English with full RTL support), operates exclusively in Omani Rial (OMR), and integrates natively with **Thawani Pay** (payment gateway) and **Jina'com** (shipping service).

---

## Tech Stack

| Layer            | Technology                                                             |
| :--------------- | :--------------------------------------------------------------------- |
| **Backend**      | [NestJS](https://nestjs.com/), Prisma ORM, PostgreSQL, Redis           |
| **Web Frontend** | [Next.js](https://nextjs.org/) 15, React 19, Tailwind CSS, next-intl   |
| **Mobile**       | [Expo](https://expo.dev/) (React Native), NativeWind                   |
| **Monorepo**     | [Turborepo](https://turbo.build/), [pnpm](https://pnpm.io/) workspaces |
| **Database**     | [PostgreSQL](https://www.postgresql.org/) 16 (via Docker)              |
| **DevOps**       | Docker Compose, Nginx                                                  |
| **Code Quality** | ESLint, Prettier, Husky, lint-staged                                   |

---

## Key Features

| Feature               | Description                                                           |
| :-------------------- | :-------------------------------------------------------------------- |
| **Multi-tenant SaaS** | Every merchant gets their own store with a dedicated subdomain        |
| **Bilingual (RTL)**   | Full Arabic & English support with automatic text-direction switching |
| **Thawani Pay**       | Native integration with the local Omani payment gateway               |
| **Jina'com**          | Native integration with the local Omani shipping service              |
| **Escrow System**     | Smart financial protection that adapts to merchant trust levels       |
| **Dispute System**    | Merchant-to-customer dispute resolution mechanism                     |
| **Merchant Wallet**   | Balance management, withdrawals, and a full transaction ledger        |
| **OTP + JWT Auth**    | Secure authentication via one-time passwords and JWT tokens           |

---

## Project Structure

```
kaffza/
├── apps/
│   ├── api/          # NestJS Backend API
│   ├── web/          # Next.js Web Application
│   └── mobile/       # React Native / Expo Mobile App
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── validators/   # Shared Zod validation schemas
│   ├── tsconfig/     # Shared TypeScript configurations
│   └── config/       # Shared ESLint / Prettier configs
├── docs/             # Architecture docs & diagrams
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) `>= 20.0.0`
- [pnpm](https://pnpm.io/) `>= 9.0.0`
- [Docker](https://www.docker.com/) & Docker Compose (for the database and services)

### 1. Clone the Repository

```bash
git clone https://github.com/ramanty/Kaffza-Web.git
cd Kaffza-Web
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your local settings
```

### 4. Run the Database via Docker

Start PostgreSQL, Redis, and MinIO using Docker Compose:

```bash
docker compose up -d
```

This will spin up the following services:

| Service                       | Port                           |
| :---------------------------- | :----------------------------- |
| PostgreSQL                    | `5432`                         |
| Redis                         | `6379`                         |
| MinIO (S3-compatible storage) | `9000` (API), `9001` (Console) |

### 5. Run Database Migrations & Seeds

```bash
pnpm db:migrate
pnpm db:seed
```

### 6. Run the Project Locally

```bash
pnpm dev
```

This command starts all applications in parallel using Turborepo:

| Application        | URL                              |
| :----------------- | :------------------------------- |
| Web (Next.js)      | `http://localhost:3000`          |
| API (NestJS)       | `http://localhost:4000`          |
| API Docs (Swagger) | `http://localhost:4000/api/docs` |

To run individual apps:

```bash
pnpm dev:api      # API only
pnpm dev:web      # Web only
pnpm dev:mobile   # Mobile only
```

---

## Available Scripts

| Script            | Description                                 |
| :---------------- | :------------------------------------------ |
| `pnpm dev`        | Start all apps in development mode          |
| `pnpm build`      | Build all apps and packages                 |
| `pnpm lint`       | Run ESLint across all packages              |
| `pnpm test`       | Run all tests                               |
| `pnpm db:migrate` | Run Prisma database migrations              |
| `pnpm db:seed`    | Seed the database with initial data         |
| `pnpm clean`      | Remove all build artifacts and node_modules |

---

## Code Quality

This project uses **Husky** and **lint-staged** to enforce code quality on every commit.

The pre-commit hook automatically runs:

- **Prettier** — formats staged files
- **ESLint** — lints and auto-fixes staged TypeScript/JavaScript files

These hooks are installed automatically when you run `pnpm install` (via the `prepare` script).

---

## Subscription Plans

| Plan              | Monthly Price | Commission |
| :---------------- | :------------ | :--------- |
| Starter (البداية) | 5 OMR         | 2%         |
| Growth (النمو)    | 8 ر.ع         | 1%         |
| Pro (المحترف)     | 35 ر.ع        | 0.5%       |

_No registration fees._

---

## Documentation

For the complete architecture design, database diagrams, and workflow documentation, see the [Architecture Document](./docs/ARCHITECTURE.md).

## SSL / Domain Routing

The default deployment uses **single-domain routing (Option A)** on `kaffza.me` (no wildcard DNS cert required).  
Storefronts are served by path routing: `/store/[subdomain]`.

Wildcard certificates (`*.kaffza.me`) are **not** handled by `ssl_one_shot.sh` because it uses HTTP-01 challenge.

---

## Contributing

Please read our [Contributing Guidelines](./.github/pull_request_template.md) before submitting a pull request. Use the provided issue templates to report bugs or request features.

---

## License

This project is proprietary software owned by **جوهرة الشهباء الحديثة ش.م.م**. All rights reserved.
