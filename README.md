# di-craft

Monorepo for `di-craft`, a tiny, type-safe dependency injection container for
TypeScript.

## Workspace layout

```txt
packages/di-craft/  npm package source, tests, examples, benchmarks, and docs
apps/               applications such as the future Astro documentation site
.config/mise/       monorepo-wide mise tools, environment, and task orchestration
```

## Commands

```bash
mise install
mise run install
mise run check
mise run ci
mise run checks
mise run build
mise run test
mise run bench
```

The root `bun run ...` scripts are kept as compatibility wrappers around
`mise run ...`.

The npm package README lives at
[`packages/di-craft/README.md`](./packages/di-craft/README.md).
