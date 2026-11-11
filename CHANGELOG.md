# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Versions below `1.0.0` may include breaking changes in minor releases.

Entries before `0.0.34` were reconstructed from the Git history.

## [Unreleased]

### Changed

- Simplified `provideFactory` provider object construction (internal refactor,
  no API changes).
- Rewrote resolver host selection as an exhaustive switch (internal refactor,
  no API changes).
- Optimized the resolver hot path (measured by the public benchmark suite,
  median of 14 balanced rounds, Apple M5 Pro / Bun 1.4.2):
  - deep graph (10 levels) resolve: 272.9 → 181.7 ns/op (−33%);
  - wide graph (10 dependencies) resolve: 154.2 → 122.5 ns/op (−21%);
  - first resolve: 225.4 → 183.3 ns/op (−19%);
  - transient resolve: 38.7 → 32.6 ns/op (−16%);
  - wide graph (4 dependencies) resolve: 64.1 → 54.1 ns/op (−16%).

  Internals: dependency iteration without key-array allocation, inlined
  dependency recursion, lazily allocated shared resolution context, inlined
  scope-host selection, and a lazily allocated instance store. No public API
  changes.

### Added

- Comparative benchmark workspace under `benchmarks/`, adapted from the InferDI
  benchmark methodology: per-subject process isolation, balanced rounds,
  median/MAD aggregation, and reproducible JSON results.
- Performance guide on the documentation site with the recorded public
  benchmark results and measurement design.
- This changelog.

### Removed

- Empty leftover `packages/di-craft/bench/` directory.

## [0.0.34] - 2026-09-15

### Added

- Astro Starlight documentation site with type-checked examples and a
  generated API reference, deployed to Cloudflare Pages.
- Split GitHub Actions workflows for the library and the documentation site.

## [0.0.33] - 2026-09-13

### Changed

- Migrated the repository to a Bun workspace monorepo
  (`packages/di-craft` + `docs`).
- Added Fallow dead-code and duplicate analysis to the quality pipeline.
- Updated Bun to 1.4 and refreshed the toolchain.

## [0.0.29]–[0.0.32] - 2026-08-27

### Changed

- README rewrites for clearer positioning; package discoverability fixes.

## [0.0.27]–[0.0.28] - 2026-07-12

### Changed

- Package validation and release automation reworked; switched to npm Trusted
  Publishing with staged releases and no long-lived npm tokens.

## [0.0.26] - 2026-07-12

### Changed

- Documentation clarifications for AsyncLocalStorage-first Next.js runtimes
  and request-boundary edge cases.
- Docs and examples excluded from the published package.

## [0.0.25] - 2026-07-09

### Added

- Node.js adapter (`di-craft/node`): AsyncLocalStorage-backed request
  containers with `runWithRequestContainer()` and explicit disposal.

## [0.0.23]–[0.0.24] - 2026-06-29

### Added

- Documentation examples for Next.js patterns and an annotation guide.

## [0.0.21]–[0.0.22] - 2026-06-26

### Changed

- Improved package discoverability, build safety, docs, and type-checked
  examples.

## [0.0.19]–[0.0.20] - 2026-06-23

### Added

- Next.js App Router adapter (`di-craft/next/server`, `di-craft/next/client`):
  RSC render-scoped containers through React `cache`, disposable request
  containers, and typed `dehydrate`/`hydrate` state snapshots.

## [0.0.18] - 2026-06-22

### Added

- `@Injectable` class decorator and `provideInjectable()` with explicit,
  position-ordered constructor dependencies (no `reflect-metadata`).
- Public API type tests and an explicit-return-type lint rule.

## [0.0.14]–[0.0.17] - 2026-06-10

### Changed

- Dropped the CJS build; the package is ESM-only.
- README, logo, badges, and keyword updates.

## [0.0.12]–[0.0.13] - 2026-06-10

### Added

- Optional dependencies via `optional(token)`, usable in factory `deps` and
  `container.get`.
- Strict provider guards: lifetime-capture validation and leak-safe provider
  overrides.

## [0.0.11] - 2026-06-05

### Added

- Child containers with scoped resolution (`createChildContainer`).
- Cycle detection extracted into a dedicated `ResolutionContext`.

## [0.0.10] - 2026-06-03

### Added

- Core dependency container: typed tokens, value and factory providers,
  dependency resolver with cycle detection and scope caching, async disposal.

## [0.0.3]–[0.0.9] - 2026-06-02

### Added

- Initial releases; npm publishing pipeline iterations.

[Unreleased]: https://github.com/bezmen-e/di-craft/compare/v0.0.34...HEAD
[0.0.34]: https://github.com/bezmen-e/di-craft/releases/tag/v0.0.34
[0.0.33]: https://github.com/bezmen-e/di-craft/releases/tag/v0.0.33
