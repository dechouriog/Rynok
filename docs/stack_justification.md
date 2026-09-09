# Stack Justification

Short rationale for each technology choice, including the alternatives considered
and the trade-off accepted. This complements the "Software Employed" section of
the Statement of Work, which lists *what* was chosen — this explains *why*.

---

## Frontend: Next.js (App Router) + TypeScript + Tailwind CSS

**Alternatives considered:** Create React App / plain Vite+React, Vue/Nuxt.

**Why Next.js:** Server Components let pages like `/properties` fetch data
directly on the server without a separate loading state or client-side
`useEffect` fetch, which matters for a marketplace where the listing is the
first thing a visitor sees. File-based routing also kept the route structure
(`/properties/[id]`, `/properties/[id]/edit`) simple to reason about with two
people working on different pages at once.

**Trade-off accepted:** Next.js's App Router is still evolving fast — we hit a
real breaking change mid-project (`params`/`searchParams` became `Promise`-based
in Next 16), which cost debugging time. A more stable, older framework would
not have had this specific issue, but would have cost more boilerplate for
server-side data fetching.

**Why Tailwind over plain CSS/Styled Components:** Two people styling different
screens needed a shared, constrained design vocabulary (spacing, color scale)
without agreeing on a CSS architecture up front. Utility classes made it fast to
match the approved mockup screen by screen.

---

## Backend: NestJS + TypeScript

**Alternatives considered:** Express (plain), Fastify, Django REST, Laravel.

**Why NestJS:** Its module system (`AuthModule`, `PropertyModule`) maps directly
onto how the team split work by milestone (Diego: auth, Leidy: properties),
so each person's module has clear boundaries and a guard (`WalletAuthGuard`) can
be shared without duplicating logic. Built-in dependency injection also made the
unit tests straightforward — services are mocked via their injection token,
not via manual module patching.

**Trade-off accepted:** NestJS has a steeper learning curve and more boilerplate
per feature (module + controller + service + DTOs) than a minimal Express app.
For a project of this size that's a real cost, but it pays off as more
milestones (auth, properties, and eventually escrow/transactions) get added
without the codebase turning into one large router file.

---

## Database: PostgreSQL + TypeORM

**Alternatives considered:** MongoDB, SQLite (for real use, not just tests),
Prisma (used in the original architecture draft) instead of TypeORM.

**Why PostgreSQL over MongoDB:** The data is inherently relational — a
`Property` always belongs to exactly one `User`, and future entities (escrow
transactions, offers) will reference both. Modeling that as foreign keys with
referential integrity is a better fit than embedding or manually maintaining
references in a document store.

**Why TypeORM over Prisma:** TypeORM integrates natively with NestJS via
`@nestjs/typeorm` and decorators (`@Entity`, `@ManyToOne`) on the same classes
used elsewhere in the app, avoiding a separate schema file and generated client
step. The cost was a real one: TypeORM's decorator metadata combined with a
circular `User`↔`Property` relation caused a `ReferenceError` under the
backend's ESM module setup, which took real debugging effort to resolve (see
`docs/ai_usage.md`). Prisma's generated client would likely have sidestepped
that specific issue, at the cost of an extra build step and a less direct
mapping between entity classes and validation DTOs.

---

## Authentication: wallet-signature (MetaMask) + JWT, not passwords

**Alternative considered:** traditional email/password with a hashed password
column, matching the original proposal's `User.email`/`passwordHash` fields.

**Why wallet-signature:** The product is wallet-first — every user already
needs MetaMask to eventually pay in ETH, so requiring a second, separate
credential (a password) would be redundant and worse UX. Verifying a signed
message (`ethers.verifyMessage`) against the claimed address is enough proof of
identity without storing any secret server-side.

**Trade-off accepted:** losing a wallet means losing the account — there's no
password reset flow, and no email-based recovery. That's an accepted limitation
for this MVP, not an oversight.

---

## Blockchain (planned, Milestone 3): Solidity + Hardhat + ethers.js + OpenZeppelin

**Alternatives considered:** Foundry instead of Hardhat, writing the escrow
logic from scratch instead of extending OpenZeppelin.

**Why Hardhat over Foundry:** better fit for a team already writing
TypeScript everywhere else — Hardhat's test/scripts layer is JS/TS-native,
so the same language and tooling knowledge carries over from the backend.
Foundry's Solidity-native testing is generally faster and more idiomatic for
contract-heavy projects, which would matter more if the contract surface were
larger than a single escrow contract.

**Why OpenZeppelin over custom contracts:** reentrancy and access-control bugs
in hand-rolled escrow logic are a well-known way for real money to get stuck or
stolen. Building on audited, widely-used base contracts reduces that risk for
a small team without a dedicated security audit budget.

---

## DevOps: Docker (database only, for now)

**Alternative considered:** a locally installed PostgreSQL instance, no
containerization.

**Why Docker:** guarantees both team members run the exact same PostgreSQL
version without "works on my machine" issues, and matches the eventual
deployment target described in the Statement of Work. Full containerization of
the backend and frontend is scoped for a later delivery — for now, only the
database runs in Docker, while the backend and frontend run directly with
`nest start`/`next dev` for faster iteration during active development.