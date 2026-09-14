# di-craft Documentation Site Redesign

**Date:** 2026-09-14  
**Status:** Approved for implementation planning

## Summary

Replace the current `site/` MVP with a production documentation workspace named
`docs/`. Move the package-authored guides and typed documentation examples out
of `packages/di-craft`, generate the API reference from public TypeScript entry
points with `starlight-typedoc`, and reduce the package README to a concise
installation and documentation entry point.

The structure follows the OpenAI Agents JS documentation workspace, scaled down
for one library with four public import paths. The information architecture and
minimal package README follow the successful separation used by wagmi, while
the implementation remains Astro and Starlight.

## Goals

- Make `docs/` the single home for all user-facing documentation.
- Keep the npm package directory focused on source, tests, benchmarks, build
  configuration, license, and a minimal README.
- Generate complete API pages from the package source on every docs development
  session and production build.
- Document each public import path as a separate API section.
- Preserve type-checked examples and render the same source files in MDX.
- Improve public TSDoc coverage so generated pages contain useful descriptions,
  not only signatures.
- Deliver a distinctive but restrained visual design using Starlight primitives,
  small component overrides, and custom CSS.
- Keep the documentation build static, deterministic, and deployable to the
  existing Cloudflare Pages project.

## Non-goals

- Replacing Astro or Starlight.
- Hand-authoring API pages that duplicate TypeScript declarations.
- Adding localization, a blog, analytics, comments, or a custom search backend.
- Changing library runtime behavior or public TypeScript signatures.
- Building a reusable design system outside Starlight.

## Reference Principles

### OpenAI Agents JS

Use the following patterns from
<https://github.com/openai/openai-agents-js/tree/main/docs>:

- a dedicated docs workspace with its own package and Astro configuration;
- authored MDX content under `src/content/docs`;
- small Astro components and one global stylesheet;
- one `starlight-typedoc` instance per public entry point;
- generated sidebar placeholders nested under a single API Reference group;
- code examples stored as TypeScript files and imported into MDX with `?raw`;
- `starlight-llms-txt` for agent-readable documentation bundles;
- a build that fails when documentation generation is invalid.

### wagmi

Use the following product principles from <https://wagmi.sh> and
<https://github.com/wevm/wagmi/tree/main/site>:

- the package README is an entry point, not the full manual;
- the site separates onboarding, conceptual guidance, guides, and API reference;
- the landing page states the value proposition and offers an immediate route to
  getting started;
- navigation follows user intent instead of mirroring source directories.

## Repository Architecture

The resulting top-level structure is:

```text
assets/
docs/
  examples/
  public/
  src/
    components/
    content/docs/
    styles/
  astro.config.mjs
  mise.toml
  package.json
  tsconfig.json
packages/
  di-craft/
    bench/
    src/
    tsconfig/
    LICENSE
    README.md
    mise.toml
    package.json
README.md
package.json
```

`site/` is renamed to `docs/`. The current
`packages/di-craft/docs/` and `packages/di-craft/examples/` directories are
removed after their useful content is migrated.

The design specification remains outside Starlight's content collection at
`docs/superpowers/specs/` and is not included in the public site.

## Documentation Workspace

The `docs/` workspace mirrors the useful parts of the OpenAI layout without its
localization and large-SDK complexity:

```text
docs/
  examples/
    core/
    annotations/
    next/
    node/
  public/
    favicon.svg
  src/
    assets/
    components/
      Hero.astro
      Logo.astro
    content/
      docs/
        index.mdx
        introduction/
          why-di-craft.mdx
          installation.mdx
          getting-started.mdx
        core/
          tokens-and-providers.mdx
          containers-and-scopes.mdx
          disposal.mdx
        guides/
          annotations.mdx
          nextjs.mdx
          nodejs.mdx
    styles/
      global.css
  astro.config.mjs
  package.json
  tsconfig.json
  tsconfig.examples.json
  tsconfig.examples.node.json
```

Only components that materially improve the landing page or brand identity are
custom. Standard documentation UI remains implemented by Starlight.

## Information Architecture

The visible sidebar is deliberately smaller than the source tree:

```text
Overview
Introduction
  Why di-craft
  Installation
  Getting started
Core concepts
  Tokens and providers
  Containers and scopes
  Disposal
Guides
  Annotation providers
  Next.js App Router
  Node.js async context
API Reference
  di-craft
  di-craft/node
  di-craft/next/server
  di-craft/next/client
```

The API Reference group and its import-path groups are collapsed by default.
Authored pages use explicit sidebar entries so content order remains intentional.

## Generated API Reference

`docs/astro.config.mjs` creates four isolated TypeDoc plugin instances using
`createStarlightTypeDocPlugin()`:

| Public import | TypeScript entry point | Generated output |
| --- | --- | --- |
| `di-craft` | `packages/di-craft/src/index.ts` | `api/di-craft` |
| `di-craft/node` | `packages/di-craft/src/adapters/node/server.ts` | `api/node` |
| `di-craft/next/server` | `packages/di-craft/src/adapters/next/server.ts` | `api/next/server` |
| `di-craft/next/client` | `packages/di-craft/src/adapters/next/client.ts` | `api/next/client` |

The shared TypeDoc configuration will:

- use code blocks for signatures;
- render parameters and property members as readable HTML tables;
- exclude private, internal, and external declarations;
- sort public symbols by source order;
- omit a generated README landing page;
- retain valid repository source links when TypeDoc can resolve them;
- fail the docs build when an entry point produces no documentation.

Generated Markdown is build output and must not be edited manually. Its sidebar
groups are injected into the authored sidebar through the placeholders returned
by `createStarlightTypeDocPlugin()`.

## TSDoc Coverage

Every symbol reachable through a public package export must have a concise
TSDoc summary. Public functions additionally document parameters, return values,
important errors, lifecycle behavior, and at least one example when usage is not
obvious.

The TSDoc pass is documentation-only:

- no runtime implementation changes;
- no public type changes;
- no comments for internal helpers unless TypeDoc exposes them accidentally;
- repeated explanations link to authored guides instead of expanding into a
  second manual inside the API reference.

## Examples and Content Flow

Existing typed documentation examples move from
`packages/di-craft/examples/typed-docs/` to `docs/examples/`, grouped by topic.
The existing browser-safe and Node-specific TypeScript configurations move with
them and continue to run in CI.

MDX pages import canonical example files with Vite's `?raw` suffix and render
them through Starlight's `Code` component or fenced code UI. A displayed example
therefore has one source of truth:

```text
docs/examples/*.ts
  -> TypeScript typecheck
  -> MDX import with ?raw
  -> Starlight code block
```

Short fragments that are intentionally incomplete may remain inline in MDX.
Runnable or semantically important examples must be stored as checked files.

## Starlight Configuration and Plugins

The site uses:

- `@astrojs/starlight` for navigation, accessibility, responsive layout, local
  Pagefind search, SEO defaults, light/dark themes, and content schemas;
- `@astrojs/mdx` for Astro components and raw example imports in documentation;
- `starlight-typedoc` with TypeDoc and `typedoc-plugin-markdown` for generated
  API pages;
- `starlight-llms-txt` for `llms.txt` and documentation bundles;
- Starlight's built-in Expressive Code integration for code titles, focus,
  highlighting, and copy controls.

No Tailwind integration or large third-party theme is required. The limited
surface area keeps upgrades straightforward and prevents the docs from becoming
a second frontend application.

The global Starlight configuration includes:

- canonical site URL `https://di-craft.pages.dev`;
- English root locale;
- GitHub social link;
- edit links targeting the repository's `docs/` directory;
- generated API sidebar placeholders;
- local search;
- source-appropriate light and dark syntax themes;
- HTML compression for production builds.

## Visual Design

The approved mockup defines the visual direction:

- neutral, nearly monochrome surfaces with the logo's violet as the only strong
  accent;
- generous whitespace, readable line lengths, strong heading hierarchy, and
  thin borders;
- equivalent quality in light and dark modes;
- a concise landing hero with two actions, an install command, three product
  benefits, and the core mental model;
- the standard three-column documentation layout on wide screens and native
  Starlight responsive behavior on small screens;
- understated transitions only where Starlight already provides interaction;
- no decorative gradients, glass effects, oversized iconography, or dashboard
  chrome.

The landing page uses the project logo, a focused product statement, links to
Getting Started and API Reference, and feature copy derived from documented
behavior. It does not include team, sponsor, testimonial, or marketing sections.

## README Strategy

### npm package README

`packages/di-craft/README.md` becomes intentionally small:

1. project name and one-sentence positioning;
2. installation command;
3. one compact usage example;
4. prominent link to `https://di-craft.pages.dev`;
5. MIT license link.

It contains no long-form guides, hand-maintained API table, or links to files
inside the repository package directory.

### repository README

The root `README.md` remains contributor-oriented and contains:

- a short monorepo description;
- links to documentation, npm, and the package workspace;
- the updated `docs/` workspace layout;
- current install, CI, build, test, and docs development commands;
- concise Cloudflare Pages deployment notes.

The package metadata `homepage` points to the documentation site. Repository and
issue URLs remain unchanged.

## Task, Workspace, and Deployment Rename

All repository references to the old workspace name are updated consistently:

- Bun workspace path `site` becomes `docs`;
- the workspace package name becomes `docs`;
- mise config root `site` becomes `docs`;
- task namespaces change from `//site:*` to `//docs:*`;
- public root scripts use `build:docs`, `dev:docs`, `preview:docs`,
  `lint:docs`, and `format:docs`;
- build variables and source globs use `docs` terminology;
- CI path filters and docs check commands target `docs/**`;
- the Cloudflare deployment workflow watches `docs/**`;
- generated output remains compatible with the existing
  `.var/dist/cf-pages` deployment directory and Pages project.

The rename must not leave `site`, `build:site`, `dev:site`, `//site:`, or
`SITE_OUT_DIR` references in active configuration.

## Failure Behavior

The docs build fails when:

- an authored page violates the Starlight content schema;
- a TypeDoc entry point cannot be resolved or produces no reflections;
- TypeScript examples do not compile;
- an internal documentation link is broken;
- Astro cannot render an imported example or component.

Generated API content is derived locally from workspace sources. The build does
not require network access, credentials, or a published npm version.

## Validation

Implementation is complete when all of the following pass:

1. Package source and tests continue to pass their existing checks.
2. All moved documentation examples pass browser-safe and Node-specific
   TypeScript checks from the `docs` workspace.
3. `astro build` generates authored pages and all four API sections.
4. `llms.txt` output includes authored guides and generated API pages.
5. Repository-wide formatting and lint checks pass.
6. Repository-wide CI passes with renamed task namespaces.
7. The production docs build succeeds into the Cloudflare Pages output path.
8. The landing page, a guide, and representative API pages are visually checked
   at desktop and mobile widths in both light and dark themes.
9. The npm package dry-run contains only intended files and no docs/examples
   directories.
10. A repository search finds no stale active `site` workspace or task names.

## Migration Sequence

1. Rename the docs workspace and update monorepo, task, CI, and deployment paths.
2. Establish the Starlight configuration, plugins, sidebar, styling, and landing
   shell.
3. Move and reorganize authored documentation into the new content hierarchy.
4. Move typed examples, import them into MDX, and reconnect their typecheck tasks.
5. Configure four generated TypeDoc sections and the generated API sidebar.
6. Audit and complete public TSDoc comments.
7. Minimize package README and update root README and package metadata.
8. Run build, type, lint, CI, package-content, link, and visual verification.

## Acceptance Criteria

- The documentation workspace is named `docs/`; no active `site/` workspace
  remains.
- `packages/di-craft` contains neither `docs/` nor `examples/`.
- Users can reach an authored getting-started flow within one click from the
  landing page.
- Users can navigate generated API docs by exact package import path.
- Public generated API pages contain meaningful descriptions from TSDoc.
- Displayed canonical examples compile in CI and are not duplicated in MDX.
- Both READMEs have distinct, intentional roles.
- The approved minimal visual direction is implemented accessibly and
  responsively.
- Existing Cloudflare Pages deployment remains functional.
