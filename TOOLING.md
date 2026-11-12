# Tooling

This document explains which tool owns each part of the `di-craft`
development workflow. Public library documentation lives under `docs/`.

## Ownership

| Tool                      | Responsibility                                         |
| ------------------------- | ------------------------------------------------------ |
| Bun                       | Workspace dependencies, lockfile, and library tests    |
| mise                      | Tool versions, environment, and task orchestration     |
| Biome                     | Formatting, linting, imports, and safe code actions    |
| TypeScript                | Library, adapter, test, and docs type-checking         |
| hk                        | Fast checks and Git hooks backed by mise tasks         |
| Fallow                    | Dead-code, dependency, and duplicate-code analysis     |
| tsdown                    | ESM bundles, declarations, Publint, and ATTW           |
| Astro, Starlight, TypeDoc | Documentation site and API reference                   |
| Tinybench                 | Comparative benchmark measurements under `benchmarks/` |
| Changesets                | Version bumps, changelog entries, and the release PR   |
| Wrangler                  | Cloudflare Pages deployment                            |
| GitHub Actions            | Checks, release PR, npm staging, and docs deployment   |

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

| Command             | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `mise run check`    | Run the hk check pipeline                   |
| `mise run fix`      | Apply supported formatting and lint fixes   |
| `mise run validate` | Apply fixes, then run the complete pipeline |
| `mise run ci`       | Run the same non-mutating checks as CI      |
| `mise tasks ls`     | List available root and workspace tasks     |

Run a workspace directly when narrowing the feedback loop:

```sh
mise run //packages/di-craft:test
mise run //packages/di-craft:build
mise run //docs:typecheck
mise run //benchmarks:quick
mise run //docs:build
```

## Configuration

- `mise.toml` and `.config/mise/`: tools and repository workflows;
- `packages/di-craft/mise.toml`: library checks, tests, and builds;
- `docs/mise.toml`: documentation tasks;
- `benchmarks/mise.toml`: comparative benchmark install, validation, and runs;
- `biome.json`: repository formatting and linting policy;
- `.npmrc` and `bunfig.toml`: 3-day cooldown before installing newly
  published dependency versions (`min-release-age`, `minimumReleaseAge`);
- `.config/hk.pkl`: local checks and Git hooks;
- `.config/fallow.toml`: repository analysis scope;
- `.changeset/`: pending changesets and the Changesets config;
- `packages/di-craft/tsdown.config.ts`: published package artifacts;
- `.github/workflows/`: CI, releases, and documentation deployment.

## Releases

Releases flow through Changesets, the Release workflow, and the tag-triggered
Publish workflow:

1. Every user-facing pull request adds a changeset (`bun run changeset`,
   `patch` while the library is versioned `0.0.x`).
2. Merging to `main` makes the Release workflow open or update the Version
   Packages pull request: it consumes the changeset files, bumps
   `packages/di-craft/package.json`, and generates
   `packages/di-craft/CHANGELOG.md`.
3. Merge the Version Packages pull request, then push the matching tag:
   `git tag vX.Y.Z && git push origin vX.Y.Z`.
4. The tag starts the Publish workflow: a build job validates the library and
   uploads `dist/`, then an isolated publish job (no workspace dependencies,
   only `id-token: write`) verifies the tag against the package version and
   stages the release on npm (`npm stage publish`) through OIDC trusted
   publishing. Harden-runner blocks all egress except allow-listed endpoints
   in both jobs. Nothing is published automatically.
5. Approve the staged release on npmjs.com with 2FA — that human act publishes
   the package.
6. Dispatch the Docs workflow to deploy the Astro site to Cloudflare Pages
   once the package is public.

The trusted publisher on npmjs.com is bound to `publish.yaml`, so publishing
must stay in that workflow: the publish job keeps `id-token` isolated from the
build, from third-party release tooling, and from every push to `main`.

## Benchmarks

The `benchmarks/` workspace compares `di-craft` with six DI subjects using the
InferDI methodology: isolated per-subject processes, balanced rounds, and
median/MAD aggregation. Results are recorded as JSON under
`benchmarks/results/` and rendered to Markdown with the report task. The docs
performance page embeds an interactive SVG chart generated from the same
publishable result with `benchmarks:chart`. Quick runs are for local iteration
only; publishable claims use `benchmarks:public`.

```sh
bun run benchmarks:install
bun run benchmarks:precondition
bun run benchmarks:quick    # local iteration, single round
bun run benchmarks:public   # publishable, 14 balanced rounds
```

Benchmarks are intentionally not part of `mise run ci`: they are too slow and
too noisy on shared runners to gate merges. CI only type-checks the workspace
and runs its adapter tests.

## Planned quality work

- **Package size:** budgets for the npm tarball and public entry points, based
  on a recorded baseline rather than an arbitrary universal limit.
- **Coverage:** Bun LCOV output retained by CI and shown as a concise summary or
  badge; thresholds should start from an observed baseline.

These items are not implemented yet. Add their commands here only after the
corresponding mise tasks exist.
