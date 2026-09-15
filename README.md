# di-craft

Monorepo for [`di-craft`](https://www.npmjs.com/package/di-craft), a small,
type-safe dependency injection library for TypeScript.

- [Documentation](https://di-craft.pages.dev)
- [Package README](./packages/di-craft/README.md)

## Workspace

```txt
packages/di-craft/  Library source and tests
docs/               Astro Starlight site and type-checked examples
benchmarks/          Comparative DI benchmarks and recorded results
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

GitHub Actions runs the same `mise run ci` pipeline for every pull request and
push to `main`. The repository is small enough that always running the complete
pipeline is clearer and safer than maintaining path-based skip logic.

## Documentation deployment

GitHub Actions deploys the generated site to the `di-craft` Cloudflare Pages
project after documentation-related changes reach `main`. The `production`
GitHub Environment is restricted to `main` and owns the deployment credentials:

- `CLOUDFLARE_API_TOKEN` as an environment secret
- `CLOUDFLARE_ACCOUNT_ID` as an environment variable

Wrangler is an exact-pinned root development dependency because deployment is a
repository-level concern. The release workflow does not deploy documentation.

## Package release

Set the version in `packages/di-craft/package.json`, commit the change, and push
a matching `v<version>` tag. The release workflow tests and builds the package in
jobs without OIDC publishing permission. A separate minimal job downloads the
build artifact and runs npm Staged Publishing through Trusted Publishing.

After the workflow succeeds, review and approve the staged version on npm. No
long-lived npm token is stored in GitHub.
