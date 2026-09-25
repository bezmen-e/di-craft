# Tooling

This document explains which tool owns each part of the `di-craft`
development workflow. Public library documentation lives under `docs/`.

## Ownership

| Tool | Responsibility |
| --- | --- |
| Bun | Workspace dependencies, lockfile, and library tests |
| mise | Tool versions, environment, and task orchestration |
| Biome | Formatting, linting, imports, and safe code actions |
| TypeScript | Library, adapter, test, and docs type-checking |
| hk | Fast checks and Git hooks backed by mise tasks |
| Fallow | Dead-code, dependency, and duplicate-code analysis |
| tsdown | ESM bundles, declarations, Publint, and ATTW |
| Astro, Starlight, TypeDoc | Documentation site and API reference |
| Wrangler | Cloudflare Pages deployment |
| GitHub Actions | CI, documentation deployment, and npm publishing |

## Workflow

Bun is the package manager and test runner. mise does not replace it: mise pins
the required tools and gives local development, Git hooks, and CI one shared
set of commands. Root `package.json` scripts are shortcuts to the same mise
tasks, not a second workflow definition.

Initial setup:

```sh
mise install
bun install
```

Everyday commands:

| Command | Purpose |
| --- | --- |
| `mise run check` | Run the hk check pipeline |
| `mise run fix` | Apply supported formatting and lint fixes |
| `mise run validate` | Apply fixes, then run the complete pipeline |
| `mise run ci` | Run the same non-mutating checks as CI |
| `mise tasks ls` | List available root and workspace tasks |

Run a workspace directly when narrowing the feedback loop:

```sh
mise run //packages/di-craft:test
mise run //packages/di-craft:build
mise run //docs:typecheck
mise run //docs:build
```

## Configuration

- `mise.toml` and `.config/mise/`: tools and repository workflows;
- `packages/di-craft/mise.toml`: library checks, tests, and builds;
- `docs/mise.toml`: documentation tasks;
- `biome.json`: repository formatting and linting policy;
- `.config/hk.pkl`: local checks and Git hooks;
- `.config/fallow.toml`: repository analysis scope;
- `packages/di-craft/tsdown.config.ts`: published package artifacts;
- `.github/workflows/`: CI, deployment, and releases.

## Planned quality work

- **Benchmarks:** a compact, reproducible suite with warm-up, fixed samples,
  runtime metadata, and a measured noise budget before it can block CI.
- **Package size:** budgets for the npm tarball and public entry points, based
  on a recorded baseline rather than an arbitrary universal limit.
- **Coverage:** Bun LCOV output retained by CI and shown as a concise summary or
  badge; thresholds should start from an observed baseline.

These items are not implemented yet. Add their commands here only after the
corresponding mise tasks exist.
