# Roadmap

Development plan for the `di-craft` monorepo, organized as four tracks. Track A
is the current focus, track D runs in the background, track B follows A
starting with the Hono adapter, and track C is gated on real-world usage
feedback. Tooling and release procedures live in [TOOLING.md](./TOOLING.md);
user-facing changes are recorded in the
[changelog](./packages/di-craft/CHANGELOG.md).

## Shipped recently (v0.0.35 → v0.0.36)

- **Resolver performance** (#21): deep graph resolve −33%, wide graph (10
  dependencies) −21%, first resolve −19%. Internals reworked without public API
  changes: allocation-free dependency iteration, inlined recursion, lazily
  allocated resolution context and instance store.
- **Public benchmark suite** (#21): the `benchmarks/` workspace compares
  `di-craft` with six DI subjects using the InferDI methodology (isolated
  processes, balanced rounds, median/MAD aggregation), with recorded JSON
  results and the interactive performance page at
  [di-craft.pages.dev/performance](https://di-craft.pages.dev/performance/).
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

## Track A — Adoption and content (current focus)

Engineering is in good shape; the bottleneck is awareness and human-facing
documentation. The generated API reference covers every symbol, but the
`examples/` and `adapters/` sections of the docs site are still empty.

- **Docs examples.** Fill the empty sections with worked, type-checked
  examples: a Next.js App Router walkthrough (RSC, request containers,
  hydration with the snapshot bus), a Node HTTP walkthrough, and an "adopting
  di-craft in an existing app" recipe.
- **Migration guides.** Step-by-step guides from tsyringe, inversify, and
  awilix with concept mapping tables and code diffs.
- **Benchmark story.** Turn the public benchmark suite into an article (dev.to
  / Habr): methodology, results against six DI libraries, and what the
  optimizations changed. The data and the performance page already exist.
- **Release visibility.** GitHub Releases stop at v0.0.28 while tags continue
  to v0.0.36, so "Latest" is stale. Backfill release notes from the changelog
  and generate them per tag from now on.
- **Repository presentation.** Topics and description on GitHub, a short
  usage demo in the README.

## Track B — Adapters and ecosystem

- **Hono adapter** is next: TypeScript-first, minimal, and aligned with the
  library's positioning. Request containers and the request `context` from
  v0.0.36 are the building blocks.
- **Deepen Next/RSC patterns.** The snapshot bus and per-request provider sets
  are new; grow them into canonical, documented patterns (streaming
  hydration, auth-aware request containers).
- **Further adapters** (Astro, SvelteKit, TanStack Start) follow real user
  demand, not speculation — each adapter is permanent maintenance surface.

## Track C — Road to 1.0

Deliberately last: freezing the API without user feedback would lock in
design decisions in a vacuum. Versions below 1.0.0 may still include breaking
changes in minor releases, which is an advantage while the surface settles.

- **Entry criteria:** measurable adoption from tracks A and B, and a period
  without API-shape changes requested by real usage.
- **Stability review:** audit the public surface (core, hydration, adapters),
  stabilize the hydration layer, then declare an API freeze.
- **Semver guarantees:** publish the compatibility policy and honor it from
  1.0.0.

## Track D — Engineering gates (background)

- **Package size budgets.** Record the npm tarball and per-entry-point size
  baseline, then gate growth in CI relative to that baseline instead of an
  arbitrary universal limit.
- **Coverage baseline.** Retain Bun LCOV output in CI, show a concise summary
  or badge, and set thresholds from the observed baseline.
- **TypeScript 7 migration.** Deferred until TS 7.1 stable ships (expected end
  of November 2026) with `@astrojs/ts-content-mapper` support in `astro check`;
  typedoc and starlight-typedoc must also catch up with the new compiler API.
  Then migrate the whole workspace in one pass.
- **README release section.** It still describes the manual "bump version,
  push tag" flow; sync it with the changesets procedure in TOOLING.md.
