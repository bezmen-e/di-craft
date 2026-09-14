<h1 align="center">di-craft</h1>

<p align="center">
  <img src="./assets/logo.png" alt="di-craft" width="160" />
</p>

Monorepo for `di-craft`, a tiny, type-safe dependency injection container for
TypeScript.

## Links

- Documentation: Cloudflare Pages site, built from [`site/`](./site)
- Package README: [`packages/di-craft/README.md`](./packages/di-craft/README.md)
- npm package: [`di-craft`](https://www.npmjs.com/package/di-craft)

## Workspace layout

```txt
packages/di-craft/  npm package source, tests, examples, and benchmarks
site/               Astro Starlight documentation site
assets/             shared repository assets
.config/mise/       monorepo-wide mise tools, env, and task orchestration
```

## Commands

```bash
mise install
bun install
bun run ci
bun run build:lib
bun run build:site
bun run test:lib
bun run dev:site
```

The root `bun run ...` scripts are thin wrappers around `mise run ...`, so the
toolchain and task graph stay in one place.

## Cloudflare Pages

The documentation site deploys to Cloudflare Pages through GitHub Actions,
following the same direct-Wrangler shape as `karkas`.

Required GitHub configuration:

```txt
CLOUDFLARE_API_TOKEN  repository secret
CLOUDFLARE_ACCOUNT_ID repository variable
```

Deployment flow:

```txt
mise run build:cf-pages
npx --yes wrangler@4 pages deploy .var/dist/cf-pages --project-name=di-craft --branch=main
```

The Pages project name is `di-craft`, so the free Pages domain is
`https://di-craft.pages.dev`.
