<h1 align="center">di-craft</h1>

<p align="center">
  <img src="./assets/logo.png" alt="di-craft" width="200" />
</p>

<p align="center">
  <b>A tiny, type-safe dependency injection container for TypeScript</b>
  <br />
  <span>Framework-agnostic core with optional Next.js App Router / RSC and Node.js async-context adapters</span>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/di-craft">
    <img
      alt="npm version and bundle size"
      src="https://shieldcn.dev/group/npm/di-craft+bundlephobia/minzip/di-craft.svg?variant=secondary"
    />
  </a>
</p>

## Contents

- [Quick start](#quick-start)
- [Philosophy](#philosophy)
- [Features](#features)
- [Install](#install)
- [Core API](#core-api)
- [Guides and examples](#guides-and-examples)
- [Annotation-based providers](#annotation-based-providers)
- [Adapters](#adapters)
- [Next.js App Router](#nextjs-app-router)
- [Node.js Async Context](#nodejs-async-context)
- [API reference](#api-reference)
- [License](#license)

## Quick start

Declare typed tokens, describe how each one is built with a provider, then create
a container and resolve from it. Dependencies are wired explicitly through the
`deps` map and resolved for you.

```ts
import {
  createContainer,
  createToken,
  provideFactory,
  provideValue,
} from "di-craft";

type Config = {
  readonly prefix: string;
};

const CONFIG = createToken<Config>("config");
const MESSAGE = createToken<string>("message");
const GREETING = createToken<string>("greeting");

const container = createContainer([
  provideValue(CONFIG, { prefix: "Hello" }),
  provideValue(MESSAGE, "di-craft"),
  provideFactory(GREETING, {
    deps: {
      config: CONFIG,
      message: MESSAGE,
    },
    useFactory: ({ config, message }) => `${config.prefix}, ${message}!`,
  }),
]);

const greeting = container.get(GREETING); // string
```

## Philosophy

Dependency injection without hidden magic — no `reflect-metadata`, no runtime
type guessing, and no framework coupling. You work with just **tokens**,
**providers**, a **container**, **scopes**, and **cycle detection**. Standard
JavaScript decorators are available as optional sugar for class providers, but
they still use explicit tokens.

## Features

- Zero runtime dependencies
- Type-safe tokens and factories
- Optional `@Injectable` annotation for class providers
- Optional Next.js App Router / React Server Components adapter
- Optional Node.js AsyncLocalStorage adapter
- Optional dependencies via `optional()`
- Singleton, transient, and scoped lifetimes
- Hierarchical child containers
- Deterministic disposal with `onDispose` hooks
- Circular dependency detection
- Tree-shakable, tiny bundle size, marked with `sideEffects: false`
- ESM-only, ships with TypeScript declarations

## Install

```bash
bun add di-craft
npm install di-craft
pnpm add di-craft
yarn add di-craft
```

Requires Node.js `>= 20`. This package is ESM-only.

## Core API

```ts
import {
  Scopes,
  createChildContainer,
  createContainer,
  createToken,
  optional,
  provideFactory,
  provideValue,
} from "di-craft";
```

## Guides and Examples

Guides:

- [Core concepts](./docs/core.md)
- [Annotation-based providers](./docs/annotations.md)
- [Next.js App Router adapter](./docs/next.md)
- [Node.js async context adapter](./docs/node.md)

Typed examples checked by `bun run typecheck:examples`:

- [basic container](./examples/typed-docs/core/basic.ts)
- [scopes and child containers](./examples/typed-docs/core/scopes.ts)
- [optional dependencies](./examples/typed-docs/core/optional.ts)
- [disposal hooks](./examples/typed-docs/core/disposal.ts)
- [annotation-based providers](./examples/typed-docs/annotations/injectable.ts)
- [Next.js request scope](./examples/typed-docs/next/request-scope.ts)
- [Next.js nested Server Components](./examples/typed-docs/next/nested-server-components.ts)
- [Next.js Route Handler](./examples/typed-docs/next/route-handler.ts)
- [Next.js Server Action](./examples/typed-docs/next/server-action.ts)
- [Next.js state hydration](./examples/typed-docs/next/hydration.ts)
- [Node.js async context](./examples/typed-docs/node/async-context.ts)
- [Next.js Node runtime ALS context](./examples/typed-docs/node/next-runtime-als.ts)

## Annotation-Based Providers

`@Injectable` is optional syntax sugar for class-based providers. It keeps the
token, constructor dependencies, scope, and disposal hook next to the class, then
`provideInjectable` turns that metadata into a normal factory provider.

Annotations are only syntax sugar over normal providers. There is no
`reflect-metadata`, parameter decorators, runtime type guessing, or global
container.

See [docs/annotations.md](./docs/annotations.md) for the full guide.

## Adapters

Adapters live behind subpath exports, so React, Next.js, and Node.js
request-context APIs stay out of the core import.

| Export                 | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `di-craft/next/server` | `createNextDi`, `dehydrate`, server-side adapter types |
| `di-craft/next/client` | `hydrate`, client-boundary hydration types             |
| `di-craft/node`        | `createNodeDi`, Node.js async context adapter types    |

## Next.js App Router

The Next adapter lives behind subpath exports, so React and Next.js are not part
of the core import. It provides RSC render-scoped containers for App Router and
explicit serializable state snapshots for client boundaries.

```txt
server DI container -> serializable snapshot -> client state
```

See [docs/next.md](./docs/next.md) for render/request boundaries, Route
Handlers, Server Actions, nested Server Components, Node runtime ALS entrypoints,
and hydration examples.

## Node.js Async Context

The Node adapter uses `AsyncLocalStorage` for explicit async request scopes
outside the React Server Components render tree.

```ts
import { createNodeDi } from "di-craft/node";
```

Use it when you own the async boundary and want `getRequestContainer()` to work
in nested async calls created inside `runWithRequestContainer()`.

For Node runtime Next.js Route Handlers and Server Actions, this is the adapter
to use when you want to wrap an entrypoint once and let deep async code resolve
from the current request container.

See [docs/node.md](./docs/node.md) for the AsyncLocalStorage model and examples.

## API Reference

| Export                                     | Description                                                         |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `createToken<T>(name)`                     | Create a unique, typed token                                        |
| `provideValue(token, value)`               | Register an existing value                                          |
| `provideFactory(token, options)`           | Register a lazy factory with optional dependencies, scope, disposal |
| `@Injectable(options)`                     | Mark a class as a token-backed injectable provider                  |
| `provideInjectable(class)`                 | Create a factory provider from an injectable class                  |
| `optional(token)`                          | Mark a dependency as optional                                       |
| `createContainer(providers?)`              | Create a container                                                  |
| `createChildContainer(parent, providers?)` | Create a child container that inherits from `parent`                |
| `Scopes`                                   | `Singleton`, `Transient`, and `Scoped` scope constants              |

Exported errors: `DiError`, `MissingProviderError`, `DuplicateProviderError`,
`CircularDependencyError`, `InvalidDependencyError`, `InvalidProviderError`.

## License

[MIT](./LICENSE)
