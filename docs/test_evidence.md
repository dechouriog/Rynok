# Test Evidence — Results and Coverage

| Suite | Tool | Tests | Result | Line coverage |
| --- | --- | --- | --- | --- |
| Smart contract | Hardhat 3 + Mocha/Chai | 22 | 22 passing | 100% |
| Backend unit | Vitest + `@vitest/coverage-v8` | 49 | 49 passing | 96.01% |
| Backend e2e | Vitest + `supertest` (SQLite in memory + real PostgreSQL) | 15 | 15 passing | — |
| Frontend | Vitest + Testing Library + `@vitest/coverage-v8` | 72 | 72 passing | 88.82% |
| Integration (local node) | Script against Hardhat node + backend + PostgreSQL | 17 checks | 17 passing | — |
| Integration (Sepolia) | Script against the deployed contract + backend | 15 checks | 15 passing | — |

---

## Smart contract — `Escrow.sol`

```text
╔══════════════════════╤════════╤═════════════╤═════════════════╗
║ File Path            │ Line % │ Statement % │ Uncovered Lines ║
╟──────────────────────┼────────┼─────────────┼─────────────────╢
║ contracts\Escrow.sol │ 100.00 │ 100.00      │ -               ║
╚══════════════════════╧════════╧═════════════╧═════════════════╝
```

The 22 tests cover every function and every `require`:

- **`list`**: valid price, zero price, price update without a deposit, no price change with a pending deposit, no re-listing after a sale.
- **`deposit`**: unlisted property, amount different from the price (both higher and lower), double deposit, buyer equal to seller, and the **1-wei squatting attack**. In that attack, a property listed and "bought" by an attacker for 1 wei does not block the real sale.
- **`confirmDelivery`**: releases funds to the seller and closes the listing; only the buyer can call it; no deposit is possible after the sale.
- **`refund`**: returns the funds to the buyer; only the seller can call it; no release after a refund (or the reverse); a new deposit is possible after a refund.
- **`claimRefund`** (30-day deadline, using time travel with `networkHelpers.time.increase`): rejected before the deadline, works after it, only the buyer can call it, and it does not apply to a completed sale.

## Backend

```text
File                        | % Stmts | % Branch | % Funcs | % Lines
----------------------------|---------|----------|---------|--------
All files                   |   94.46 |    84.74 |   95.23 |   96.01
 auth.service.ts            |   88.57 |    84.61 |      80 |   91.17
 escrow-chain.verifier.ts   |     100 |    95.83 |     100 |     100
 escrow.service.ts          |   98.03 |      100 |     100 |   98.03
 property.service.ts        |   84.44 |    76.66 |    87.5 |    87.8
 uploads.service.ts         |   96.77 |    89.47 |     100 |     100
 entities (3 files)         |     100 |       50 |     100 |     100
```

Main cases covered:

- **Auth**:
  - unique nonce per request;
  - **replay** of a used signature is rejected;
  - a message invented by the client, a message issued for another wallet, and an expired message are rejected;
  - requesting a new nonce does not invalidate a pending one.
- **On-chain verifier**: uses real encoded event logs and rejects:
  - a deposit for a different property, buyer, seller, or amount;
  - events emitted by another contract;
  - the wrong event type;
  - a contract address other than the configured one;
  - a failed or nonexistent transaction.
- **Escrow service**:
  - the buyer comes from the JWT and the seller from the property owner, never from the request body;
  - the price must match;
  - the property must be `AVAILABLE`;
  - nothing is saved if on-chain verification fails;
  - a closed escrow cannot be confirmed again;
  - the buyer can record a refund only after the 30-day deadline.
- **Properties**:
  - editing or deleting is blocked while the property is in escrow;
  - filtering by minimum price alone works;
  - replacing the image or deleting the property removes the old uploaded file, unless another property still uses it.
- **Image uploads**:
  - the type is detected from the file's bytes (JPG, PNG, WebP, GIF);
  - HTML or SVG disguised as an image is rejected;
  - files over 5 MB are rejected;
  - files get random names;
  - deletion never leaves the uploads folder (`/uploads/../` path traversal).

**e2e** (`npm run test:e2e`): authentication flow (including replay), property CRUD, escrow history, image upload, and the full `AppModule` running against the PostgreSQL started with `docker compose up -d postgres`. The image-upload e2e covers uploading, using the image in a property, serving it as `image/png`, rejecting uploads without a session or with non-image content, and rejecting `javascript:` image URLs.

## Frontend

```text
File                        | % Stmts | % Branch | % Funcs | % Lines
----------------------------|---------|----------|---------|--------
All files                   |   87.78 |    83.19 |   85.71 |   88.82
 lib/api.ts                 |   83.09 |    71.42 |   94.11 |   82.85
 lib/blockchain.ts          |   88.63 |    90.47 |      75 |   88.37
 context/WalletContext.tsx  |   91.07 |     87.5 |      80 |   90.74
 components/BuyButton.tsx   |      95 |    90.47 |     100 |   94.11
 components/TransactionRow  |   95.45 |    94.11 |     100 |     100
 components/PropertyOwner…  |   74.19 |    65.51 |      80 |   77.77
 components/PropertyFilters |   96.15 |      100 |    90.9 |      96
 components/ImageInput.tsx  |   90.62 |    95.45 |   77.77 |   93.33
 app/properties/page.tsx    |      50 |    33.33 |   66.66 |    62.5
```

Main cases covered:

- **`BuyButton`**:
  - hidden while the seller has not enabled the purchase on-chain, or when the on-chain price differs from the published one;
  - hidden for the owner and on sold properties;
  - shows the real cause of a failure.
- **`PropertyOwnerActions`**: the *Habilitar compra* button signs `list` and offers *Actualizar precio on-chain* when the prices differ.
- **`TransactionRow`**:
  - confirm delivery, refund, and claim after the deadline;
  - every contract call passes the property and the seller.
- **`WalletContext`**:
  - signs the nonce issued by the backend;
  - **signs out when the MetaMask account changes**.
- **`blockchain.ts`**:
  - listing state;
  - wrong network (asks MetaMask to switch to Sepolia before signing);
  - missing contract address.
- **`ImageInput`**:
  - preview of the chosen file;
  - rejects non-image formats and files over 5 MB before uploading;
  - shows and removes the current image;
  - offers no URL field: images can only be uploaded as files;
  - the file is uploaded only when the form is submitted.
- **`PropertyFilters`**:
  - the price and sort selects reflect the active filters from the URL, after reloading or navigating;
  - changing a filter keeps the other filters;
  - empty fields are omitted from the search.

**Known gap:** the client-side sorting on the `/properties` page (`price_asc` / `price_desc`) is not exercised by the tests.

## Integration and Sepolia

Two scripts drove the real backend and PostgreSQL with the same API and contract calls the frontend makes, using two different wallets (seller and buyer):

- **Local Hardhat node (17/17):**
  - listing;
  - deposit with a wrong amount;
  - full purchase;
  - 1-wei attack (the backend rejects it and the legitimate buyer still buys);
  - seller refund and resale;
  - 30-day deadline (time travel with `evm_increaseTime`).
- **Sepolia, deployed contract (15/15):**
  - full purchase with on-chain verification by the backend;
  - seller refund;
  - rejection of a real transaction hash that belongs to another property;
  - price edit blocked while in escrow.

  Total gas spent: ~0.0000018 Sepolia ETH.

## How to reproduce

```bash
cd contracts && npx hardhat test --coverage
cd backend && npm run test:cov && npm run test:e2e   # e2e requires: docker compose up -d postgres
cd frontend && npm run test:cov
```

Each command also writes an HTML report to `coverage/` in its folder; this folder is ignored by git.
