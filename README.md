# di-craft

Monorepo for [`di-craft`](https://www.npmjs.com/package/di-craft), a small,
type-safe dependency injection library for TypeScript.

- [Documentation](https://di-craft.pages.dev)
- [Package README](./packages/di-craft/README.md)

## Workspace

```txt
packages/di-craft/  Library source, tests, and benchmarks
docs/               Astro Starlight site and type-checked examples
assets/             Shared repository assets
.config/mise/       Toolchain and task orchestration
```

## Development

```sh
mise install
bun install
bun run ci
bun run build:lib
bun run build:docs
bun run test:lib
bun run dev:docs
```

The root Bun scripts delegate to the shared mise task graph.

## Documentation deployment

GitHub Actions deploys the generated site to Cloudflare Pages. The repository
needs `CLOUDFLARE_API_TOKEN` as a secret and `CLOUDFLARE_ACCOUNT_ID` as a
variable. The Pages project is named `di-craft`.
