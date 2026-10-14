# Rynok — Backend

REST API built with NestJS + TypeORM + PostgreSQL. Swagger docs at `http://localhost:3001/api/docs` while the server runs.

## Modules

| Module | Endpoints | Purpose |
| --- | --- | --- |
| `auth` | `POST /auth/nonce`, `POST /auth/connect`, `GET /auth/me` | Wallet-signature login with single-use nonces (5 min) and JWT sessions |
| `property` | `GET/POST /properties`, `GET/PATCH/DELETE /properties/:id` | Listings CRUD and search; edit/delete blocked while in escrow |
| `escrow` | `POST /escrow/deposit`, `POST /escrow/:id/confirm`, `POST /escrow/:id/refund`, `GET /escrow/my-transactions`, `GET /escrow/:id` | Records escrow transactions after verifying them on-chain |
| `uploads` | `POST /uploads/images`, `GET /uploads/:file` | Property photo uploads (JPG/PNG/WebP/GIF, max. 5 MB), validated by content and stored in `UPLOAD_DIR` (default `backend/uploads`, git-ignored) |
| `app` | `GET /` | Health check |

When `ESCROW_RPC_URL` is set, `EscrowChainVerifier` reads every reported transaction receipt from the chain and
requires the right event (`Deposited`, `Released`, `Refunded`) with the expected property, buyer, seller, and amount.

## Setup

```bash
cp .env.example .env               # DB on port 5433, JWT_SECRET, ESCROW_* variables
docker compose up -d postgres      # from the repository root
npm run start:dev
```

## Tests

```bash
npm run test       # 49 unit tests
npm run test:cov   # coverage (~96% lines)
npm run test:e2e   # 15 e2e tests (needs PostgreSQL running)
```
