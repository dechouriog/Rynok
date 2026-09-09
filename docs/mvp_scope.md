# 2. MVP Scope

| Status | Feature | Description | Entrega 1 Status |
|--------|---------|-------------|-------------------|
| **IN** | User Registration & Login | Users can create an account and securely log in. |  Delivered (wallet-signature auth) |
| **IN** | MetaMask Integration | Connect a MetaMask wallet to the user account. |  Delivered |
| **IN** | Property Listings | Publish properties with photos, description, location, and price in ETH. |  Delivered |
| **IN** | Listing Management | Edit or delete owned property listings. |  Delivered |
| **IN** | Property Search | Browse and filter properties by location, price, and property type. |  Delivered (location, price range, sort) |
| **IN** | Property Details | View complete information for a selected property. |  Delivered |
| **IN** | Crypto Purchase | Purchase properties using ETH through MetaMask. | ⏳ Planned — Milestone 3 |
| **IN** | Escrow Smart Contract | Hold buyer funds securely until the transaction is completed. |  Planned — Milestone 3 |
| **IN** | Escrow Settlement | Release funds to the seller or refund the buyer when appropriate. |  Planned — Milestone 3 |
| **IN** | Transaction History | Display purchase and sale history for each user. |  Planned — Milestone 4 |
| **OUT** | Fiat Payments | Credit card and bank transfer payments are not included in the MVP. | — |
| **OUT** | Multi-Chain Support | Polygon, BNB Chain, and other networks are excluded from the MVP. | — |
| **OUT** | Identity Verification | KYC and legal property ownership verification are excluded. | — |
| **OUT** | Mortgage Integration | Third-party financing and mortgage services are not included. | — |
| **OUT** | Mobile Application | Native Android and iOS applications are outside the MVP scope. | — |
| **LATER** | In-App Messaging | Communication between buyers and sellers. | — |
| **LATER** | Stablecoin Support | Support for USDC, USDT, and additional blockchain networks. | — |
| **LATER** | Legal Document Generation | Automatic generation of property sale documents. | — |
| **LATER** | Verified Sellers | Verification badges for trusted property owners. | — |
| **LATER** | Advanced Search | Interactive map view and advanced filtering. | — |
| **LATER** | Reputation System | Ratings and reviews for buyers and sellers. | — |
| **UNKNOWN** | KYC Requirement | Determine whether KYC will be required before publishing listings. | — |
| **UNKNOWN** | Legal Regulations | Determine legal requirements depending on the operating country. | — |
| **UNKNOWN** | Platform Fee | Decide whether the platform will charge a percentage per transaction. | — |
| **UNKNOWN** | Escrow Dispute Resolution | Define whether arbitration or dispute resolution is required. | — |

---

# MVP Definition

The MVP is a web-based decentralized real estate marketplace that enables registered users to connect their MetaMask wallet, publish properties for sale, browse available listings, and purchase real estate using Ethereum (ETH).

Transactions are secured through an escrow smart contract that holds the buyer's funds until the agreed conditions are met. Once the transaction is confirmed, the funds are released to the seller or refunded to the buyer if the purchase is cancelled.

The objective of the MVP is to provide the essential functionality required to list, discover, and purchase real estate using cryptocurrency while demonstrating a secure and transparent blockchain-based transaction process.

---

See `docs/statement_of_work.md` for the milestone-by-milestone delivery status, and
`docs/ai_usage.md` for disclosure of AI-assisted work during this delivery.