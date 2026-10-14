# Rynok

Rynok is a decentralized real estate marketplace that connects property owners and buyers through blockchain-based transactions using Ethereum.

Users sign in with their MetaMask wallet, publish property listings with their own uploaded photos, description, location, and price in ETH, and browse, search, and manage listings. Purchases are paid in ETH and protected by an escrow smart contract deployed on Sepolia: funds stay locked until the buyer confirms delivery, the seller refunds, or the delivery deadline expires.

## Project Status

**All five milestones are delivered.** The escrow contract is deployed and the full purchase flow was validated end to end on the Sepolia testnet. See [Delivery Status](docs/statement_of_work.md#delivery-status) for the full breakdown.

| Milestone | Status |
| --- | --- |
| M1 — Foundation & Authentication | Delivered |
| M2 — Property Marketplace | Delivered |
| M3 — Blockchain & Escrow | Delivered |
| M4 — Transactions & Documentation | Delivered |
| M5 — Testing & Finalization | Delivered (contract deployed on Sepolia, flow validated on-chain) |

### Deployed contract

| Network | Escrow address |
| --- | --- |
| Ethereum Sepolia (chainId 11155111) | [`0x049BBA8708b71E33f649Bae0E2F127F805ca9Ca9`](https://sepolia.etherscan.io/address/0x049BBA8708b71E33f649Bae0E2F127F805ca9Ca9) |

## How a purchase works

1. **Publish**: the seller publishes the property (backend only, no transaction).
2. **Enable purchase**: the seller clicks *Habilitar compra*, which signs `list(propertyId, price)` and sets the exact price on-chain.
3. **Buy**: the buyer clicks *Comprar con MetaMask* and deposits exactly that price into the escrow. The backend verifies the transaction on-chain before marking the property `IN_ESCROW`.
4. **Close the deal**, in one of three ways:
   - the buyer confirms delivery, and the funds go to the seller (`SOLD`);
   - the seller refunds the buyer (`AVAILABLE` again);
   - after 30 days without confirmation, the buyer reclaims the funds.

Design decisions, security model, and known limitations: [docs/escrow.md](docs/escrow.md).

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | NestJS, TypeORM, PostgreSQL |
| Auth | Wallet-signature login (MetaMask + `ethers.js`) with single-use nonces and JWT sessions — no passwords |
| Blockchain | Solidity 0.8.24, Hardhat 3, OpenZeppelin (`ReentrancyGuard`), Ethereum Sepolia |
| Testing | Hardhat + Mocha/Chai (contract), Vitest + `supertest` (backend), Vitest + Testing Library (frontend) |
| API Docs | Swagger / OpenAPI (`/api/docs`) |
| Infra | Docker (PostgreSQL) |

## Getting Started

Requirements: Node.js 22+, Docker, and MetaMask set to the **Sepolia** network with some test ETH ([faucet](https://www.alchemy.com/faucets/ethereum-sepolia)).

```bash
# 1. Install dependencies (npm workspaces — installs backend + frontend)
npm install

# 2. Start PostgreSQL (exposed on host port 5433 to avoid clashing with a local PostgreSQL)
docker compose up -d postgres

# 3. Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Fill in the escrow variables, using the deployed contract above or your own deployment (step 4):

| File | Variable | Value |
| --- | --- | --- |
| `frontend/.env.local` | `NEXT_PUBLIC_ESCROW_ADDRESS` | Escrow contract address |
| `frontend/.env.local` | `NEXT_PUBLIC_CHAIN_ID` | `11155111` (Sepolia) or `31337` (local Hardhat node) |
| `backend/.env` | `ESCROW_CONTRACT_ADDRESS` | Same address |
| `backend/.env` | `ESCROW_RPC_URL` | Sepolia RPC URL (e.g. Alchemy). Enables on-chain verification of every escrow transaction |
| `backend/.env` | `JWT_SECRET` | A long random string |

```bash
# 4. (Optional) Deploy your own escrow contract
cd contracts && npm install
cp .env.example .env              # SEPOLIA_RPC_URL + PRIVATE_KEY of a TEST wallet
npm run deploy:sepolia            # prints the address to put in both .env files
cd ..

# 5. Start the backend and the frontend
npm run dev:backend
npm run dev:frontend

# 6. (Optional) Seed sample data
cd backend && npm run build && node dist/seed.js
```

- App: `http://localhost:3000`
- API docs (Swagger): `http://localhost:3001/api/docs`

> To try a purchase you need **two MetaMask accounts** on Sepolia: one for the seller and one for the buyer. Switching accounts in MetaMask signs you out of Rynok, so you can connect again with the other account.

## Deployment

The contract is already on Sepolia. The app is deployed with **Render** (backend + PostgreSQL, free plan) and **Vercel** (frontend).

**Backend and database (Render)**

The repository includes a [`render.yaml`](render.yaml) Blueprint that creates both services with their variables wired together:

1. In Render, choose **New → Blueprint** and select this repository.
2. When asked, enter `ESCROW_RPC_URL` (a Sepolia RPC URL, e.g. from Alchemy). `DATABASE_URL` and `JWT_SECRET` are set automatically.
3. Wait for the deploy and copy the backend URL (e.g. `https://rynok-api.onrender.com`). Opening it should return `{"status":"ok","service":"rynok-api"}`.

Free-plan limitations:

- The backend sleeps after 15 minutes without traffic and takes about a minute to wake up. Open the backend URL before a demo.
- Uploaded photos are lost on every redeploy or restart, because the free plan has no persistent disk. A paid disk (`UPLOAD_DIR` pointing to it) or Railway with a volume fixes this.
- The free database expires after 30 days.

**Frontend (Vercel)**

1. Import the repository with *Root Directory* `frontend`.
2. Set:
   - `NEXT_PUBLIC_API_URL` (the backend URL from Render, without a trailing slash);
   - `NEXT_PUBLIC_ESCROW_ADDRESS=0x049BBA8708b71E33f649Bae0E2F127F805ca9Ca9`;
   - `NEXT_PUBLIC_CHAIN_ID=11155111`.

   `NEXT_PUBLIC_*` variables are embedded at build time, so redeploy the frontend after changing them.

> Pending login nonces are kept in memory, so the backend must run as a single instance. Tables are created automatically (`synchronize: true`), which is fine for this academic deployment; a production system would use migrations. Other hosts work the same way: the backend reads `DATABASE_URL` (plus `DB_SSL=true` if the provider requires SSL) and `UPLOAD_DIR`.

## Testing

```bash
# Smart contract (includes the 1-wei squatting attack and the 30-day deadline)
cd contracts && npx hardhat test

# Backend: unit tests and e2e (the e2e suite needs `docker compose up -d postgres`)
npm run test:backend
cd backend && npm run test:e2e

# Frontend
npm run test:frontend

# With coverage
cd contracts && npx hardhat test --coverage
cd backend && npm run test:cov
cd frontend && npm run test:cov
```

| Suite | Tests | Line coverage |
| --- | --- | --- |
| Contract (`Escrow.sol`) | 22 | 100% |
| Backend unit | 49 | 96% |
| Backend e2e | 15 | — |
| Frontend | 72 | 89% |

The full purchase, refund, and deadline flows were also run against a local Hardhat node and against the deployed contract on Sepolia. See [Test Evidence](docs/test_evidence.md).

## Security

- **Wallet login with single-use nonces.** The backend issues a message with a random nonce that expires after 5 minutes, and consumes it on use, so a captured signature cannot be replayed.
- **The escrow contract enforces the exact listed price.** Listings and deals are keyed by `(propertyId, seller)`, so no one can list, buy, or block a property on behalf of another seller.
- **The backend never trusts client-reported transactions.** It reads each receipt from the chain and checks the emitted event, property, buyer, seller, and amount.
- **Properties cannot be edited or deleted while funds are in escrow.**
- **Image uploads are validated by content.** Only JPG, PNG, WebP, or GIF up to 5 MB are accepted, and the type is detected from the file's bytes, so HTML or SVG disguised as an image is rejected. Files get random names and are served with `X-Content-Type-Options: nosniff`.

## Documentation

The complete project documentation is available in the [Rynok Wiki](https://github.com/dechouriog/Rynok/wiki) and in this repository's `docs/` folder.

### Planning & Scope

- [Software Project Proposal](https://github.com/dechouriog/Rynok/wiki/Software-Project-Proposal) — Original project proposal, updated with real delivery status.
- [MVP Scope](docs/mvp_scope.md) — Defined MVP scope and backlog, annotated with what's delivered.
- [Statement of Work](docs/statement_of_work.md) — Milestones and delivery status.
- [Issues](https://github.com/dechouriog/Rynok/issues) — Project issues and user stories.

### Architecture & API

- [Stack Justification](docs/stack_justification.md) — Why each technology was chosen, with trade-offs.
- [Escrow](docs/escrow.md) — Purchase flow, security decisions, known limitations, and future work.
- API documentation is generated live from the code — run the backend and visit `/api/docs`.

### Quality & Process

- [Test Evidence](docs/test_evidence.md) — Test results and coverage for contract, backend, and frontend.
- [User Guide](docs/user_guide.md) — Step-by-step guide for buyers and sellers (Spanish).
- [AI Usage](docs/IA_Doc.md) — Disclosure of where and how AI assistance was used during development.

## Team

- **Leidy Obando** — Backend, authentication, infrastructure.
- **Diego Chourio** — Frontend, property marketplace.

---

[Rynok Wiki](https://github.com/dechouriog/Rynok/wiki) · [Issues](https://github.com/dechouriog/Rynok/issues) · [API Docs](http://localhost:3001/api/docs)
