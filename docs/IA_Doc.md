# AI Usage Documentation

## Purpose

This document discloses, transparently and specifically, where and how AI assistance
(Claude, by Anthropic) was used during the development of Rynok: Entrega 1 (Milestones 1
and 2) and Entrega 3 (Milestones 3–5 review, hardening, and deployment). It is intended to accompany the Statement of Work and MVP Scope documents as
supporting evidence for the "Context Engineering" and "AI usage" evaluation criteria.

The team's position is that AI was used as a **pair-programming and code-review tool**,
not as an unsupervised code generator. Every AI-assisted change listed below was reviewed,
compiled, tested, and run locally by a team member before being committed.

---

## Where AI was used

### 1. Delivery planning and commit breakdown

AI was used to translate the project's GitHub issues (RYN-001 through RYN-010) and
milestone structure (already defined in the Statement of Work) into a concrete,
ordered list of 30 commits for Entrega 1, split between the two team members by
milestone ownership (Leidy: Milestone 1 — Foundation & Authentication; Diego: Milestone 2
— Property Marketplace).

For each commit, AI proposed the specific files to create/modify and a first draft of
the code (NestJS modules, TypeORM entities, DTOs, Next.js pages/components, unit and
e2e tests). Team members then applied, adjusted, and committed this code themselves.

### 2. Post-delivery bug diagnosis and fixes

After the 30 commits were implemented, the project did not compile or run. AI was used
to diagnose and fix the following categories of issues, verified by actually compiling
(`tsc --noEmit`), running the test suites (`vitest run`), and producing a production
build (`next build`) — not just by reading the code:

- **ESM/NodeNext import errors**: relative imports missing the `.js` extension required
  by the backend's module configuration.
- **Misplaced/incorrect file content**: a DTO file that contained the wrong code, a
  frontend page placed in the wrong directory (breaking the `/properties` route),
  and test files placed in the wrong folders.
- **Wiring bugs**: `AuthModule` and `PropertyModule` were never registered in
  `AppModule`, so their routes did not exist at runtime despite compiling.
- **Circular entity relationship**: `User` and `Property` reference each other
  (`ManyToOne`/`OneToMany`), which under ESM combined with TypeORM's decorator
  metadata caused a `ReferenceError` at startup. Fixed using string-based relation
  targets and type-only imports, per TypeORM's documented pattern for this scenario.
- **Version-specific breaking changes**: Next.js 16 changed `params`/`searchParams` in
  Server Components to be `Promise`-based; this was not caught by the type checker or
  by unit tests, only by running `next build`.
- **Test framework mismatches**: tests written with Jest syntax (`jest.fn()`) running
  under Vitest, and a Vitest 5.0.0 / `@testing-library/jest-dom` 7.0.1 type
  incompatibility, resolved by pinning Vitest to a known-working version.
- **Local environment issues** (Docker Compose v1 incompatibility with a recent Docker
  Engine version, a port conflict on 5432): diagnosed interactively and resolved with
  the team member running the suggested commands and reporting output back.

A full list of these fixes is also recorded in the corresponding git commit message
(`fix: corregir bugs de compilación y build (revisión asistida por IA)`).

### 3. Frontend visual redesign

AI was used to translate a static HTML/Tailwind mockup (provided by the team) into
the actual Next.js component structure: Navbar, Footer, Hero, property cards, search
and filter UI, property detail layout, publish/edit forms, and a dashboard/wallet
section using real data from the already-implemented backend (no fabricated data).

Where a mockup screen depended on functionality outside Entrega 1's scope (the escrow
purchase flow, transaction history), AI was explicitly instructed to build an honest
placeholder ("coming in a future delivery") rather than simulate data for a feature
that does not exist yet, to avoid misrepresenting the project's real functional state.

---

## Entrega 3 — review, escrow hardening, and Sepolia deployment

For Milestones 3–5, the team used **Claude Code** (an agent running in VS Code with
access to the local repository and a terminal) to review, test, and run the
application. Unlike the previous deliveries, the agent ran commands directly: it
installed dependencies, ran the test suites, started the backend, frontend,
PostgreSQL, and a local Hardhat node, and wrote throwaway scripts that drove the
real API and contract.

### 1. Review and bug fixes

The agent ran each part of the application and attacked it with integration
scripts. This found defects that the existing tests did not catch, and each was
fixed and then reproduced as a test:

- **Security**:
  - `JWT_SECRET` was read before `.env` was loaded, so tokens were always signed with a default secret (confirmed by forging a token);
  - the backend registered escrow deposits without checking the transaction, the buyer, the price, or the property status;
  - the login message could be replayed (now uses single-use nonces).
- **Escrow**:
  - funds could get stuck: there was no UI to confirm delivery or refund, and the backend had no refund endpoint;
  - a refunded property could never be sold again;
  - a 1-wei deposit could block any property.
- **Frontend**:
  - a duplicated React installation broke 8 of 11 tests;
  - switching MetaMask accounts or networks led to on-chain deposits that the backend could not register;
  - error pages returned 500 instead of 404.
- **Configuration**:
  - a dependency that required `git` to install;
  - `.env.local` was not in `.gitignore`;
  - a port conflict on 5432;
  - broken documentation links.

### 2. Design decisions

The team set the requirements for the escrow redesign:

- keep publishing free of on-chain transactions;
- add an "enable purchase" step with `list(propertyId, price)`;
- add a minimal delivery deadline;
- leave dispute resolution out of scope.

The agent pointed out that keying listings by `propertyId` alone would move the
squatting attack to `list`, and proposed keying them by `(propertyId, seller)`.
The team accepted that change before it was implemented.

### 3. Deployment and validation

At the team's request, the agent deployed `Escrow` to Sepolia using the team's test
wallet, configured in `contracts/.env`. The agent never displayed or stored the
private key elsewhere. It then ran the full purchase and refund flows against the
deployed contract, with the team's wallet as seller and a temporary wallet as
buyer, and returned the remaining test ETH to the team's wallet.

Verification was the same as in earlier deliveries, but done by the agent itself:
`tsc --noEmit`, `vitest run`, `hardhat test`, `next build`, and the integration runs
documented in [test_evidence.md](test_evidence.md).

---

## What AI was _not_ used for

- AI did not make product or scope decisions. Scope (what is IN/OUT/LATER for the MVP,
  the milestone breakdown, and issue definitions) was defined by the team beforehand,
  in the Statement of Work and MVP Scope documents, before any AI-assisted coding began.
- AI did not push code, open pull requests, or make commits on behalf of the team.
  All commits were authored and pushed by Diego Chourio and Leidy Obando. The only
  outward-facing action taken by AI was the Sepolia testnet deployment and test
  transactions described above, done at the team's explicit request.
- AI-suggested fixes were not accepted blindly: each was checked against the actual
  compiler, test runner, and build output before being considered resolved.

---

## Tooling

- **Model**: Claude (Anthropic). Entregas 1–2: through a chat interface. Entrega 3:
  through Claude Code, an agent with access to the local repository and terminal.
- **Verification method**: Entregas 1–2 used a sandboxed copy of the repository to
  apply candidate fixes, run `tsc --noEmit`, `vitest run`, and `next build`, and
  confirm the result before handing the corrected files back to the team. In
  Entrega 3 the agent ran the same checks, plus `hardhat test` and integration
  runs on a local node and on Sepolia, directly in the team's working copy.

---

## Iteration 3.1 (2026-11-17): demo and defense hardening

**Tool**: Claude Code (Claude Opus 5.5) acting as an agent in the local repository, on the branch `mejoras-demo-defensa`. The work was done at the team's request, with explicit rules: never read `.env` files, never mark anything as done without running it, small commits, and no push.

**What the AI produced.** Every commit on the branch carries a `Co-Authored-By: Claude` trailer:

- **Backend hardening**: helmet, CORS restricted by `CORS_ORIGINS`, rate limiting with `trust proxy`, a uniform error filter, `GET /health`, fail-closed on-chain verification in production, unique deposit hashes, pagination and sorting, `/properties/mine`, an idempotent seed with `DEMO_PRICE_SCALE`, and `render.yaml` fixes (`NODE_ENV`, `CORS_ORIGINS`, `--include=dev`).
- **Frontend redesign**: a design system (tokens and accessible components) and every screen rewritten on top of it. The existing contract integration, image upload, and onboarding were kept and restyled.
- **Tests**: 66 backend unit + 23 e2e, 131 frontend, and 6 Playwright browser e2e against a real stack that deploys `Escrow.sol`. Also CI, Dockerfiles, Prettier, and lint.
- **Documentation**: `architecture.md`, `System-Diagrams.md`, `security.md`, `style_guide.md`, `demo_script.md`, `guia_defensa.md`, and `decisions.md`, plus updates to the README and `test_evidence.md`.

**What the AI did not do.** It did not modify `Escrow.sol` or redeploy it. It did not touch `main` or push. It did not read any `.env` file: local runs received their variables through process environment, and the e2e tests use the public Hardhat test accounts.

**How it was verified.** Every change was checked by running `tsc`, oxlint and ESLint with zero warnings, `prettier --check`, all test suites, `next build`, the Docker images, and the Playwright suite, whose output is recorded in [test_evidence.md](test_evidence.md). Problems the AI introduced and then fixed during the process:

- A build command that would have failed on Render once `NODE_ENV=production` was set.
- A helmet default that would have blocked cross-origin images.
- A non-writable `uploads/` folder in the Docker image.

**Team responsibility.** The team must review and understand these changes before the individual defense. [guia_defensa.md](guia_defensa.md) is written for that purpose.

---

Prepared by:

- Diego Chourio
- Leidy Obando
