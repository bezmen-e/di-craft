# Roadmap

Development plan for the `di-craft` monorepo, organized as three horizons —
P1 (the next month, reliability and trust), P2 (the quarter, feature
development), P3 (strategy, growing as a project) — plus a background section
for small chores and externally blocked work. Tooling and release procedures
live in [TOOLING.md](./TOOLING.md); user-facing changes are recorded in the
[changelog](./packages/di-craft/CHANGELOG.md).

## Shipped recently (v0.0.35 → v0.0.36)

- **Resolver performance** (#21): deep graph resolve −33%, wide graph (10
  dependencies) −21%, first resolve −19%. Internals reworked without public API
  changes: allocation-free dependency iteration, inlined recursion, lazily
  allocated resolution context and instance store.
- **Public benchmark suite** (#21): the `benchmarks/` workspace compares
  `di-craft` with six DI subjects (including needle, tsyringe, and awilix)
  using the InferDI methodology — isolated processes, balanced rounds,
  median/MAD aggregation — with recorded JSON results and the interactive
  performance page at
  [di-craft.pages.dev/performance](https://di-craft.pages.dev/performance/).
  This closes the benchmark item from the earlier plan.
- **Hydration** (#24, #25): framework-agnostic `di-craft/hydration` entry point
  (`dehydrate`, `hydrate`) and `createSnapshotBus` — a TTL holder for streamed
  snapshots that arrive before their consumers mount.
- **Request context** (#26): Node and Next adapters forward an optional request
  `context` into `requestProviders`, so different request kinds can register
  different provider sets.
- **Release automation** (#27–#31): changesets now manage versioning and the
  changelog through the Version Packages pull request.
- **Secure publishing** (#30, #34–#36): tag-triggered publish workflow with npm
  Trusted Publishing and staged releases approved manually with 2FA;
  harden-runner switched from audit to block with allow-lists collected from an
  audited run; the secure release checklist is complete.
- **Repository hygiene** (#32, #33, #37): changelog moved next to the package,
  CI workflow renamed to Checks, local editor settings (`.zed/`) untracked,
  lockfile workspace version synced.
- **GitHub Releases restored**: backfilled v0.0.29 → v0.0.36 from the
  changelog ("Latest" had been stuck on v0.0.28), and a tag-triggered workflow
  now creates each release automatically with changelog-extracted notes under
  the same tag-versus-version guard as the Publish workflow.

## P1 — The next month: reliability and trust

- **Disposal semantics.** `AggregateError` when multiple dispose hooks fail; an
  explicit decision on use-after-dispose (throw or documented behavior); tests
  for both scenarios.
- **Uniform error hierarchy.** Adapter and hydration errors (Next runtime
  failures, hydration mismatches) inherit from `DiError` like the core errors
  already do, so one root type covers every catch block.
- **Harden `createChildContainer`** against foreign `Container` implementations
  passed as the parent.
- **Trust documentation.** A caution about `onDispose` in RSC render
  containers; an "async dependencies" section; an explanation of why the
  lifetime rules are strict; a troubleshooting page with an error table — the
  error messages are good, give them an index.
- **Docs examples.** Fill the empty `examples/` and `adapters/` sections of the
  docs site with worked, type-checked walkthroughs: Next.js App Router (RSC,
  request containers, hydration with the snapshot bus) and Node HTTP.
- **Community files.** CONTRIBUTING.md plus issue and pull request templates.
- **CI quality gates**, as promised in TOOLING.md: coverage through Bun LCOV
  retained by CI with thresholds starting from the observed baseline; package
  size budgets for the npm tarball and public entry points, gated against a
  recorded baseline instead of an arbitrary universal limit.

## P2 — The quarter: feature development

- **Test utilities** — the most requested next step for a DI library:
  `createTestContainer(base, { overrides })` or a token-substitution helper.
  It sharply lowers the adoption barrier.
- **Devtools.** `container.inspect()` and dependency-graph export to
  Mermaid/DOT. For an "explicit composition" library, graph visualization is a
  killer feature: it sells the core idea itself.
- **Aliases and multi-providers.** `useExisting`-style aliases and, likely,
  multi-providers (an array under one token, plugin-style) — frequent requests
  of any DI library.
- **Hono adapter.** The fastest-growing TypeScript server framework; the
  adapter is cheap (the same ALS pattern as Node) and widens the audience
  noticeably.
- **Deeper Next/RSC patterns.** Grow the snapshot bus and per-request provider
  sets into canonical documented patterns: streaming hydration, auth-aware
  request containers.

## P3 — Strategy: growing as a project

- **Own the niche: "DI for the Next.js App Router".** Neither tsyringe, nor
  awilix, nor needle has an RSC render scope via React `cache` plus a typed
  dehydrate/hydrate bridge. That is the moat; extend it with guides: auth
  context per request, database connection pools, server actions + hydration
  into the client container, adopting di-craft in an existing app.
- **Migration guides** from tsyringe, inversify, and awilix with concept
  mapping tables and code diffs.
- **Promotion.** Two or three articles ("Dependency injection in React Server
  Components", "Why we do not use reflect-metadata", and the benchmark story
  built on the public suite), a Next.js + di-craft template repository,
  Show HN / Reddit r/nextjs posts, GitHub topics, and a usage demo in the
  README. For a library of this class, obscurity — not code — is the main
  constraint.
- **Road to 1.0.** After P1–P2: fix the public API (add a snapshot of the
  public exports next to `public-api-types.test.ts` so it cannot break by
  accident), run a stability review of core/hydration/adapters, and publish a
  semver policy. Until then, versions below 1.0.0 keep the freedom to ship
  breaking changes in minor releases.

## Background — chores and externally blocked work

- **TypeScript 7 migration.** Blocked until TS 7.1 stable ships (expected end
  of November 2026) with `@astrojs/ts-content-mapper` support in `astro check`;
  typedoc and starlight-typedoc must also catch up with the new compiler API.
  Then migrate the whole workspace in one pass.
