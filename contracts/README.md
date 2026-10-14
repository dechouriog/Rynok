# Rynok — Escrow contract

Hardhat 3 project (Mocha + ethers) with the `Escrow` contract that holds ETH for Rynok purchases.
Design, security model, and limitations: [../docs/escrow.md](../docs/escrow.md).

| Network | Address |
| --- | --- |
| Sepolia (chainId 11155111) | [`0x049BBA8708b71E33f649Bae0E2F127F805ca9Ca9`](https://sepolia.etherscan.io/address/0x049BBA8708b71E33f649Bae0E2F127F805ca9Ca9) |

## Functions

| Function | Caller | Effect |
| --- | --- | --- |
| `list(propertyId, price)` | Seller | Enables the sale at an exact price (in wei). It can be updated while there is no pending deposit. |
| `deposit(propertyId, seller)` | Buyer | Deposits exactly the listed price. |
| `confirmDelivery(propertyId, seller)` | Buyer | Releases the funds to the seller. |
| `refund(propertyId, seller)` | Seller | Returns the funds to the buyer; the property can be bought again. |
| `claimRefund(propertyId, seller)` | Buyer | After `DELIVERY_PERIOD` (30 days), the buyer reclaims the funds. |

`propertyId` is `uint256(keccak256(<property UUID>))`.

## Usage

```bash
npm install
npx hardhat test              # 22 tests
npx hardhat test --coverage   # 100% line coverage
```

### Local deployment

```bash
npx hardhat node                                      # terminal 1
npx hardhat run scripts/deploy.ts --network localhost # terminal 2
```

Use `NEXT_PUBLIC_CHAIN_ID=31337` in `frontend/.env.local` and `ESCROW_RPC_URL=http://127.0.0.1:8545` in `backend/.env`.

### Sepolia deployment

```bash
cp .env.example .env   # SEPOLIA_RPC_URL and PRIVATE_KEY (TEST wallet only, with Sepolia ETH)
npm run deploy:sepolia
```

The script prints the address and the lines to copy into `frontend/.env.local` and `backend/.env`.
`.env` is git-ignored: never commit a private key.
