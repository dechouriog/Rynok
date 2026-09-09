# AI Usage Documentation

## Purpose

This document discloses, transparently and specifically, where and how AI assistance
(Claude, by Anthropic) was used during the development of Rynok's Entrega 1 (Milestones 1
and 2). It is intended to accompany the Statement of Work and MVP Scope documents as
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

## What AI was *not* used for

- AI did not make product or scope decisions. Scope (what is IN/OUT/LATER for the MVP,
  the milestone breakdown, and issue definitions) was defined by the team beforehand,
  in the Statement of Work and MVP Scope documents, before any AI-assisted coding began.
- AI did not push code, open pull requests, or make commits on behalf of the team.
  All commits were authored and pushed by Diego Chourio and Leidy Obando.
- AI-suggested fixes were not accepted blindly: each was checked against the actual
  compiler, test runner, and build output before being considered resolved.

---

## Tooling

- **Model**: Claude (Anthropic), used through a chat interface.
- **Verification method**: a sandboxed copy of the repository was used to apply
  candidate fixes, run `tsc --noEmit`, `vitest run`, and `next build`, and confirm the
  result before handing the corrected files back to the team.

---

Prepared by:

- Diego Chourio
- Leidy Obando