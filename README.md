<h1 align="center">di-craft</h1>

<p align="center">
  <img src="./assets/logo.png" alt="di-craft" width="200" />
</p>

<p align="center">
  <b>A tiny, type-safe dependency injection container for TypeScript.</b>
  <br />
  Explicit providers, typed tokens, scoped containers, and an optional Next.js App Router adapter.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/di-craft">
    <img
      alt="npm version and bundle size"
      src="https://shieldcn.dev/group/npm/di-craft+bundlephobia/minzip/di-craft.svg?variant=secondary"
    />
  </a>
</p>

`di-craft` is a small DI container for TypeScript apps and libraries. It keeps
the dependency graph explicit and type-safe without relying on
`reflect-metadata`, runtime type guessing, or a global container.

Use the framework-agnostic core anywhere, or opt into the Next.js App Router /
React Server Components adapter through separate subpath exports.

## Install

```bash
npm install di-craft
```

```bash
bun add di-craft
pnpm add di-craft
yarn add di-craft
```

Requires Node.js `>= 20`. The package is ESM-only and has zero runtime
dependencies.

## Quick Start

```ts
import { createContainer, createToken, provideFactory, provideValue } from "di-craft";

const PREFIX = createToken<string>("PREFIX");
const MESSAGE = createToken<string>("MESSAGE");
const GREETING = createToken<string>("GREETING");

const container = createContainer([
  provideValue(PREFIX, "Hello"),
  provideValue(MESSAGE, "di-craft"),
  provideFactory(GREETING, {
    deps: {
      prefix: PREFIX,
      message: MESSAGE,
    },
    useFactory: ({ prefix, message }) => `${prefix}, ${message}!`,
  }),
]);

const greeting = container.get(GREETING); // string
```

Tokens carry the value type, so `container.get(GREETING)` is inferred as
`string`. Factory dependencies are inferred from the `deps` object.

## Philosophy & Features

`di-craft` is built around a few boring, useful rules: dependencies should be
visible in code, tokens should carry types, factories should receive typed
dependencies, scopes should be explicit, and framework integrations should stay
outside the core.

Features:

- Type-safe tokens and provider factories
- Explicit dependency graphs with no hidden reflection
- Singleton, transient, and scoped lifetimes
- Child containers for request-like lifecycles
- Optional dependencies with correct `T | undefined` inference
- Deterministic disposal with `onDispose` hooks
- Circular dependency detection
- Optional class annotations with `@Injectable`
- Optional Next.js App Router / RSC adapter
- Tree-shakable ESM output with TypeScript declarations

## Core

The core API is framework-agnostic:

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

Read the full core guide in [docs/core.md](./docs/core.md).

## Class Annotations

If you prefer class-based services, `@Injectable` lets a class declare its token,
dependencies, scope, and disposal hook next to the class.

```ts
import {
  Injectable,
  Scopes,
  createContainer,
  createToken,
  provideInjectable,
  provideValue,
} from "di-craft";

const CONFIG = createToken<Config>("CONFIG");
const USERS_SERVICE = createToken<UsersService>("USERS_SERVICE");

@Injectable({
  token: USERS_SERVICE,
  deps: [CONFIG],
  scope: Scopes.Scoped,
})
class UsersService {
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
  }
}

const container = createContainer([
  provideValue(CONFIG, { apiUrl: "https://api.example.com" }),
  provideInjectable(UsersService),
]);
```

Annotations are only syntax sugar over normal providers. They do not introduce
`reflect-metadata`, parameter decorators, a global container, or automatic
runtime type inference.

## Next.js App Router

The Next.js adapter is available through subpath exports, so React and Next.js
do not become part of the core package.

```ts
// app/di.server.ts
import "server-only";
import { cache } from "react";
import { provideValue } from "di-craft";
import { createNextDi } from "di-craft/next/server";

export const { getRequestContainer, runWithRequestContainer } = createNextDi({
  cache,
  providers,
  requestProviders: () => [
    provideValue(REQUEST_ID, crypto.randomUUID()),
  ],
});
```

Use the request container from Server Components:

```tsx
import { getRequestContainer } from "./di.server";

export default async function Page() {
  const usersService = getRequestContainer().get(USERS_SERVICE);
  const users = await usersService.list();

  return <UsersView users={users} />;
}
```

For Route Handlers, Server Actions, tests, or jobs where you own the lifecycle,
use `runWithRequestContainer`. It creates a child container and disposes it in a
`finally` block.

The adapter does not move a server DI container to the browser. Client hydration
is explicit and serializable:

```txt
server state -> serializable snapshot -> client state
```

Runtime subpaths:

```ts
import { createNextDi, dehydrate } from "di-craft/next/server";
import { hydrate } from "di-craft/next/client";
```

## Examples

Typed examples are kept as real TypeScript files and checked by the project:

- [Basic container](./examples/typed-docs/core/basic.ts)
- [Scopes and child containers](./examples/typed-docs/core/scopes.ts)
- [Annotation-based providers](./examples/typed-docs/annotations/injectable.ts)
- [Next.js request scope](./examples/typed-docs/next/request-scope.ts)
- [Next.js state hydration](./examples/typed-docs/next/hydration.ts)

## License

[MIT](./LICENSE)
