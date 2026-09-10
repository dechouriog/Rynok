# Rynok

Rynok is a decentralized real estate marketplace that connects property owners and buyers through blockchain-based transactions using Ethereum.

Registered users connect a MetaMask wallet, publish property listings with photos, description, location, and price in ETH, and browse, search, and manage listings. Secure ETH purchases protected by an escrow smart contract are planned for a later delivery.

## Project Status

**Entrega 1 delivered** — Milestone 1 (Foundation & Authentication) and Milestone 2 (Property Marketplace) are implemented, tested, and running. Milestones 3–5 (blockchain escrow, transaction history, and final testing/deployment) are planned for future deliveries. See [Delivery Status](docs/statement_of_work.md#delivery-status) for the full breakdown.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | NestJS, TypeORM, PostgreSQL |
| Auth | Wallet-signature login (MetaMask + `ethers.js`) with JWT sessions — no passwords |
| Testing | Vitest, `@testing-library/react`, `supertest` |
| API Docs | Swagger / OpenAPI (`/api/docs`) |
| Infra | Docker (PostgreSQL) |
| Blockchain *(planned)* | Solidity, Hardhat, OpenZeppelin |

## Getting Started

```bash
# 1. Install dependencies (npm workspaces — installs backend + frontend)
npm install

# 2. Start PostgreSQL
docker compose up -d postgres

# 3. Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 4. Start the backend
npm run dev:backend

# 5. (Optional) Seed sample data
cd backend && npm run build && node dist/seed.js

# 6. Start the frontend
npm run dev:frontend
```

- App: `http://localhost:3000`
- API docs (Swagger): `http://localhost:3001/api/docs`

## Testing

```bash
npm run test:backend
npm run test:frontend

# With coverage
cd backend && npm run test:cov
cd frontend && npm run test:cov
```

## Documentation

The complete project documentation is available in the [Rynok Wiki](https://github.com/dechouriog/Rynok/wiki) and in this repository's `docs/` folder.

### Planning & Scope

- [Software Project Proposal](https://github.com/dechouriog/Rynok/wiki/Software-Project-Proposal) — Original project proposal, updated with real delivery status.
- [MVP Scope](docs/mvp_scope.md) — Defined MVP scope and backlog, annotated with what's delivered vs. planned.
- [Statement of Work](docs/statement_of_work.md) — Milestones and delivery status.
- [Issues](https://github.com/dechouriog/Rynok/issues) — Project issues and user stories.

### Architecture & API

- [System Diagrams](docs/System-Diagrams.md) / [Architecture](docs/architecture.md) — Architecture, use case, component, and entity-relationship diagrams, matching the current codebase.
- [Stack Justification](docs/stack_justification.md) — Why each technology was chosen, with trade-offs.
- API documentation is generated live from the code — run the backend and visit `/api/docs`.

### Quality & Process

- [Test Evidence](docs/test_evidence.md) — Test coverage report for backend and frontend.
- [AI Usage](docs/ai_usage.md) — Disclosure of where and how AI assistance was used during development.
- [Defense Guide (English)](docs/defense_guide.md) / [Guía de Defensa (Español)](docs/guia_defensa.md) — Technology justification, code walkthrough with line references, and anticipated questions for the project defense.

## Team

- **Leidy Obando** — Backend, authentication, infrastructure.
- **Diego Chourio** — Frontend, property marketplace.

---

[Rynok Wiki](https://github.com/dechouriog/Rynok/wiki) · [Issues](https://github.com/dechouriog/Rynok/issues) · [API Docs](http://localhost:3001/api/docs)
