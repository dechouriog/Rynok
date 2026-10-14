# Rynok — Frontend

Next.js (App Router) + TypeScript + Tailwind CSS. Talks to the backend REST API and to the escrow contract through MetaMask (`ethers` v6).

## Setup

```bash
cp .env.local.example .env.local
npm run dev        # http://localhost:3000
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend URL (default `http://localhost:3001`) |
| `NEXT_PUBLIC_ESCROW_ADDRESS` | Escrow contract address |
| `NEXT_PUBLIC_CHAIN_ID` | `11155111` (Sepolia) or `31337` (local Hardhat node) |

## Structure

- `src/lib/api.ts`: backend client.
- `src/lib/blockchain.ts`: escrow contract calls. Before signing, it checks the network and asks MetaMask to switch if needed.
- `src/context/WalletContext.tsx`: MetaMask session. It signs the nonce issued by the backend, and signs out if the MetaMask account changes.
- `src/components/BuyButton.tsx`: shown only when the seller has enabled the purchase on-chain at the published price.
- `src/components/PropertyOwnerActions.tsx`: *Habilitar compra* / *Actualizar precio on-chain*, edit, delete.
- `src/components/ImageInput.tsx`: photo picker with preview, used when publishing and editing. The file is uploaded only when the form is submitted, so no orphan files are left if the user changes their mind.
- `src/components/TransactionRow.tsx`: confirm delivery, refund, and claim after the 30-day deadline.

## Tests

```bash
npm run test       # 72 tests
npm run test:cov   # coverage (~89% lines)
```
